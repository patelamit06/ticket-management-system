import { BadRequestException, ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { randomBytes, createHash } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';

const DEFAULT_ROLE = 'attendee';
const SALT_ROUNDS = 10;
const RESET_TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hour
// Generic message returned regardless of whether the email exists (avoids account enumeration).
const RESET_REQUEST_MESSAGE =
  'If an account exists for that email, we have sent password reset instructions.';

export interface JwtPayload {
  sub: string;
  email: string;
  role: string;
}

export interface AuthResponse {
  access_token: string;
  user: { id: string; email: string; name: string | null; phone: string | null; role: string };
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    private readonly notifications: NotificationsService,
  ) {}

  async register(dto: RegisterDto): Promise<AuthResponse> {
    const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existing) {
      throw new ConflictException('An account with this email already exists');
    }
    const passwordHash = await bcrypt.hash(dto.password, SALT_ROUNDS);
    // Eventbrite-style: one account for both attending and organizing. Default role attendee;
    // any authenticated user can create events (they become event owner/organizer by creating one).
    const role = DEFAULT_ROLE;
    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        passwordHash,
        name: dto.name,
        phone: dto.phone,
        role,
      },
    });
    // Fire-and-forget: don't delay or fail registration on the welcome email
    // (sendWelcome swallows its own errors, so the floating promise is safe).
    void this.notifications.sendWelcome({ email: user.email, name: user.name });
    return this.buildAuthResponse(user);
  }

  async login(dto: LoginDto): Promise<AuthResponse> {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }
    const ok = await bcrypt.compare(dto.password, user.passwordHash);
    if (!ok) {
      throw new UnauthorizedException('Invalid email or password');
    }
    return this.buildAuthResponse(user);
  }

  /**
   * Start a password reset: generate a one-time token, store its hash + expiry on the user,
   * and email the reset link. Always returns the same generic message so callers can't probe
   * which emails are registered.
   */
  async forgotPassword(email: string): Promise<{ message: string }> {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (user) {
      const token = randomBytes(32).toString('hex');
      await this.prisma.user.update({
        where: { id: user.id },
        data: {
          passwordResetTokenHash: this.hashToken(token),
          passwordResetExpiresAt: new Date(Date.now() + RESET_TOKEN_TTL_MS),
        },
      });
      const frontendUrl = this.config.get<string>('FRONTEND_URL', 'http://localhost:3000');
      const resetUrl = `${frontendUrl.split(',')[0].trim()}/reset-password?token=${token}`;
      await this.notifications.sendPasswordReset(user.email, resetUrl);
    }
    return { message: RESET_REQUEST_MESSAGE };
  }

  /** Complete a password reset given a valid, unexpired token. */
  async resetPassword(token: string, newPassword: string): Promise<{ message: string }> {
    const user = await this.prisma.user.findFirst({
      where: {
        passwordResetTokenHash: this.hashToken(token),
        passwordResetExpiresAt: { gt: new Date() },
      },
    });
    if (!user) {
      throw new BadRequestException('This reset link is invalid or has expired.');
    }
    const passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        passwordResetTokenHash: null,
        passwordResetExpiresAt: null,
      },
    });
    return { message: 'Your password has been reset. You can now log in.' };
  }

  private hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  async validateUserById(id: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) return null;
    const { passwordHash: _, ...safe } = user;
    return safe;
  }

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.phone !== undefined && { phone: dto.phone }),
      },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        role: true,
      },
    });
    return user;
  }

  private buildAuthResponse(user: { id: string; email: string; name: string | null; phone: string | null; role: string }): AuthResponse {
    const payload: JwtPayload = { sub: user.id, email: user.email, role: user.role };
    const raw = this.config.get('JWT_EXPIRES', '15m');
    const expiresInSec = typeof raw === 'string' && raw.endsWith('m') ? parseInt(raw, 10) * 60 : parseInt(String(raw), 10) || 900;
    const access_token = this.jwt.sign(payload, { expiresIn: expiresInSec });
    return {
      access_token,
      user: { id: user.id, email: user.email, name: user.name, phone: user.phone, role: user.role },
    };
  }
}

import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

const DEFAULT_ROLE = 'attendee';
const SALT_ROUNDS = 10;

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

  async validateUserById(id: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) return null;
    const { passwordHash: _, ...safe } = user;
    return safe;
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

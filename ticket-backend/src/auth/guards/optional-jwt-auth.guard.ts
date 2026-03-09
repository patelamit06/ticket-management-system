import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * Like JwtAuthGuard but does not throw when token is missing or invalid.
 * Use on routes that support both guest and authenticated access (e.g. create order, get order).
 */
@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard('jwt') {
  handleRequest<TUser>(err: unknown, user: TUser): TUser | undefined {
    return user ?? undefined;
  }
}

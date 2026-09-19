import { createParamDecorator, type ExecutionContext } from '@nestjs/common';
import type { AuthUser } from './auth.types.js';

/** Người dùng đã đăng nhập (JwtAuthGuard gắn vào request). */
export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AuthUser => ctx.switchToHttp().getRequest<{ user: AuthUser }>().user,
);

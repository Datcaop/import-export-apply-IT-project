import { type CanActivate, type ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { DomainError } from '../common/domain-error.js';
import type { AuthUser } from './auth.types.js';
import { IS_PUBLIC } from './public.decorator.js';
import { TokenService } from './token.service.js';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly tokens: TokenService,
  ) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC, [ctx.getHandler(), ctx.getClass()]);
    if (isPublic) return true;

    const req = ctx.switchToHttp().getRequest<{ headers: Record<string, string | undefined>; user?: AuthUser }>();
    const header = req.headers.authorization ?? '';
    let token = header.startsWith('Bearer ') ? header.slice(7) : null;

    if (!token && req.headers.cookie) {
      const cookieHeader = req.headers.cookie;
      const match = cookieHeader.split(';').map((c) => c.trim()).find((c) => c.startsWith('erp_token='));
      if (match) {
        token = match.split('=')[1] ?? null;
      }
    }

    const user = token ? await this.tokens.verify(token) : null;
    if (!user) throw new DomainError('UNAUTHENTICATED', 'Phiên đăng nhập đã hết hạn. Đăng nhập lại để tiếp tục.');
    req.user = user;
    return true;
  }
}

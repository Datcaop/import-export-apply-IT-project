import { Injectable } from '@nestjs/common';
import type { LoginInput, LoginResultDto, MeDto } from '@erp/shared';
import { DomainError } from '../common/domain-error.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { verifyPassword } from './password.js';
import { TokenService } from './token.service.js';

const toMe = (u: { id: bigint; username: string; fullName: string; title: string | null }): MeDto => ({
  id: u.id.toString(),
  username: u.username,
  fullName: u.fullName,
  title: u.title,
});

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tokens: TokenService,
  ) {}

  async login(input: LoginInput): Promise<LoginResultDto> {
    const user = await this.prisma.appUser.findUnique({ where: { username: input.username.toLowerCase() } });
    const ok = user && user.isActive && (await verifyPassword(user.passwordHash, input.password));
    if (!user || !ok) {
      throw new DomainError('UNAUTHENTICATED', 'Sai tên đăng nhập hoặc mật khẩu.');
    }
    await this.prisma.appUser.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
    const token = await this.tokens.sign({ id: user.id, username: user.username, fullName: user.fullName });
    return { token, user: toMe(user) };
  }

  async me(id: bigint): Promise<MeDto> {
    const user = await this.prisma.appUser.findUnique({ where: { id } });
    if (!user || !user.isActive) {
      throw new DomainError('UNAUTHENTICATED', 'Tài khoản không còn hoạt động. Liên hệ quản trị hệ thống.');
    }
    return toMe(user);
  }
}

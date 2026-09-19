import { Controller, Get } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

@Controller('users')
export class UsersController {
  constructor(private readonly prisma: PrismaService) {}

  /** Danh sách người dùng đang hoạt động (chọn nhân viên bán hàng…) */
  @Get()
  async list() {
    const users = await this.prisma.appUser.findMany({ where: { isActive: true }, orderBy: { fullName: 'asc' } });
    return users.map((u) => ({ id: u.id.toString(), fullName: u.fullName, title: u.title }));
  }
}

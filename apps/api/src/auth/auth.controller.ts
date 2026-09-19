import { Body, Controller, Get, HttpCode, Post } from '@nestjs/common';
import { type LoginInput, loginSchema } from '@erp/shared';
import { AuthService } from './auth.service.js';
import type { AuthUser } from './auth.types.js';
import { CurrentUser } from './current-user.decorator.js';
import { Public } from './public.decorator.js';

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Public()
  @Post('login')
  @HttpCode(200)
  login(@Body({ schema: loginSchema }) body: LoginInput) {
    return this.auth.login(body);
  }

  @Get('me')
  me(@CurrentUser() user: AuthUser) {
    return this.auth.me(user.id);
  }
}

import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC = 'isPublic';
/** Bỏ qua kiểm tra đăng nhập cho route này (login, health). */
export const Public = () => SetMetadata(IS_PUBLIC, true);

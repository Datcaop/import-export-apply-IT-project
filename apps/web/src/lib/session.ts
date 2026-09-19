import { cookies } from 'next/headers';

const COOKIE_NAME = 'erp_token';
const MAX_AGE = 8 * 60 * 60; // 8h, khớp JWT_EXPIRES_IN

/** Đọc JWT token từ cookie (chỉ gọi phía server). */
export async function getToken(): Promise<string | null> {
  const jar = await cookies();
  return jar.get(COOKIE_NAME)?.value ?? null;
}

/** Ghi JWT token vào cookie httpOnly. */
export async function setToken(token: string) {
  const jar = await cookies();
  jar.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: MAX_AGE,
  });
}

/** Xóa cookie JWT. */
export async function clearToken() {
  const jar = await cookies();
  jar.delete(COOKIE_NAME);
}

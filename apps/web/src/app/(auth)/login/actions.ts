'use server';

import type { LoginResultDto } from '@erp/shared';
import { redirect } from 'next/navigation';
import { api, ApiRequestError } from '@/lib/api';
import { setToken } from '@/lib/session';

export interface LoginState {
  error?: string;
}

export async function loginAction(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const username = formData.get('username') as string;
  const password = formData.get('password') as string;
  const redirectTo = (formData.get('redirect') as string) || '/';

  if (!username || !password) {
    return { error: 'Nhập tên đăng nhập và mật khẩu.' };
  }

  try {
    const result = await api.post<LoginResultDto>('/auth/login', { username, password });
    await setToken(result.token);
  } catch (err) {
    if (err instanceof ApiRequestError) {
      return { error: err.body.message };
    }
    return { error: 'Không thể kết nối tới server. Thử lại sau.' };
  }

  redirect(redirectTo);
}

import type { MeDto } from '@erp/shared';
import { redirect } from 'next/navigation';
import { AppShell } from '@/components/layout/AppShell';
import { api, ApiRequestError } from '@/lib/api';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  let user: MeDto;
  try {
    user = await api.get<MeDto>('/auth/me');
  } catch (err) {
    if (err instanceof ApiRequestError && err.status === 401) {
      redirect('/login');
    }
    throw err;
  }

  return <AppShell user={user}>{children}</AppShell>;
}

import { redirect } from 'next/navigation';
import { clearToken } from '@/lib/session';

export async function GET() {
  await clearToken();
  redirect('/login');
}

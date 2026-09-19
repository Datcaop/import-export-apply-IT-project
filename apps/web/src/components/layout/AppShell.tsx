import type { MeDto } from '@erp/shared';
import type { ReactNode } from 'react';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';

interface AppShellProps {
  user: MeDto;
  children: ReactNode;
}

export function AppShell({ user, children }: AppShellProps) {
  return (
    <div className="min-w-[1280px] min-h-screen flex bg-bg">
      <Sidebar />
      <div className="flex-grow min-w-0 flex flex-col">
        <Topbar user={user} />
        <main className="flex-grow px-8 pt-7 pb-10 flex flex-col gap-5">
          {children}
        </main>
      </div>
    </div>
  );
}

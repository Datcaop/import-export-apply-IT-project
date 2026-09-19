import { initials } from '@erp/shared';
import type { MeDto } from '@erp/shared';
import Link from 'next/link';

interface TopbarProps {
  user: MeDto;
}

export function Topbar({ user }: TopbarProps) {
  return (
    <header className="h-[60px] shrink-0 bg-surface border-b border-border flex items-center justify-between px-8">
      {/* Search */}
      <div className="relative w-[420px]">
        <svg
          className="absolute left-3 top-3"
          width="16"
          height="16"
          viewBox="0 0 20 20"
          fill="none"
          stroke="#566575"
          strokeWidth="1.8"
          strokeLinecap="round"
        >
          <circle cx="9" cy="9" r="6" />
          <line x1="13.5" y1="13.5" x2="17" y2="17" />
        </svg>
        <input
          type="search"
          aria-label="Tìm kiếm"
          placeholder="Tìm số chứng từ, mã hàng, đối tác"
          className="h-10 w-full pl-9 pr-3 border border-border-input rounded-md text-sm text-text bg-surface-alt focus:outline-2 focus:outline-primary focus:outline-offset-1"
        />
      </div>

      {/* User */}
      <div className="flex items-center gap-3">
        <div className="flex flex-col items-end">
          <span className="text-sm font-semibold text-text">{user.fullName}</span>
          <span className="text-xs text-text-muted">{user.title ?? ''}</span>
        </div>
        <Link
          href="/logout"
          className="w-9 h-9 rounded-full bg-[#D6E2F0] text-primary flex items-center justify-center text-[13px] font-bold no-underline hover:opacity-80"
          title="Đăng xuất"
        >
          {initials(user.fullName)}
        </Link>
      </div>
    </header>
  );
}

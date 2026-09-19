import type { Tone, StatusMeta } from '@erp/shared';
import type { ReactNode } from 'react';

const toneClass: Record<Tone, string> = {
  neutral: 'bg-badge-neutral text-[#3C4957]',
  info: 'bg-badge-info text-primary',
  warning: 'bg-badge-warning text-warning',
  success: 'bg-badge-success text-success',
  muted: 'bg-badge-neutral text-[#5C6773]',
  danger: 'bg-badge-danger text-danger',
};

interface BadgeProps {
  tone?: Tone;
  children: ReactNode;
  className?: string;
}

export function Badge({ tone = 'neutral', children, className = '' }: BadgeProps) {
  return (
    <span className={`inline-flex items-center h-6 px-2.5 rounded-full text-xs font-semibold whitespace-nowrap ${toneClass[tone]} ${className}`}>
      {children}
    </span>
  );
}

interface StatusBadgeProps {
  meta: StatusMeta;
  className?: string;
}

export function StatusBadge({ meta, className }: StatusBadgeProps) {
  return (
    <Badge tone={meta.tone} className={className}>
      {meta.label}
    </Badge>
  );
}

/** Badge cho trạng thái Đang dùng / Ngừng dùng */
export function ActiveBadge({ active }: { active: boolean }) {
  return (
    <Badge tone={active ? 'success' : 'muted'}>
      {active ? 'Đang dùng' : 'Ngừng dùng'}
    </Badge>
  );
}

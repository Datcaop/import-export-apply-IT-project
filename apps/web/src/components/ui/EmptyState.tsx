import type { ReactNode } from 'react';

interface EmptyStateProps {
  title: string;
  description?: string;
  action?: ReactNode;
}

export function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <div className="text-center py-12 px-5 text-text-muted">
      {/* Empty box icon */}
      <svg className="mx-auto mb-3" width="48" height="48" viewBox="0 0 48 48" fill="none" stroke="#9AA5B1" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M6 16L24 6L42 16V32L24 42L6 32Z" />
        <path d="M6 16L24 26L42 16" />
        <line x1="24" y1="26" x2="24" y2="42" />
      </svg>
      <div className="text-base font-semibold text-text mt-3 mb-1.5">{title}</div>
      {description && <p className="mx-auto max-w-[460px] text-sm leading-[1.5] mb-4 mt-0">{description}</p>}
      {action}
    </div>
  );
}

import type { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
  compact?: boolean;
}

export function Card({ children, className = '', compact }: CardProps) {
  return (
    <div className={`bg-surface border border-border rounded-lg ${compact ? 'px-5 py-4' : 'p-5'} ${className}`}>
      {children}
    </div>
  );
}

interface CardHeadProps {
  title: string;
  action?: ReactNode;
}

export function CardHead({ title, action }: CardHeadProps) {
  return (
    <div className="flex items-center justify-between gap-3 mb-3.5">
      <h2 className="m-0 text-base font-semibold text-text">{title}</h2>
      {action}
    </div>
  );
}

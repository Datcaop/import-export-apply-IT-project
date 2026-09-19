import type { ReactNode } from 'react';

type AlertVariant = 'info' | 'danger' | 'success' | 'warning';

const variantClass: Record<AlertVariant, string> = {
  info: 'bg-primary-soft text-[#173F6E]',
  danger: 'bg-badge-danger text-[#8E1C12]',
  success: 'bg-badge-success text-[#0C5340]',
  warning: 'bg-badge-warning text-[#5E3D00]',
};

interface AlertProps {
  variant?: AlertVariant;
  children: ReactNode;
  className?: string;
}

export function Alert({ variant = 'info', children, className = '' }: AlertProps) {
  return (
    <div className={`flex gap-2.5 items-start px-3.5 py-3 rounded-md text-sm leading-[1.5] ${variantClass[variant]} ${className}`}>
      {children}
    </div>
  );
}

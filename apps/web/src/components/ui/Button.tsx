import type { ButtonHTMLAttributes, ReactNode } from 'react';

type Variant = 'default' | 'primary' | 'danger';
type Size = 'default' | 'sm';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  icon?: ReactNode;
}

const variantClass: Record<Variant, string> = {
  default: 'bg-surface text-text border-border-input hover:bg-surface-alt',
  primary: 'bg-primary text-white border-primary hover:bg-primary-hover',
  danger: 'text-danger border-[#E3B7B2] hover:bg-badge-danger',
};

const sizeClass: Record<Size, string> = {
  default: 'h-10 px-4 text-sm',
  sm: 'h-9 px-3 text-sm',
};

export function Button({ variant = 'default', size = 'default', loading, icon, children, className = '', disabled, ...props }: ButtonProps) {
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-md border font-semibold whitespace-nowrap cursor-pointer transition-colors disabled:opacity-45 disabled:cursor-not-allowed ${variantClass[variant]} ${sizeClass[size]} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      ) : icon}
      {children}
    </button>
  );
}

export function LinkButton({ variant = 'default', size = 'default', className = '', children, ...props }: ButtonProps & { href?: string }) {
  return (
    <a
      className={`inline-flex items-center justify-center gap-2 rounded-md border font-semibold whitespace-nowrap no-underline cursor-pointer transition-colors ${variantClass[variant]} ${sizeClass[size]} ${className}`}
      {...(props as React.AnchorHTMLAttributes<HTMLAnchorElement>)}
    >
      {children}
    </a>
  );
}

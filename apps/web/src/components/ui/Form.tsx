import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react';

/* ── Field wrapper ── */
interface FieldProps {
  label: string;
  htmlFor?: string;
  error?: string;
  hint?: string;
  required?: boolean;
  children: ReactNode;
  className?: string;
}

export function Field({ label, htmlFor, error, hint, required, children, className = '' }: FieldProps) {
  return (
    <div className={`flex flex-col ${className}`}>
      <label htmlFor={htmlFor} className="text-[13px] font-medium text-text mb-1.5">
        {label}
        {required && <span className="text-danger ml-0.5">*</span>}
      </label>
      {children}
      {error && <span className="text-xs text-danger mt-1">{error}</span>}
      {hint && !error && <span className="text-xs text-text-muted mt-1.5 leading-[1.45]">{hint}</span>}
    </div>
  );
}

/* ── Input ── */
interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  invalid?: boolean;
  variant?: 'default' | 'search' | 'readonly' | 'num' | 'qty';
}

const inputVariant: Record<string, string> = {
  default: '',
  search: 'pl-9 bg-surface-alt',
  readonly: 'bg-[#F3F5F8] text-[#3C4957]',
  num: 'text-right',
  qty: 'w-24 h-9 text-right',
};

export function Input({ invalid, variant = 'default', className = '', ...props }: InputProps) {
  return (
    <input
      className={`h-10 w-full px-3 border rounded-md text-sm text-text bg-surface focus:outline-2 focus:outline-primary focus:outline-offset-1 ${
        invalid ? 'border-[#C4321F] bg-[#FFF8F7]' : 'border-border-input'
      } ${inputVariant[variant]} ${className}`}
      {...props}
    />
  );
}

/* ── Textarea ── */
export function Textarea({ invalid, className = '', ...props }: TextareaHTMLAttributes<HTMLTextAreaElement> & { invalid?: boolean }) {
  return (
    <textarea
      className={`w-full px-3 py-2.5 border rounded-md text-sm text-text bg-surface leading-[1.5] resize-y min-h-20 focus:outline-2 focus:outline-primary focus:outline-offset-1 ${
        invalid ? 'border-[#C4321F] bg-[#FFF8F7]' : 'border-border-input'
      } ${className}`}
      {...props}
    />
  );
}

/* ── Select ── */
export function Select({ invalid, className = '', ...props }: SelectHTMLAttributes<HTMLSelectElement> & { invalid?: boolean }) {
  return (
    <select
      className={`h-10 w-full px-3 border rounded-md text-sm text-text bg-surface appearance-none cursor-pointer focus:outline-2 focus:outline-primary focus:outline-offset-1 ${
        invalid ? 'border-[#C4321F] bg-[#FFF8F7]' : 'border-border-input'
      } ${className}`}
      style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23566575' d='M2 4l4 4 4-4'/%3E%3C/svg%3E")`,
        backgroundPosition: 'right 12px center',
        backgroundRepeat: 'no-repeat',
        paddingRight: '32px',
      }}
      {...props}
    />
  );
}

/* ── Checkbox ── */
interface CheckboxProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
}

export function Checkbox({ label, className = '', ...props }: CheckboxProps) {
  return (
    <label className={`flex items-center gap-2 text-sm font-medium text-text cursor-pointer ${className}`}>
      <input type="checkbox" className="w-4 h-4 m-0 accent-primary" {...props} />
      {label}
    </label>
  );
}

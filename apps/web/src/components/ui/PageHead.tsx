import type { ReactNode } from 'react';
import Link from 'next/link';

interface PageHeadProps {
  breadcrumb?: { label: string; href?: string }[];
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}

export function PageHead({ breadcrumb, title, subtitle, actions }: PageHeadProps) {
  return (
    <div className="flex items-end justify-between gap-6">
      <div>
        {breadcrumb && breadcrumb.length > 0 && (
          <div className="text-[13px] text-text-muted mb-1.5">
            {breadcrumb.map((item, i) => (
              <span key={i}>
                {i > 0 && <span className="mx-1">/</span>}
                {item.href ? (
                  <Link href={item.href} className="text-text-muted no-underline hover:text-primary hover:underline">
                    {item.label}
                  </Link>
                ) : (
                  item.label
                )}
              </span>
            ))}
          </div>
        )}
        <h1 className="m-0 text-[26px] leading-[1.2] font-bold text-text tracking-[-0.01em]">{title}</h1>
        {subtitle && <div className="text-sm text-text-muted mt-1">{subtitle}</div>}
      </div>
      {actions && <div className="flex gap-2.5 shrink-0">{actions}</div>}
    </div>
  );
}

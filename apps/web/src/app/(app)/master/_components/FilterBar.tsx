'use client';

import { useRouter } from 'next/navigation';

interface FilterBarProps {
  baseUrl: string;
  q?: string;
  active?: string;
}

/** Thanh lọc dùng chung cho các trang danh mục: ô tìm kiếm + trạng thái hoạt động */
export function FilterBar({ baseUrl, q, active }: FilterBarProps) {
  const router = useRouter();

  function navigate(updates: Record<string, string | undefined>) {
    const params = new URLSearchParams();
    const merged = { q, active, ...updates };
    for (const [k, v] of Object.entries(merged)) {
      if (v !== undefined && v !== '') params.set(k, v);
    }
    params.delete('page'); // reset page on filter change
    const qs = params.toString();
    router.push(`${baseUrl}${qs ? `?${qs}` : ''}`);
  }

  return (
    <div className="flex items-center gap-3 mb-4">
      <div className="relative flex-1 max-w-sm">
        <svg className="absolute left-3 top-2.5" width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="#566575" strokeWidth="1.8" strokeLinecap="round">
          <circle cx="9" cy="9" r="6" />
          <line x1="13.5" y1="13.5" x2="17" y2="17" />
        </svg>
        <input
          type="search"
          defaultValue={q}
          placeholder="Tìm kiếm…"
          className="h-9 w-full pl-9 pr-3 border border-border-input rounded-md text-sm text-text bg-surface-alt focus:outline-2 focus:outline-primary focus:outline-offset-1"
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              navigate({ q: (e.target as HTMLInputElement).value || undefined });
            }
          }}
        />
      </div>

      <div className="flex gap-1">
        {[
          { label: 'Tất cả', value: undefined },
          { label: 'Đang dùng', value: 'true' },
          { label: 'Ngừng dùng', value: 'false' },
        ].map((opt) => (
          <button
            key={opt.label}
            type="button"
            onClick={() => navigate({ active: opt.value })}
            className={`h-9 px-3.5 rounded-full text-sm font-semibold border cursor-pointer transition-colors ${
              active === opt.value
                ? 'bg-primary text-white border-primary'
                : 'bg-surface text-text border-border-input hover:bg-surface-alt'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}

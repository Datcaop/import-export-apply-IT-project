import Link from 'next/link';

interface PaginationProps {
  page: number;
  pageSize: number;
  total: number;
  /** Base path kèm query đang có, VD '/master/products?q=abc' */
  baseUrl: string;
}

export function Pagination({ page, pageSize, total, baseUrl }: PaginationProps) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);

  function pageUrl(p: number) {
    const url = new URL(baseUrl, 'http://x');
    url.searchParams.set('page', String(p));
    return `${url.pathname}${url.search}`;
  }

  return (
    <div className="flex justify-between items-center mt-3.5 text-[13px] text-text-muted">
      <span>
        Hiển thị {from}–{to} / {total}
      </span>
      <div className="flex gap-1">
        {page > 1 && (
          <Link
            href={pageUrl(page - 1)}
            className="h-8 px-3 inline-flex items-center rounded-md border border-border-input text-sm no-underline text-text hover:bg-surface-alt"
          >
            ‹ Trước
          </Link>
        )}
        {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
          let p: number;
          if (totalPages <= 7) {
            p = i + 1;
          } else if (page <= 4) {
            p = i + 1;
          } else if (page >= totalPages - 3) {
            p = totalPages - 6 + i;
          } else {
            p = page - 3 + i;
          }
          return (
            <Link
              key={p}
              href={pageUrl(p)}
              className={`h-8 w-8 inline-flex items-center justify-center rounded-md text-sm no-underline ${
                p === page ? 'bg-primary text-white font-semibold' : 'border border-border-input text-text hover:bg-surface-alt'
              }`}
            >
              {p}
            </Link>
          );
        })}
        {page < totalPages && (
          <Link
            href={pageUrl(page + 1)}
            className="h-8 px-3 inline-flex items-center rounded-md border border-border-input text-sm no-underline text-text hover:bg-surface-alt"
          >
            Sau ›
          </Link>
        )}
      </div>
    </div>
  );
}

'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface NavItem {
  label: string;
  href: string;
}

interface NavGroup {
  title?: string;
  dot?: string; // purchase | sales | inventory | master
  items: NavItem[];
}

const NAV: NavGroup[] = [
  { items: [{ label: 'Tổng quan', href: '/' }] },
  {
    title: 'Mua hàng',
    dot: 'purchase',
    items: [
      { label: 'Đơn mua hàng', href: '/purchase/orders' },
      { label: 'Phiếu nhập kho', href: '/purchase/receipts' },
    ],
  },
  {
    title: 'Bán hàng',
    dot: 'sales',
    items: [
      { label: 'Đơn bán hàng', href: '/sales/orders' },
      { label: 'Phiếu xuất kho', href: '/sales/issues' },
    ],
  },
  {
    title: 'Kho',
    dot: 'inventory',
    items: [
      { label: 'Tồn kho', href: '/inventory/balances' },
      { label: 'Thẻ kho', href: '/inventory/transactions' },
      { label: 'Kiểm kê, điều chỉnh', href: '/inventory/adjustments' },
      { label: 'Đối soát tồn kho', href: '/inventory/reconcile' },
    ],
  },
  {
    title: 'Danh mục',
    dot: 'master',
    items: [
      { label: 'Sản phẩm', href: '/master/products' },
      { label: 'Kho hàng', href: '/master/warehouses' },
      { label: 'Nhà cung cấp', href: '/master/suppliers' },
      { label: 'Khách hàng', href: '/master/customers' },
      { label: 'Tiền tệ và tỷ giá', href: '/master/currencies' },
    ],
  },
];

const dotColor: Record<string, string> = {
  purchase: 'bg-purchase',
  sales: 'bg-sales',
  inventory: 'bg-inventory',
  master: 'bg-master',
};

export function Sidebar() {
  const pathname = usePathname();

  function isActive(href: string) {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  }

  return (
    <nav className="w-60 shrink-0 bg-surface border-r border-border px-3 py-5 flex flex-col gap-[18px]" aria-label="Điều hướng chính">
      {/* Brand */}
      <div className="flex items-center gap-2.5 px-2 pb-1.5">
        <div className="w-8 h-8 rounded-[7px] bg-primary flex items-center justify-center">
          <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="#ffffff" strokeWidth="1.7" strokeLinejoin="round">
            <path d="M3 7 L10 3 L17 7 V15 L10 18 L3 15 Z" />
            <path d="M3 7 L10 11 L17 7" />
            <line x1="10" y1="11" x2="10" y2="18" />
          </svg>
        </div>
        <div className="flex flex-col">
          <span className="font-bold text-[15px] text-text">[Tên công ty]</span>
          <span className="text-xs text-text-muted">Mua hàng, kho, bán hàng</span>
        </div>
      </div>

      {/* Nav groups */}
      {NAV.map((group, gi) => (
        <div key={gi} className="flex flex-col gap-0.5">
          {group.title && (
            <div className="flex items-center gap-2 px-2.5 pb-1.5 text-xs font-semibold text-text-muted">
              {group.dot && <span className={`w-2 h-2 rounded-full shrink-0 ${dotColor[group.dot]}`} />}
              {group.title}
            </div>
          )}
          {group.items.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? 'page' : undefined}
                className={`flex items-center h-9 rounded-md text-sm no-underline ${group.title ? 'pl-[26px]' : 'px-2.5'} ${
                  active ? 'bg-primary-soft text-primary font-semibold' : 'text-text-nav hover:bg-[#F1F4F8]'
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </div>
      ))}
    </nav>
  );
}

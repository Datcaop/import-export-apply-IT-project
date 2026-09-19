import { PurchaseOrderDto, Paged, formatMoney, formatDateTime, formatDate } from '@erp/shared';
import { api } from '@/lib/api';
import { Card } from '@/components/ui/Card';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { PageHead } from '@/components/ui/PageHead';
import { Badge } from '@/components/ui/Badge';
import { Pagination } from '@/components/ui/Pagination';
import Link from 'next/link';

interface Props { searchParams: Promise<Record<string, string | undefined>>; }

function StatusBadge({ status }: { status: string }) {
  if (status === 'DRAFT') return <Badge tone="info">Nháp</Badge>;
  if (status === 'APPROVED') return <Badge tone="info">Đã duyệt</Badge>;
  if (status === 'PARTIALLY_RECEIVED') return <Badge tone="warning">Đang nhận</Badge>;
  if (status === 'RECEIVED') return <Badge tone="success">Đã nhận đủ</Badge>;
  if (status === 'CLOSED') return <Badge tone="neutral">Đã đóng</Badge>;
  if (status === 'CANCELLED') return <Badge tone="danger">Đã hủy</Badge>;
  return <Badge>{status}</Badge>;
}

export default async function PurchaseOrdersPage({ searchParams }: Props) {
  const params = await searchParams;
  const page = params.page ?? '1';
  const q = params.q ?? '';
  const status = params.status ?? '';

  const res = await api.get<Paged<PurchaseOrderDto>>('/purchase-orders', { page, pageSize: '20', q, status });

  const columns: Column<PurchaseOrderDto>[] = [
    { 
      key: 'poNo', 
      header: 'Số PO', 
      render: (r) => (
        <Link href={`/purchase/orders/${r.id}`} className="font-semibold text-primary hover:underline">
          {r.poNo}
        </Link>
      ) 
    },
    { key: 'orderDate', header: 'Ngày đặt', render: (r) => formatDate(r.orderDate) },
    { key: 'supplier', header: 'Nhà cung cấp', render: (r) => r.supplierName },
    { key: 'total', header: 'Tổng tiền', className: 'text-right font-semibold', render: (r) => `${formatMoney(r.totalAmount)} ${r.currencyCode}` },
    { key: 'status', header: 'Trạng thái', render: (r) => <StatusBadge status={r.status} /> },
    { key: 'createdBy', header: 'Người lập', render: (r) => r.createdBy?.fullName ?? '—' },
  ];

  return (
    <>
      <PageHead
        breadcrumb={[{ label: 'Mua hàng' }, { label: 'Đơn mua hàng' }]}
        title="Đơn mua hàng"
      />

      <Card>
        <div className="flex items-center justify-between mb-4">
          <form className="flex items-center gap-3">
            <input 
              type="text" 
              name="q" 
              defaultValue={q} 
              placeholder="Tìm số PO..." 
              className="w-64 h-9 px-3 border border-border-input rounded-md text-sm outline-none focus:border-primary"
            />
            <select 
              name="status" 
              defaultValue={status}
              className="h-9 px-3 border border-border-input rounded-md text-sm outline-none focus:border-primary bg-surface"
            >
              <option value="">Tất cả trạng thái</option>
              <option value="DRAFT">Nháp</option>
              <option value="APPROVED">Đã duyệt</option>
              <option value="PARTIALLY_RECEIVED">Đang nhận</option>
              <option value="RECEIVED">Đã nhận đủ</option>
              <option value="CANCELLED">Đã hủy</option>
              <option value="CLOSED">Đã đóng</option>
            </select>
            <button type="submit" className="h-9 px-4 rounded-md bg-surface border border-border-input text-sm font-medium hover:bg-surface-alt">
              Lọc
            </button>
            {(q || status) && (
              <Link href="/purchase/orders" className="text-sm text-text-muted hover:text-text no-underline">
                Xóa lọc
              </Link>
            )}
          </form>
          <Link href="/purchase/orders/new" className="h-9 px-4 inline-flex items-center justify-center rounded-md bg-primary text-white text-sm font-semibold hover:bg-primary-hover no-underline shadow-sm">
            Tạo đơn mua hàng
          </Link>
        </div>

        <DataTable
          columns={columns}
          data={res.items}
          rowKey={(r) => r.id}
          emptyMessage="Không tìm thấy đơn mua hàng nào."
          footer={
            res.total > res.pageSize && (
              <Pagination
                page={res.page}
                pageSize={res.pageSize}
                total={res.total}
                baseUrl={`/purchase/orders?q=${q}&status=${status}`}
              />
            )
          }
        />
      </Card>
    </>
  );
}

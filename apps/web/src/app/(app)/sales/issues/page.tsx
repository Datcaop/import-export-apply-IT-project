import { GoodsIssueDto, Paged, formatDate } from '@erp/shared';
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
  if (status === 'POSTED') return <Badge tone="success">Đã ghi sổ</Badge>;
  if (status === 'CANCELLED') return <Badge tone="danger">Đã hủy</Badge>;
  return <Badge>{status}</Badge>;
}

export default async function GoodsIssuesPage({ searchParams }: Props) {
  const params = await searchParams;
  const page = params.page ?? '1';
  const q = params.q ?? '';
  const status = params.status ?? '';

  const res = await api.get<Paged<GoodsIssueDto>>('/goods-issues', { page, pageSize: '20', q, status });

  const columns: Column<GoodsIssueDto>[] = [
    { 
      key: 'giNo', 
      header: 'Số GI', 
      render: (r) => (
        <Link href={`/sales/issues/${r.id}`} className="font-semibold text-primary hover:underline">
          {r.giNo}
        </Link>
      ) 
    },
    { key: 'issueDate', header: 'Ngày xuất', render: (r) => formatDate(r.issueDate) },
    { key: 'so', header: 'Tham chiếu SO', render: (r) => r.soNo ? <Link href={`/sales/orders/${r.soId}`} className="text-primary hover:underline">{r.soNo}</Link> : '—' },
    { key: 'warehouse', header: 'Kho xuất', render: (r) => r.warehouseName },
    { key: 'status', header: 'Trạng thái', render: (r) => <StatusBadge status={r.status} /> },
    { key: 'createdBy', header: 'Người lập', render: (r) => r.createdBy?.fullName ?? '—' },
  ];

  return (
    <>
      <PageHead
        breadcrumb={[{ label: 'Bán hàng' }, { label: 'Phiếu xuất kho' }]}
        title="Phiếu xuất kho"
      />

      <Card>
        <div className="flex items-center justify-between mb-4">
          <form className="flex items-center gap-3">
            <input 
              type="text" 
              name="q" 
              defaultValue={q} 
              placeholder="Tìm số phiếu..." 
              className="w-64 h-9 px-3 border border-border-input rounded-md text-sm outline-none focus:border-primary"
            />
            <select 
              name="status" 
              defaultValue={status}
              className="h-9 px-3 border border-border-input rounded-md text-sm outline-none focus:border-primary bg-surface"
            >
              <option value="">Tất cả trạng thái</option>
              <option value="DRAFT">Nháp</option>
              <option value="POSTED">Đã ghi sổ</option>
              <option value="CANCELLED">Đã hủy</option>
            </select>
            <button type="submit" className="h-9 px-4 rounded-md bg-surface border border-border-input text-sm font-medium hover:bg-surface-alt">
              Lọc
            </button>
            {(q || status) && (
              <Link href="/sales/issues" className="text-sm text-text-muted hover:text-text no-underline">
                Xóa lọc
              </Link>
            )}
          </form>
          <div className="flex gap-2">
            <Link href="/sales/issues/new" className="h-9 px-4 inline-flex items-center justify-center rounded-md bg-primary text-white text-sm font-semibold hover:bg-primary-hover no-underline shadow-sm">
              Tạo phiếu xuất
            </Link>
          </div>
        </div>

        <DataTable
          columns={columns}
          data={res.items}
          rowKey={(r) => r.id}
          emptyMessage="Không tìm thấy phiếu xuất kho nào."
          footer={
            res.total > res.pageSize && (
              <Pagination
                page={res.page}
                pageSize={res.pageSize}
                total={res.total}
                baseUrl={`/sales/issues?q=${q}&status=${status}`}
              />
            )
          }
        />
      </Card>
    </>
  );
}

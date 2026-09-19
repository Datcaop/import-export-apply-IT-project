import type { Paged, WarehouseDto } from '@erp/shared';
import Link from 'next/link';
import { api } from '@/lib/api';
import { ActiveBadge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { PageHead } from '@/components/ui/PageHead';
import { Pagination } from '@/components/ui/Pagination';
import { FilterBar } from '../_components/FilterBar';
import { WarehouseModalWrapper } from './WarehouseModalWrapper';

interface Props { searchParams: Promise<Record<string, string | undefined>>; }

export default async function WarehousesPage({ searchParams }: Props) {
  const params = await searchParams;
  const { q, active, page } = params;
  const data = await api.get<Paged<WarehouseDto>>('/warehouses', { q, active, page: page ?? '1', pageSize: '20' });

  const columns: Column<WarehouseDto>[] = [
    { key: 'code', header: 'Mã kho', render: (r) => <Link href={`?edit=${r.id}`} className="font-semibold text-primary no-underline hover:underline">{r.code}</Link> },
    { key: 'name', header: 'Tên kho', render: (r) => r.name },
    { key: 'address', header: 'Địa chỉ', render: (r) => r.address ?? '—' },
    { key: 'sku', header: 'Mã hàng có tồn', className: 'text-right', render: (r) => r.skuInStock || '—' },
    { key: 'status', header: 'Trạng thái', render: (r) => <ActiveBadge active={r.isActive} /> },
  ];

  const baseUrl = `/master/warehouses?${new URLSearchParams(Object.fromEntries(Object.entries({ q, active }).filter(([, v]) => v !== undefined)) as Record<string, string>)}`;

  return (
    <>
      <PageHead breadcrumb={[{ label: 'Danh mục' }, { label: 'Kho hàng' }]} title="Kho hàng" subtitle={`${data.total} kho`}
        actions={<Link href="?modal=new"><Button variant="primary">+ Thêm kho</Button></Link>} />
      <Card>
        <FilterBar baseUrl="/master/warehouses" q={q} active={active} />
        <DataTable columns={columns} data={data.items} rowKey={(r) => r.id} emptyMessage="Không tìm thấy kho nào."
          footer={data.total > data.pageSize && <Pagination page={data.page} pageSize={data.pageSize} total={data.total} baseUrl={baseUrl} />} />
      </Card>
      <WarehouseModalWrapper items={data.items} />
    </>
  );
}

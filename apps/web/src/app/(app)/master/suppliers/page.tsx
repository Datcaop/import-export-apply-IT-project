import type { Paged, SupplierDto, CurrencyDto } from '@erp/shared';
import { COUNTRY_LABEL } from '@erp/shared';
import Link from 'next/link';
import { api } from '@/lib/api';
import { ActiveBadge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { PageHead } from '@/components/ui/PageHead';
import { Pagination } from '@/components/ui/Pagination';
import { FilterBar } from '../_components/FilterBar';
import { SupplierModalWrapper } from './SupplierModalWrapper';

interface Props { searchParams: Promise<Record<string, string | undefined>>; }

export default async function SuppliersPage({ searchParams }: Props) {
  const params = await searchParams;
  const { q, active, page } = params;
  const [data, currencies] = await Promise.all([
    api.get<Paged<SupplierDto>>('/suppliers', { q, active, page: page ?? '1', pageSize: '20' }),
    api.get<CurrencyDto[]>('/currencies'),
  ]);

  const columns: Column<SupplierDto>[] = [
    { key: 'code', header: 'Mã NCC', render: (r) => <Link href={`?edit=${r.id}`} className="font-semibold text-primary no-underline hover:underline">{r.code}</Link> },
    { key: 'name', header: 'Tên nhà cung cấp', render: (r) => r.name },
    { key: 'country', header: 'Quốc gia', render: (r) => r.countryCode ? COUNTRY_LABEL[r.countryCode] ?? r.countryCode : '—' },
    { key: 'currency', header: 'Tiền tệ', render: (r) => r.defaultCurrency ?? '—' },
    { key: 'po', header: 'PO mở', className: 'text-right', render: (r) => r.openPoCount || '—' },
    { key: 'status', header: 'Trạng thái', render: (r) => <ActiveBadge active={r.isActive} /> },
  ];

  const baseUrl = `/master/suppliers?${new URLSearchParams(Object.fromEntries(Object.entries({ q, active }).filter(([, v]) => v !== undefined)) as Record<string, string>)}`;

  return (
    <>
      <PageHead breadcrumb={[{ label: 'Danh mục' }, { label: 'Nhà cung cấp' }]} title="Nhà cung cấp" subtitle={`${data.total} nhà cung cấp`}
        actions={<Link href="?modal=new"><Button variant="primary">+ Thêm NCC</Button></Link>} />
      <Card>
        <FilterBar baseUrl="/master/suppliers" q={q} active={active} />
        <DataTable columns={columns} data={data.items} rowKey={(r) => r.id} emptyMessage="Không tìm thấy nhà cung cấp nào."
          footer={data.total > data.pageSize && <Pagination page={data.page} pageSize={data.pageSize} total={data.total} baseUrl={baseUrl} />} />
      </Card>
      <SupplierModalWrapper items={data.items} currencies={currencies} />
    </>
  );
}

import type { Paged, ProductDto } from '@erp/shared';
import { UOM_LABEL } from '@erp/shared';
import Link from 'next/link';
import { api } from '@/lib/api';
import { ActiveBadge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { PageHead } from '@/components/ui/PageHead';
import { Pagination } from '@/components/ui/Pagination';
import { ProductModalWrapper } from './ProductModalWrapper';
import { FilterBar } from '../_components/FilterBar';

interface Props {
  searchParams: Promise<Record<string, string | undefined>>;
}

export default async function ProductsPage({ searchParams }: Props) {
  const params = await searchParams;
  const { q, active, page } = params;

  const data = await api.get<Paged<ProductDto>>('/products', {
    q,
    active,
    page: page ?? '1',
    pageSize: '20',
  });

  const columns: Column<ProductDto>[] = [
    {
      key: 'sku',
      header: 'Mã hàng',
      render: (r) => (
        <Link href={`?edit=${r.id}`} className="font-semibold text-primary no-underline hover:underline">
          {r.sku}
        </Link>
      ),
    },
    { key: 'name', header: 'Tên sản phẩm', render: (r) => r.name },
    { key: 'uom', header: 'ĐVT', render: (r) => UOM_LABEL[r.uom] ?? r.uom },
    {
      key: 'stock',
      header: 'Tồn kho',
      className: 'text-right',
      render: (r) =>
        r.stock.length > 0
          ? r.stock.map((s) => `${s.warehouseCode}: ${s.qtyOnHand}`).join(', ')
          : '—',
    },
    {
      key: 'status',
      header: 'Trạng thái',
      render: (r) => <ActiveBadge active={r.isActive} />,
    },
  ];

  const baseUrl = `/master/products?${new URLSearchParams(
    Object.fromEntries(Object.entries({ q, active }).filter(([, v]) => v !== undefined)) as Record<string, string>,
  ).toString()}`;

  return (
    <>
      <PageHead
        breadcrumb={[{ label: 'Danh mục' }, { label: 'Sản phẩm' }]}
        title="Sản phẩm"
        subtitle={`${data.total} sản phẩm`}
        actions={
          <Link href="?modal=new">
            <Button variant="primary">+ Thêm sản phẩm</Button>
          </Link>
        }
      />

      <Card>
        <FilterBar baseUrl="/master/products" q={q} active={active} />
        <DataTable
          columns={columns}
          data={data.items}
          rowKey={(r) => r.id}
          emptyMessage="Không tìm thấy sản phẩm nào."
          footer={
            data.total > data.pageSize && (
              <Pagination page={data.page} pageSize={data.pageSize} total={data.total} baseUrl={baseUrl} />
            )
          }
        />
      </Card>

      <ProductModalWrapper products={data.items} />
    </>
  );
}

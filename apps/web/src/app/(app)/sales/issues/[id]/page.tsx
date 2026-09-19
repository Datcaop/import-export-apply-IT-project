import { PageHead } from '@/components/ui/PageHead';
import { GiForm } from '../GiForm';
import { api } from '@/lib/api';
import type { ProductDto, WarehouseDto, GoodsIssueDto, Paged } from '@erp/shared';
import { notFound } from 'next/navigation';

export default async function GoodsIssuePage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  
  let gi: GoodsIssueDto;
  try {
    gi = await api.get<GoodsIssueDto>(`/goods-issues/${resolvedParams.id}`);
  } catch {
    notFound();
  }

  const [products, warehouses] = await Promise.all([
    api.get<Paged<ProductDto>>('/master/products', { pageSize: '5000' }).then(res => res.items),
    api.get<Paged<WarehouseDto>>('/master/warehouses', { pageSize: '100' }).then(res => res.items.filter(w => w.isActive || w.id === gi.warehouseId)),
  ]);

  return (
    <>
      <PageHead
        breadcrumb={[
          { label: 'Bán hàng' },
          { label: 'Phiếu xuất kho', href: '/sales/issues' },
          { label: gi.giNo },
        ]}
        title={`Phiếu xuất kho ${gi.giNo}`}
      />
      <GiForm gi={gi} products={products} warehouses={warehouses} />
    </>
  );
}

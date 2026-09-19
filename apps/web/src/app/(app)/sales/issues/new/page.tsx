import { PageHead } from '@/components/ui/PageHead';
import { GiForm } from '../GiForm';
import { api } from '@/lib/api';
import type { ProductDto, WarehouseDto, Paged, SalesOrderDto } from '@erp/shared';

export default async function NewGoodsIssuePage({ searchParams }: { searchParams: Promise<{ soId?: string }> }) {
  const params = await searchParams;
  const soId = params.soId;
  
  let so: SalesOrderDto | undefined;
  if (soId) {
    so = await api.get<SalesOrderDto>(`/sales-orders/${soId}`);
  }

  const [products, warehouses] = await Promise.all([
    api.get<Paged<ProductDto>>('/master/products', { pageSize: '5000' }).then(res => res.items.filter(p => p.isActive)),
    api.get<Paged<WarehouseDto>>('/master/warehouses', { pageSize: '100' }).then(res => res.items.filter(w => w.isActive)),
  ]);

  return (
    <>
      <PageHead
        breadcrumb={[
          { label: 'Bán hàng' },
          { label: 'Phiếu xuất kho', href: '/sales/issues' },
          { label: 'Thêm mới' },
        ]}
        title={so ? `Tạo Phiếu xuất kho từ Đơn ${so.soNo}` : "Tạo Phiếu xuất kho"}
      />
      <GiForm so={so} products={products} warehouses={warehouses} />
    </>
  );
}

import { api } from '@/lib/api';
import { SupplierDto, CurrencyDto, ProductDto, WarehouseDto, PurchaseOrderDto } from '@erp/shared';
import { GrForm } from '../GrForm';
import { PageHead } from '@/components/ui/PageHead';

interface Props { searchParams: Promise<Record<string, string | undefined>> }

export default async function NewGoodsReceiptPage({ searchParams }: Props) {
  const params = await searchParams;
  const poId = params.poId;
  const type = params.type || 'PURCHASE';

  let po: PurchaseOrderDto | undefined;
  if (poId) {
    po = await api.get<PurchaseOrderDto>(`/purchase-orders/${poId}`);
  }

  const [suppliers, currencies, products, warehouses] = await Promise.all([
    api.get<SupplierDto[]>('/suppliers/options'),
    api.get<CurrencyDto[]>('/currencies'),
    api.get<ProductDto[]>('/products/lookup'),
    api.get<WarehouseDto[]>('/warehouses/options'),
  ]);

  return (
    <>
      <PageHead
        breadcrumb={[
          { label: 'Mua hàng' },
          { label: 'Phiếu nhập kho', href: '/purchase/receipts' },
          { label: 'Tạo mới' },
        ]}
        title="Tạo phiếu nhập kho"
      />
      <GrForm 
        defaultType={type as any} 
        po={po} 
        suppliers={suppliers} 
        currencies={currencies} 
        products={products} 
        warehouses={warehouses} 
      />
    </>
  );
}

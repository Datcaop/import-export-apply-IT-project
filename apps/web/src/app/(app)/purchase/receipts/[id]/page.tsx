import { api } from '@/lib/api';
import { SupplierDto, CurrencyDto, ProductDto, WarehouseDto, GoodsReceiptDto } from '@erp/shared';
import { GrForm } from '../GrForm';
import { PageHead } from '@/components/ui/PageHead';

interface Props { params: Promise<{ id: string }> }

export default async function EditGoodsReceiptPage({ params }: Props) {
  const { id } = await params;
  
  const [gr, suppliers, currencies, products, warehouses] = await Promise.all([
    api.get<GoodsReceiptDto>(`/goods-receipts/${id}`),
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
          { label: gr.grNo },
        ]}
        title={`Phiếu nhập kho ${gr.grNo}`}
      />
      <GrForm 
        gr={gr} 
        defaultType={gr.receiptType as any}
        suppliers={suppliers} 
        currencies={currencies} 
        products={products} 
        warehouses={warehouses}
      />
    </>
  );
}

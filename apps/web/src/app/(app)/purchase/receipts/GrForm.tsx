'use client';

import { useState, useReducer, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { SupplierDto, CurrencyDto, ProductDto, WarehouseDto, GoodsReceiptDto, PurchaseOrderDto, formatMoney, lineAmount, GoodsReceiptInputSchema, ReceiptType, D } from '@erp/shared';
import { Card, CardHead } from '@/components/ui/Card';
import { Field, Input, Select } from '@/components/ui/Form';
import { Button } from '@/components/ui/Button';
import { apiClient } from '@/lib/api-client';

interface Props {
  gr?: GoodsReceiptDto;
  po?: PurchaseOrderDto;
  defaultType: ReceiptType;
  suppliers: SupplierDto[];
  currencies: CurrencyDto[];
  products: ProductDto[];
  warehouses: WarehouseDto[];
}

type GridItem = {
  id?: string;
  poItemId?: string;
  productId: string;
  qty: string;
  unitCost: string;
  // For display only
  poOrdered?: string;
  poReceived?: string;
};

type Action = 
  | { type: 'SET_FIELD'; field: string; value: any }
  | { type: 'ADD_ITEM' }
  | { type: 'REMOVE_ITEM'; index: number }
  | { type: 'UPDATE_ITEM'; index: number; field: keyof GridItem; value: string };

function initGrid(gr?: GoodsReceiptDto, po?: PurchaseOrderDto): GridItem[] {
  if (gr) {
    const items: GridItem[] = gr.items.map(i => ({
      id: i.id,
      poItemId: i.poItemId || undefined,
      productId: i.productId,
      qty: i.qty,
      unitCost: i.unitCost,
    }));
    
    // Add candidate lines as 0 qty if draft
    if (gr.status === 'DRAFT' && gr.candidateLines) {
      gr.candidateLines.forEach(c => {
        items.push({
          poItemId: c.id,
          productId: c.productId,
          qty: '0',
          unitCost: c.unitPrice,
          poOrdered: c.qtyOrdered,
          poReceived: c.qtyReceived,
        });
      });
    }
    return items.length > 0 ? items : [{ productId: '', qty: '1', unitCost: '0' }];
  }

  if (po) {
    return po.items.map(i => ({
      poItemId: i.id,
      productId: i.productId,
      // Default qty = ordered - received
      qty: D(i.qtyOrdered).sub(i.qtyReceived).toString(),
      unitCost: i.unitPrice,
      poOrdered: i.qtyOrdered,
      poReceived: i.qtyReceived,
    })).filter(i => D(i.qty).gt(0));
  }

  return [{ productId: '', qty: '1', unitCost: '0' }];
}

export function GrForm({ gr, po, defaultType, suppliers, currencies, products, warehouses }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  const isEdit = !!gr;
  const isDraft = !gr || gr.status === 'DRAFT';

  const [header, setHeader] = useState({
    receiptType: gr?.receiptType ?? defaultType,
    poId: gr?.poId ?? po?.id ?? '',
    supplierId: gr?.supplierId ?? po?.supplierId ?? '',
    customerId: gr?.customerId ?? '',
    soId: gr?.soId ?? '',
    warehouseId: gr?.warehouseId ?? '',
    receiptDate: gr?.receiptDate ?? new Date().toISOString().split('T')[0],
    currencyCode: gr?.currencyCode ?? po?.currencyCode ?? 'VND',
    exchangeRate: gr?.exchangeRate ?? po?.exchangeRate ?? '1',
    note: gr?.note ?? '',
  });

  const [items, dispatch] = useReducer((state: GridItem[], action: Action) => {
    switch (action.type) {
      case 'ADD_ITEM':
        return [...state, { productId: '', qty: '1', unitCost: '0' }];
      case 'REMOVE_ITEM':
        return state.filter((_, i) => i !== action.index);
      case 'UPDATE_ITEM':
        const next = [...state];
        next[action.index] = { ...next[action.index], [action.field]: action.value };
        return next;
      default:
        return state;
    }
  }, null, () => initGrid(gr, po));

  const handleHeaderChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setHeader({ ...header, [e.target.name]: e.target.value });
  };

  const handleSave = async () => {
    setError('');
    // Remove items with qty = 0 (except if they are missing from DB it's fine, API will filter)
    const validItems = items.filter(i => parseFloat(i.qty || '0') > 0);
    
    const input = {
      ...header,
      items: validItems.map(i => ({ 
        id: i.id,
        poItemId: i.poItemId,
        productId: i.productId, 
        qty: i.qty, 
        unitCost: i.unitCost 
      }))
    };

    const parsed = GoodsReceiptInputSchema.safeParse(input);
    if (!parsed.success) {
      setError(parsed.error.issues[0].message);
      return;
    }

    setIsSaving(true);
    try {
      if (isEdit) {
        await apiClient.patch(`/goods-receipts/${gr.id}`, parsed.data);
      } else {
        await apiClient.post('/goods-receipts', parsed.data);
      }
      startTransition(() => {
        router.push('/purchase/receipts');
        router.refresh();
      });
    } catch (err: any) {
      setError(err.message || 'Có lỗi xảy ra');
      setIsSaving(false);
    }
  };

  const handlePost = async () => {
    if (!gr) return;
    if (!confirm('Bạn có chắc chắn muốn ghi sổ phiếu nhập này? Tồn kho sẽ được cập nhật và không thể hoàn tác.')) return;
    setIsSaving(true);
    try {
      await apiClient.post(`/goods-receipts/${gr.id}/post`, {});
      startTransition(() => {
        router.refresh();
      });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  let totalAmount = D(0);
  items.forEach(i => {
    totalAmount = totalAmount.add(lineAmount(i.qty || 0, i.unitCost || 0));
  });

  return (
    <div className="flex flex-col gap-5">
      {error && (
        <div className="bg-[#FFF8F7] border border-[#C4321F] text-[#C4321F] px-4 py-3 rounded-md text-sm">
          {error}
        </div>
      )}

      <Card>
        <CardHead title="Thông tin chung" />
        <div className="grid grid-cols-3 gap-5">
          <Field label="Loại phiếu">
            <Select name="receiptType" value={header.receiptType} onChange={handleHeaderChange} disabled={!isDraft || !!po}>
              <option value="PURCHASE">Nhập mua hàng</option>
              <option value="CUSTOMER_RETURN">Khách trả hàng</option>
              <option value="OPENING">Tồn đầu kỳ</option>
              <option value="NON_PO">Nhập khác</option>
            </Select>
          </Field>
          {header.receiptType === 'PURCHASE' && (
            <Field label="Đơn mua hàng" required>
              <Input name="poNo" value={po?.poNo ?? gr?.poNo ?? ''} disabled placeholder="Tham chiếu tự động" />
            </Field>
          )}
          
          {(header.receiptType === 'PURCHASE' || header.receiptType === 'NON_PO') && (
            <Field label="Nhà cung cấp" required={header.receiptType === 'PURCHASE'}>
              <Select name="supplierId" value={header.supplierId} onChange={handleHeaderChange} disabled={!isDraft || !!po}>
                <option value="">-- Chọn --</option>
                {suppliers.map(s => <option key={s.id} value={s.id}>{s.code} - {s.name}</option>)}
              </Select>
            </Field>
          )}

          <Field label="Kho nhập" required>
            <Select name="warehouseId" value={header.warehouseId} onChange={handleHeaderChange} disabled={!isDraft}>
              <option value="">-- Chọn kho --</option>
              {warehouses.map(w => <option key={w.id} value={w.id}>{w.code} - {w.name}</option>)}
            </Select>
          </Field>
          <Field label="Ngày nhận" required>
            <Input type="date" name="receiptDate" value={header.receiptDate} onChange={handleHeaderChange} disabled={!isDraft} />
          </Field>
          
          <Field label="Tiền tệ" required>
            <Select name="currencyCode" value={header.currencyCode} onChange={handleHeaderChange} disabled={!isDraft || !!po}>
              {currencies.map(c => <option key={c.code} value={c.code}>{c.code} - {c.name}</option>)}
            </Select>
          </Field>
          <Field label="Tỷ giá" required>
            <Input type="number" step="0.01" name="exchangeRate" value={header.exchangeRate} onChange={handleHeaderChange} disabled={!isDraft} />
          </Field>
          <Field label="Ghi chú">
            <Input name="note" value={header.note} onChange={handleHeaderChange} disabled={!isDraft} />
          </Field>
        </div>
      </Card>

      <Card>
        <CardHead title="Chi tiết sản phẩm" />
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="border-b border-border-input text-[13px] text-text-muted">
                <th className="py-2.5 font-medium w-8 text-center">#</th>
                <th className="py-2.5 font-medium">Sản phẩm</th>
                <th className="py-2.5 font-medium w-24">ĐVT</th>
                <th className="py-2.5 font-medium w-32 text-right">Thực nhận</th>
                <th className="py-2.5 font-medium w-32 text-right">Đơn giá</th>
                <th className="py-2.5 font-medium w-32 text-right">Thành tiền</th>
                {isDraft && header.receiptType !== 'PURCHASE' && <th className="py-2.5 font-medium w-12 text-center"></th>}
              </tr>
            </thead>
            <tbody>
              {items.map((item, idx) => {
                const p = products.find(p => p.id === item.productId);
                const amt = lineAmount(item.qty || 0, item.unitCost || 0);
                return (
                  <tr key={idx} className="border-b border-border-layout last:border-0">
                    <td className="py-2 text-center text-sm">{idx + 1}</td>
                    <td className="py-2">
                      <Select 
                        value={item.productId} 
                        onChange={e => dispatch({ type: 'UPDATE_ITEM', index: idx, field: 'productId', value: e.target.value })}
                        disabled={!isDraft || !!item.poItemId}
                      >
                        <option value="">-- Chọn --</option>
                        {products.map(p => <option key={p.id} value={p.id}>{p.sku} - {p.name}</option>)}
                      </Select>
                      {item.poOrdered && (
                        <div className="text-xs text-text-muted mt-1">
                          Đặt: <span className="font-medium text-text">{item.poOrdered}</span>, 
                          Đã nhận: <span className="font-medium text-text">{item.poReceived}</span>
                        </div>
                      )}
                    </td>
                    <td className="py-2 text-sm text-text-muted">{p?.uom ?? '-'}</td>
                    <td className="py-2">
                      <Input 
                        type="number" min="0" step="1" variant="num"
                        value={item.qty} 
                        onChange={e => dispatch({ type: 'UPDATE_ITEM', index: idx, field: 'qty', value: e.target.value })}
                        disabled={!isDraft}
                      />
                    </td>
                    <td className="py-2">
                      <Input 
                        type="number" min="0" step="0.01" variant="num"
                        value={item.unitCost} 
                        onChange={e => dispatch({ type: 'UPDATE_ITEM', index: idx, field: 'unitCost', value: e.target.value })}
                        disabled={!isDraft || !!item.poItemId}
                      />
                    </td>
                    <td className="py-2 text-right text-sm font-semibold">
                      {formatMoney(amt.toString())}
                    </td>
                    {isDraft && header.receiptType !== 'PURCHASE' && (
                      <td className="py-2 text-center">
                        <button type="button" onClick={() => dispatch({ type: 'REMOVE_ITEM', index: idx })} className="text-danger hover:text-danger-hover p-1">
                          ✕
                        </button>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan={6} className="py-3">
                  {isDraft && header.receiptType !== 'PURCHASE' && (
                    <button type="button" onClick={() => dispatch({ type: 'ADD_ITEM' })} className="text-sm text-primary font-medium hover:underline">
                      + Thêm dòng
                    </button>
                  )}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
        <div className="flex justify-end mt-4 pt-4 border-t border-border-layout">
          <div className="w-72 space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-text-muted">Tổng tiền ({header.currencyCode}):</span>
              <span className="font-semibold">{formatMoney(totalAmount.toString())}</span>
            </div>
          </div>
        </div>
      </Card>

      <div className="flex gap-3 justify-end">
        {isDraft && (
          <Button variant="primary" onClick={handleSave} disabled={isSaving || isPending}>
            {isSaving ? 'Đang lưu...' : (isEdit ? 'Lưu thay đổi' : 'Tạo phiếu nhập kho')}
          </Button>
        )}
        {isEdit && isDraft && (
          <Button variant="default" onClick={handlePost} disabled={isSaving || isPending}>
            Ghi sổ (Cộng kho)
          </Button>
        )}
      </div>
    </div>
  );
}

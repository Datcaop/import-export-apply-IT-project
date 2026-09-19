'use client';

import { useState, useReducer, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { ProductDto, WarehouseDto, GoodsIssueDto, SalesOrderDto, GoodsIssueInputSchema, D } from '@erp/shared';
import { Card, CardHead } from '@/components/ui/Card';
import { Field, Input, Select } from '@/components/ui/Form';
import { Button } from '@/components/ui/Button';
import { apiClient } from '@/lib/api-client';

interface Props {
  gi?: GoodsIssueDto;
  so?: SalesOrderDto;
  products: ProductDto[];
  warehouses: WarehouseDto[];
}

type GridItem = {
  id?: string;
  soItemId?: string;
  productId: string;
  qty: string;
  // For display only
  soOrdered?: string;
  soIssued?: string;
};

type Action = 
  | { type: 'SET_FIELD'; field: string; value: any }
  | { type: 'ADD_ITEM' }
  | { type: 'REMOVE_ITEM'; index: number }
  | { type: 'UPDATE_ITEM'; index: number; field: keyof GridItem; value: string };

function initGrid(gi?: GoodsIssueDto, so?: SalesOrderDto): GridItem[] {
  if (gi) {
    const items: GridItem[] = gi.items.map(i => ({
      id: i.id,
      soItemId: i.soItemId || undefined,
      productId: i.productId,
      qty: i.qty,
    }));
    
    // Add candidate lines as 0 qty if draft
    if (gi.status === 'DRAFT' && gi.candidateLines) {
      gi.candidateLines.forEach(c => {
        items.push({
          soItemId: c.id,
          productId: c.productId,
          qty: '0',
          soOrdered: c.qtyOrdered,
          soIssued: c.qtyIssued,
        });
      });
    }
    return items.length > 0 ? items : [{ productId: '', qty: '1' }];
  }

  if (so) {
    return so.items.map(i => ({
      soItemId: i.id,
      productId: i.productId,
      // Default qty = ordered - issued
      qty: D(i.qtyOrdered).sub(i.qtyIssued).toString(),
      soOrdered: i.qtyOrdered,
      soIssued: i.qtyIssued,
    })).filter(i => D(i.qty).gt(0));
  }

  return [{ productId: '', qty: '1' }];
}

export function GiForm({ gi, so, products, warehouses }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  const isEdit = !!gi;
  const isDraft = !gi || gi.status === 'DRAFT';

  const [header, setHeader] = useState({
    soId: gi?.soId ?? so?.id ?? '',
    warehouseId: gi?.warehouseId ?? so?.defaultWarehouseId ?? '',
    issueDate: gi?.issueDate ?? new Date().toISOString().split('T')[0],
    note: gi?.note ?? '',
  });

  const [items, dispatch] = useReducer((state: GridItem[], action: Action) => {
    switch (action.type) {
      case 'ADD_ITEM':
        return [...state, { productId: '', qty: '1' }];
      case 'REMOVE_ITEM':
        return state.filter((_, i) => i !== action.index);
      case 'UPDATE_ITEM':
        const next = [...state];
        next[action.index] = { ...next[action.index], [action.field]: action.value };
        return next;
      default:
        return state;
    }
  }, null, () => initGrid(gi, so));

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
        soItemId: i.soItemId,
        productId: i.productId, 
        qty: i.qty, 
      }))
    };

    const parsed = GoodsIssueInputSchema.safeParse(input);
    if (!parsed.success) {
      setError(parsed.error.issues[0].message);
      return;
    }

    setIsSaving(true);
    try {
      if (isEdit) {
        await apiClient.patch(`/goods-issues/${gi.id}`, parsed.data);
      } else {
        await apiClient.post('/goods-issues', parsed.data);
      }
      startTransition(() => {
        router.push('/sales/issues');
        router.refresh();
      });
    } catch (err: any) {
      setError(err.message || 'Có lỗi xảy ra');
      setIsSaving(false);
    }
  };

  const handlePost = async () => {
    if (!gi) return;
    if (!confirm('Bạn có chắc chắn muốn ghi sổ phiếu xuất này? Hàng sẽ được trừ khỏi kho, giá vốn sẽ được ghi nhận và không thể hoàn tác.')) return;
    setIsSaving(true);
    try {
      await apiClient.post(`/goods-issues/${gi.id}/post`, {});
      startTransition(() => {
        router.refresh();
      });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSaving(false);
    }
  };

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
          <Field label="Đơn bán hàng" required>
            <Input name="soNo" value={so?.soNo ?? gi?.soNo ?? ''} disabled placeholder="Tham chiếu tự động" />
          </Field>
          
          <Field label="Kho xuất" required>
            <Select name="warehouseId" value={header.warehouseId} onChange={handleHeaderChange} disabled={!isDraft}>
              <option value="">-- Chọn kho --</option>
              {warehouses.map(w => <option key={w.id} value={w.id}>{w.code} - {w.name}</option>)}
            </Select>
          </Field>

          <Field label="Ngày xuất" required>
            <Input type="date" name="issueDate" value={header.issueDate} onChange={handleHeaderChange} disabled={!isDraft} />
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
                <th className="py-2.5 font-medium w-32 text-right">Thực xuất</th>
                {!isDraft && <th className="py-2.5 font-medium w-32 text-right">Giá vốn</th>}
                {isDraft && !so && <th className="py-2.5 font-medium w-12 text-center"></th>}
              </tr>
            </thead>
            <tbody>
              {items.map((item, idx) => {
                const p = products.find(p => p.id === item.productId);
                return (
                  <tr key={idx} className="border-b border-border-layout last:border-0">
                    <td className="py-2 text-center text-sm">{idx + 1}</td>
                    <td className="py-2">
                      <Select 
                        value={item.productId} 
                        onChange={e => dispatch({ type: 'UPDATE_ITEM', index: idx, field: 'productId', value: e.target.value })}
                        disabled={!isDraft || !!item.soItemId}
                      >
                        <option value="">-- Chọn --</option>
                        {products.map(p => <option key={p.id} value={p.id}>{p.sku} - {p.name}</option>)}
                      </Select>
                      {item.soOrdered && (
                        <div className="text-xs text-text-muted mt-1">
                          Đặt: <span className="font-medium text-text">{item.soOrdered}</span>, 
                          Đã giao: <span className="font-medium text-text">{item.soIssued}</span>
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
                    {!isDraft && (
                      <td className="py-2 text-right text-sm">
                        {gi?.items[idx]?.unitCostBase ? Number(gi.items[idx].unitCostBase).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 }) : '-'}
                      </td>
                    )}
                    {isDraft && !so && (
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
                  {isDraft && !so && (
                    <button type="button" onClick={() => dispatch({ type: 'ADD_ITEM' })} className="text-sm text-primary font-medium hover:underline">
                      + Thêm dòng
                    </button>
                  )}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </Card>

      <div className="flex gap-3 justify-end">
        {isDraft && (
          <Button variant="primary" onClick={handleSave} disabled={isSaving || isPending}>
            {isSaving ? 'Đang lưu...' : (isEdit ? 'Lưu thay đổi' : 'Tạo phiếu xuất kho')}
          </Button>
        )}
        {isEdit && isDraft && (
          <Button variant="default" onClick={handlePost} disabled={isSaving || isPending}>
            Ghi sổ (Trừ kho)
          </Button>
        )}
      </div>
    </div>
  );
}

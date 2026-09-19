'use client';

import { useActionState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import type { ProductDto } from '@erp/shared';
import { UOM_LABEL } from '@erp/shared';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Field, Input, Select, Checkbox } from '@/components/ui/Form';
import { createProduct, updateProduct, type FormState } from './actions';

interface ProductModalProps {
  open: boolean;
  product?: ProductDto | null;
  onClose: () => void;
}

export function ProductModal({ open, product, onClose }: ProductModalProps) {
  const isEdit = !!product;
  const action = isEdit ? updateProduct : createProduct;
  const [state, formAction, pending] = useActionState<FormState, FormData>(action, {});
  const router = useRouter();

  useEffect(() => {
    if (state.success) {
      onClose();
      router.refresh();
    }
  }, [state.success, onClose, router]);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? 'Sửa sản phẩm' : 'Thêm sản phẩm'}
      footer={
        <>
          <Button type="button" onClick={onClose}>Hủy</Button>
          <Button type="submit" form="product-form" variant="primary" loading={pending}>
            {isEdit ? 'Lưu' : 'Thêm'}
          </Button>
        </>
      }
    >
      {state.error && (
        <div className="mb-4 p-3 rounded-md bg-badge-danger text-danger text-sm">{state.error}</div>
      )}
      <form id="product-form" action={formAction} className="grid grid-cols-2 gap-4 gap-x-5">
        {isEdit && <input type="hidden" name="id" value={product.id} />}

        <Field label="Mã hàng (SKU)" htmlFor="prod-sku" required error={state.fieldErrors?.sku}>
          <Input
            id="prod-sku"
            name="sku"
            defaultValue={product?.sku}
            readOnly={isEdit && product?.inUse}
            variant={isEdit && product?.inUse ? 'readonly' : 'default'}
            placeholder="VD: BP-K120"
          />
        </Field>

        <Field label="Đơn vị tính" htmlFor="prod-uom" required error={state.fieldErrors?.uom}>
          <Select id="prod-uom" name="uom" defaultValue={product?.uom ?? 'PCS'}>
            {Object.entries(UOM_LABEL).map(([code, label]) => (
              <option key={code} value={code}>{label} ({code})</option>
            ))}
          </Select>
        </Field>

        <Field label="Tên sản phẩm" htmlFor="prod-name" required error={state.fieldErrors?.name} className="col-span-2">
          <Input id="prod-name" name="name" defaultValue={product?.name} />
        </Field>

        <div className="col-span-2">
          <Checkbox name="isActive" label="Đang sử dụng" defaultChecked={product?.isActive ?? true} />
        </div>
      </form>
    </Modal>
  );
}

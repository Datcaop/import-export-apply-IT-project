'use client';

import { useActionState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import type { WarehouseDto } from '@erp/shared';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Field, Input, Textarea, Checkbox } from '@/components/ui/Form';
import { createWarehouse, updateWarehouse } from './actions';
import type { FormState } from '../products/actions';

interface Props {
  open: boolean;
  warehouse?: WarehouseDto | null;
  onClose: () => void;
}

export function WarehouseModal({ open, warehouse, onClose }: Props) {
  const isEdit = !!warehouse;
  const action = isEdit ? updateWarehouse : createWarehouse;
  const [state, formAction, pending] = useActionState<FormState, FormData>(action, {});
  const router = useRouter();

  useEffect(() => {
    if (state.success) { onClose(); router.refresh(); }
  }, [state.success, onClose, router]);

  return (
    <Modal open={open} onClose={onClose} title={isEdit ? 'Sửa kho hàng' : 'Thêm kho hàng'}
      footer={<><Button type="button" onClick={onClose}>Hủy</Button><Button type="submit" form="wh-form" variant="primary" loading={pending}>{isEdit ? 'Lưu' : 'Thêm'}</Button></>}>
      {state.error && <div className="mb-4 p-3 rounded-md bg-badge-danger text-danger text-sm">{state.error}</div>}
      <form id="wh-form" action={formAction} className="grid grid-cols-2 gap-4 gap-x-5">
        {isEdit && <input type="hidden" name="id" value={warehouse.id} />}
        <Field label="Mã kho" htmlFor="wh-code" required error={state.fieldErrors?.code}>
          <Input id="wh-code" name="code" defaultValue={warehouse?.code} readOnly={isEdit && warehouse?.inUse} variant={isEdit && warehouse?.inUse ? 'readonly' : 'default'} placeholder="VD: HN" />
        </Field>
        <Field label="Tên kho" htmlFor="wh-name" required error={state.fieldErrors?.name}>
          <Input id="wh-name" name="name" defaultValue={warehouse?.name} />
        </Field>
        <Field label="Địa chỉ" htmlFor="wh-addr" className="col-span-2" error={state.fieldErrors?.address}>
          <Textarea id="wh-addr" name="address" defaultValue={warehouse?.address ?? ''} rows={2} />
        </Field>
        <div className="col-span-2">
          <Checkbox name="isActive" label="Đang sử dụng" defaultChecked={warehouse?.isActive ?? true} />
        </div>
      </form>
    </Modal>
  );
}

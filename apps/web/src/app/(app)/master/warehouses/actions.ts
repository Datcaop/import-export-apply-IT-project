'use server';

import { revalidatePath } from 'next/cache';
import type { WarehouseCreateInput, WarehouseUpdateInput } from '@erp/shared';
import { api, ApiRequestError } from '@/lib/api';
import type { FormState } from '../products/actions';

export async function createWarehouse(_prev: FormState, formData: FormData): Promise<FormState> {
  const body: WarehouseCreateInput = {
    code: formData.get('code') as string,
    name: formData.get('name') as string,
    address: (formData.get('address') as string) || null,
    isActive: formData.get('isActive') === 'on',
  };
  try {
    await api.post('/warehouses', body);
    revalidatePath('/master/warehouses');
    return { success: true };
  } catch (err) {
    if (err instanceof ApiRequestError) return { error: err.body.message, fieldErrors: err.body.fieldErrors };
    return { error: 'Lỗi hệ thống.' };
  }
}

export async function updateWarehouse(_prev: FormState, formData: FormData): Promise<FormState> {
  const id = formData.get('id') as string;
  const body: WarehouseUpdateInput = {
    code: (formData.get('code') as string) || undefined,
    name: (formData.get('name') as string) || undefined,
    address: (formData.get('address') as string) || null,
    isActive: formData.has('isActive') ? formData.get('isActive') === 'on' : undefined,
  };
  try {
    await api.patch(`/warehouses/${id}`, body);
    revalidatePath('/master/warehouses');
    return { success: true };
  } catch (err) {
    if (err instanceof ApiRequestError) return { error: err.body.message, fieldErrors: err.body.fieldErrors };
    return { error: 'Lỗi hệ thống.' };
  }
}

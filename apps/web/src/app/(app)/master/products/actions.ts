'use server';

import { revalidatePath } from 'next/cache';
import type { ProductCreateInput, ProductUpdateInput } from '@erp/shared';
import { api, ApiRequestError } from '@/lib/api';

export interface FormState {
  success?: boolean;
  error?: string;
  fieldErrors?: Record<string, string>;
}

export async function createProduct(_prev: FormState, formData: FormData): Promise<FormState> {
  const body: ProductCreateInput = {
    sku: formData.get('sku') as string,
    name: formData.get('name') as string,
    uom: formData.get('uom') as string as ProductCreateInput['uom'],
    isActive: formData.get('isActive') === 'on',
  };
  try {
    await api.post('/products', body);
    revalidatePath('/master/products');
    return { success: true };
  } catch (err) {
    if (err instanceof ApiRequestError) {
      return { error: err.body.message, fieldErrors: err.body.fieldErrors };
    }
    return { error: 'Lỗi hệ thống.' };
  }
}

export async function updateProduct(_prev: FormState, formData: FormData): Promise<FormState> {
  const id = formData.get('id') as string;
  const body: ProductUpdateInput = {
    sku: (formData.get('sku') as string) || undefined,
    name: (formData.get('name') as string) || undefined,
    uom: (formData.get('uom') as string as ProductCreateInput['uom']) || undefined,
    isActive: formData.has('isActive') ? formData.get('isActive') === 'on' : undefined,
  };
  try {
    await api.patch(`/products/${id}`, body);
    revalidatePath('/master/products');
    return { success: true };
  } catch (err) {
    if (err instanceof ApiRequestError) {
      return { error: err.body.message, fieldErrors: err.body.fieldErrors };
    }
    return { error: 'Lỗi hệ thống.' };
  }
}

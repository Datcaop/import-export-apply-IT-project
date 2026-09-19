'use client';

import { useMemo, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import type { ProductDto } from '@erp/shared';
import { ProductModal } from './ProductModal';

export function ProductModalWrapper({ products }: { products: ProductDto[] }) {
  const searchParams = useSearchParams();
  const router = useRouter();

  const { open, editProduct } = useMemo(() => {
    const modal = searchParams.get('modal');
    const editId = searchParams.get('edit');
    if (modal === 'new') return { open: true, editProduct: null };
    if (editId) {
      const p = products.find((p) => p.id === editId) ?? null;
      return { open: !!p, editProduct: p };
    }
    return { open: false, editProduct: null };
  }, [searchParams, products]);

  const handleClose = useCallback(() => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete('modal');
    params.delete('edit');
    const qs = params.toString();
    router.push(`/master/products${qs ? `?${qs}` : ''}`, { scroll: false });
  }, [searchParams, router]);

  return <ProductModal open={open} product={editProduct} onClose={handleClose} />;
}

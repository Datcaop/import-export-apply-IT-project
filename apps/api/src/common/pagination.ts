import type { Paged } from '@erp/shared';

export const skipTake = (q: { page: number; pageSize: number }) => ({
  skip: (q.page - 1) * q.pageSize,
  take: q.pageSize,
});

export const paged = <T>(items: T[], total: number, q: { page: number; pageSize: number }): Paged<T> => ({
  items,
  total,
  page: q.page,
  pageSize: q.pageSize,
});

import type { ApiError, Paged } from '@erp/shared';
import { getToken } from './session';

const API_URL = process.env.API_URL ?? 'http://localhost:3001';

export class ApiRequestError extends Error {
  constructor(
    public readonly status: number,
    public readonly body: ApiError,
  ) {
    super(body.message);
  }
}

/** Fetch helper phía server – tự đính JWT và parse response. */
async function request<T>(method: string, path: string, opts: { body?: unknown; query?: Record<string, string | undefined> } = {}): Promise<T> {
  const token = await getToken();
  const url = new URL(`/api${path}`, API_URL);
  if (opts.query) {
    for (const [k, v] of Object.entries(opts.query)) {
      if (v !== undefined && v !== '') url.searchParams.set(k, v);
    }
  }

  const res = await fetch(url.toString(), {
    method,
    headers: {
      ...(opts.body !== undefined ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
    cache: 'no-store',
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({
      statusCode: res.status,
      code: 'INTERNAL' as const,
      message: 'Lỗi kết nối tới server.',
    }));
    throw new ApiRequestError(res.status, body as ApiError);
  }

  return res.json() as Promise<T>;
}

export const api = {
  get: <T>(path: string, query?: Record<string, string | undefined>) => request<T>('GET', path, { query }),
  post: <T>(path: string, body?: unknown) => request<T>('POST', path, { body }),
  patch: <T>(path: string, body?: unknown) => request<T>('PATCH', path, { body }),
  delete: <T>(path: string) => request<T>('DELETE', path),
};

/** Fetch danh sách phân trang – chuẩn hóa query params. */
export async function fetchPaged<T>(path: string, params: Record<string, string | undefined>): Promise<Paged<T>> {
  return api.get<Paged<T>>(path, params);
}

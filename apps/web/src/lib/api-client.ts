import type { ApiError } from '@erp/shared';

export class ApiRequestError extends Error {
  constructor(
    public readonly status: number,
    public readonly body: ApiError,
  ) {
    super(body.message);
  }
}

/** Fetch helper phía client – rely on Next.js rewrites to attach cookie. */
async function request<T>(method: string, path: string, opts: { body?: unknown; query?: Record<string, string | undefined> } = {}): Promise<T> {
  const url = new URL(`/api${path}`, window.location.origin);
  if (opts.query) {
    for (const [k, v] of Object.entries(opts.query)) {
      if (v !== undefined && v !== '') url.searchParams.set(k, v);
    }
  }

  const res = await fetch(url.toString(), {
    method,
    headers: {
      ...(opts.body !== undefined ? { 'Content-Type': 'application/json' } : {}),
    },
    body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
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

export const apiClient = {
  get: <T>(path: string, query?: Record<string, string | undefined>) => request<T>('GET', path, { query }),
  post: <T>(path: string, body?: unknown) => request<T>('POST', path, { body }),
  patch: <T>(path: string, body?: unknown) => request<T>('PATCH', path, { body }),
  delete: <T>(path: string) => request<T>('DELETE', path),
};

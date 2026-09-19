import { type NextRequest, NextResponse } from 'next/server';
import { getToken } from '@/lib/session';

const API_URL = process.env.API_URL ?? 'http://localhost:3001';

/**
 * BFF proxy: client components dùng GET `/bff/<path>` để lấy dữ liệu.
 * Route này chạy phía server, tự đính JWT rồi chuyển tiếp tới API.
 */
async function proxyRequest(request: NextRequest, params: Promise<{ path: string[] }>, method: string) {
  const token = await getToken();
  if (!token) {
    return NextResponse.json({ statusCode: 401, code: 'UNAUTHENTICATED', message: 'Chưa đăng nhập' }, { status: 401 });
  }

  const { path } = await params;
  const apiPath = `/api/${path.join('/')}`;
  const url = new URL(apiPath, API_URL);
  request.nextUrl.searchParams.forEach((v, k) => url.searchParams.set(k, v));

  const headers: Record<string, string> = { Authorization: `Bearer ${token}` };
  let body: string | undefined;

  if (method !== 'GET' && method !== 'DELETE') {
    headers['Content-Type'] = 'application/json';
    body = await request.text();
  }

  const res = await fetch(url.toString(), { method, headers, body, cache: 'no-store' });
  const resBody = await res.text();
  return new NextResponse(resBody, {
    status: res.status,
    headers: { 'Content-Type': res.headers.get('Content-Type') ?? 'application/json' },
  });
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  return proxyRequest(request, params, 'GET');
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  return proxyRequest(request, params, 'POST');
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  return proxyRequest(request, params, 'PATCH');
}

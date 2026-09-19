import { NextResponse, type NextRequest } from 'next/server';

const PUBLIC_PATHS = ['/login', '/api/', '/bff/', '/_next/', '/favicon.ico'];

export default function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Cho phép các đường dẫn public đi qua
  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  // Kiểm tra cookie JWT
  const token = request.cookies.get('erp_token')?.value;
  if (!token) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};

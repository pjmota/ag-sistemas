import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(req: NextRequest) {
  const token = req.cookies.get('token')?.value;
  const { pathname, search } = req.nextUrl;

  const isProtected = pathname.startsWith('/admin') || pathname === '/dashboard' || pathname.startsWith('/indicacoes');

  if (isProtected && !token) {
    const url = req.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('returnTo', `${pathname}${search ?? ''}`);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/dashboard', '/indicacoes/:path*'],
};
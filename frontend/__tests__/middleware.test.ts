import { middleware } from '../middleware';
import type { NextRequest } from 'next/server';

// Mock NextResponse methods to observe behavior
jest.mock('next/server', () => ({
  NextResponse: {
    redirect: jest.fn((url: any) => ({ type: 'redirect', url })),
    next: jest.fn(() => ({ type: 'next' })),
  },
}));

function makeReq(pathname: string, opts: { token?: string; search?: string } = {}): NextRequest {
  const search = opts.search ?? '';
  const token = opts.token;
  // Minimal mock for NextRequest
  const searchParams = new URLSearchParams();
  const nextUrl: any = {
    pathname,
    search,
    clone: () => ({ pathname, searchParams }),
  };
  return {
    cookies: {
      get: (name: string) => (name === 'token' && token ? { name, value: token } : undefined),
    },
    nextUrl,
  } as unknown as NextRequest;
}

describe('middleware', () => {
  beforeEach(() => {
    const { NextResponse } = require('next/server');
    (NextResponse.redirect as jest.Mock).mockClear();
    (NextResponse.next as jest.Mock).mockClear();
  });

  it('redirects /admin to /login with returnTo when no token', () => {
    const req = makeReq('/admin', { search: '?tab=users' });
    const res = middleware(req);
    const { NextResponse } = require('next/server');
    expect(res).toEqual({ type: 'redirect', url: expect.any(Object) });
    expect(NextResponse.redirect).toHaveBeenCalledTimes(1);
    const urlPassed = (NextResponse.redirect as jest.Mock).mock.calls[0][0];
    expect(urlPassed.pathname).toBe('/login');
    expect(urlPassed.searchParams.get('returnTo')).toBe('/admin?tab=users');
  });

  it('redirects /dashboard to /login with returnTo when no token', () => {
    const req = makeReq('/dashboard');
    const res = middleware(req);
    const { NextResponse } = require('next/server');
    expect(res).toEqual({ type: 'redirect', url: expect.any(Object) });
    const urlPassed = (NextResponse.redirect as jest.Mock).mock.calls[0][0];
    expect(urlPassed.pathname).toBe('/login');
    expect(urlPassed.searchParams.get('returnTo')).toBe('/dashboard');
  });

  it('redirects /indicacoes/xyz to /login with returnTo when no token', () => {
    const req = makeReq('/indicacoes/xyz', { search: '?page=2' });
    const res = middleware(req);
    const { NextResponse } = require('next/server');
    expect(res).toEqual({ type: 'redirect', url: expect.any(Object) });
    const urlPassed = (NextResponse.redirect as jest.Mock).mock.calls[0][0];
    expect(urlPassed.pathname).toBe('/login');
    expect(urlPassed.searchParams.get('returnTo')).toBe('/indicacoes/xyz?page=2');
  });

  it('allows next for protected routes when token exists', () => {
    const req1 = makeReq('/admin', { token: 'jwt' });
    const req2 = makeReq('/dashboard', { token: 'jwt' });
    const req3 = makeReq('/indicacoes/xyz', { token: 'jwt' });
    const res1 = middleware(req1);
    const res2 = middleware(req2);
    const res3 = middleware(req3);
    const { NextResponse } = require('next/server');
    expect(NextResponse.next).toHaveBeenCalledTimes(3);
    expect(res1).toEqual({ type: 'next' });
    expect(res2).toEqual({ type: 'next' });
    expect(res3).toEqual({ type: 'next' });
  });
});
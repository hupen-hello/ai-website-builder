import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const COOKIE_NAME = 'admin_token';

function getSecret() {
  return new TextEncoder().encode(
    process.env.JWT_SECRET || 'css-ai-builder-jwt-secret-change-me',
  );
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get(COOKIE_NAME)?.value;

  const isAuthPage =
    pathname.startsWith('/auth/login') ||
    pathname.startsWith('/auth/register');
  const isPublicApi = pathname.startsWith('/api/auth/');

  if (isPublicApi) {
    return NextResponse.next();
  }

  let valid = false;
  if (token) {
    try {
      const { payload } = await jwtVerify(token, getSecret());
      valid =
        payload.type === 'admin' || payload.role === 'ADMIN';
    } catch {
      valid = false;
    }
  }

  if (isAuthPage) {
    if (valid) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
    return NextResponse.next();
  }

  if (!valid) {
    const loginUrl = new URL('/auth/login', request.url);
    loginUrl.searchParams.set('next', pathname);
    const res = NextResponse.redirect(loginUrl);
    if (token) {
      res.cookies.set(COOKIE_NAME, '', { path: '/', maxAge: 0 });
    }
    return res;
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|images|fonts).*)',
  ],
};

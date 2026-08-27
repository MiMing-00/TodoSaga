import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

export function middleware(request: NextRequest): NextResponse {
  const userId = request.cookies.get('userId')?.value;
  const allowedId = process.env.ALLOWED_ID || 'admin';
  const isLoggedIn = userId === allowedId;

  // 로그인 페이지 접근
  if (request.nextUrl.pathname.startsWith('/login')) {
    if (isLoggedIn) {
      return NextResponse.redirect(new URL('/', request.url));
    }
    return NextResponse.next();
  }

  // 메인 페이지 및 기타 페이지 보호
  if (!isLoggedIn) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  // 파비콘·OG 이미지는 로그인 없이도 나가야 한다 — 공유 카드를 가져가는 건 크롤러다
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|icon|opengraph-image).*)',
  ],
};


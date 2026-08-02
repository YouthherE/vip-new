import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyJWT } from '@/lib/utils/jwt';

// Define public paths that don't require authentication
const PUBLIC_PATHS = [
  '/api/auth/login',
  '/api/auth/register',
  '/login',
  '/register',
];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Check if the path is public
  if (PUBLIC_PATHS.some(path => pathname.startsWith(path))) {
    return NextResponse.next();
  }

  // 2. API Authentication (Bearer Token)
  if (pathname.startsWith('/api/')) {
    const authHeader = request.headers.get('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { code: 401, message: 'Unauthorized: Missing or invalid token', data: null },
        { status: 401 }
      );
    }

    const token = authHeader.split(' ')[1];
    const payload = await verifyJWT(token);

    if (!payload) {
      return NextResponse.json(
        { code: 401, message: 'Unauthorized: Invalid or expired token', data: null },
        { status: 401 }
      );
    }

    // Token is valid, proceed
    return NextResponse.next();
  }

  // 3. Page Route Protection (Frontend)
  // Since the user is storing token in localStorage/Axios, the proxy (server-side) 
  // cannot easily access it unless it's in a cookie.
  // The user requested "frontend page needs to perform login interception".
  // For better security/UX, we'll let the frontend Client Component handle redirection 
  // if the token is missing in localStorage.
  // However, if we wanted server-side redirect, we would need to store the token in a cookie.
  // Given the current instruction "frontend page needs to perform login interception",
  // we will SKIP page redirection in proxy and handle it in the Client Component (AuthGuard).
  
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (images, etc)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};

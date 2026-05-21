import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * PORTABLE EXE MIDDLEWARE: RSC Payload-Requests blockieren
 * 
 * Diese Middleware fängt alle RSC-Requests ab und verhindert sie,
 * um die Console-Errors in Electron zu eliminieren.
 */
export function middleware(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;
  
  // RSC Payload-Requests blockieren
  if (searchParams.has('_rsc') || pathname.endsWith('.txt')) {
    console.log('[MIDDLEWARE] RSC Request blockiert:', pathname);
    
    // Redirect zu normaler Seite ohne RSC
    const cleanUrl = new URL(pathname.replace(/\/index\.txt$/, ''), request.url);
    cleanUrl.search = ''; // Query-Parameter entfernen
    
    return NextResponse.redirect(cleanUrl);
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};

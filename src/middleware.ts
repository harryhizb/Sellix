import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // Protect dashboard routes
    if (pathname.startsWith('/dashboard')) {
        const token = request.cookies.get('token')?.value;
        const refreshToken = request.cookies.get('refreshToken')?.value;

        // If no refresh token at all, redirect to login
        if (!refreshToken) {
            const url = request.nextUrl.clone();
            url.pathname = '/login';
            return NextResponse.redirect(url);
        }

        // If access token is missing, try to refresh it via internal API
        if (!token && refreshToken) {
            try {
                // Call the internal refresh API
                // We use the absolute URL here. 
                const refreshUrl = new URL('/api/auth/refresh', request.url);
                const response = await fetch(refreshUrl, {
                    method: 'POST',
                    headers: {
                        // We must pass the cookies manually since fetch in middleware doesn't forward them automatically
                        'Cookie': `refreshToken=${refreshToken}`
                    }
                });

                if (response.ok) {
                    // Refresh successful!
                    const data = await response.json();

                    // Create a new response to proceed with the request
                    const nextResponse = NextResponse.next({
                        request: {
                            headers: request.headers,
                        },
                    });

                    // Extract new tokens from API response
                    const accessToken = data.accessToken;

                    // Important: Update the request headers so downstream Server Components see the new cookie
                    // We need to rebuild the cookie header
                    const currentCookies = request.cookies.getAll();
                    const cookieString = currentCookies
                        .filter(c => c.name !== 'token') // Remove old token
                        .map(c => `${c.name}=${c.value}`)
                        .join('; ');

                    const newCookieHeader = `${cookieString}; token=${accessToken}`;
                    nextResponse.headers.set('cookie', newCookieHeader);

                    // Also set in response for the browser
                    nextResponse.cookies.set('token', accessToken, {
                        httpOnly: false,
                        secure: process.env.NODE_ENV === 'production',
                        sameSite: 'strict',
                        path: '/',
                        maxAge: 86400
                    });

                    // Copy Set-Cookie from API (for refreshToken rotation)
                    const setCookie = response.headers.get('set-cookie');
                    if (setCookie) {
                        // Use the response.headers to extract the specific refresh token if possible
                        // or just rely on the fact that refreshAccessToken already updated it
                        // For simplicity, we just pass through the headers
                        nextResponse.headers.append('Set-Cookie', setCookie);
                    }

                    return nextResponse;
                } else {
                    // Refresh failed (token expired or invalid)
                    const url = request.nextUrl.clone();
                    url.pathname = '/login';
                    return NextResponse.redirect(url);
                }
            } catch (error) {
                console.error('Middleware refresh error:', error);
                const url = request.nextUrl.clone();
                url.pathname = '/login';
                return NextResponse.redirect(url);
            }
        }
    }

    return NextResponse.next();
}

export const config = {
    matcher: ['/dashboard/:path*'],
};

import { getSession } from '@auth0/nextjs-auth0';
import { NextRequest, NextResponse } from 'next/server';

const backendUrl = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:5000';

async function handleProxy(req: NextRequest, { params }: { params: Promise<{ proxy: string[] }> }) {
    const { proxy } = await params;
    const path = proxy.join('/');
    
    // Create the backend URL
    const url = new URL(req.url);
    const backendEndpoint = `${backendUrl}/api/${path}${url.search}`;
    
    // Get session
    const res = new NextResponse();
    const session = await getSession(req, res);
    
    // Headers
    const headers = new Headers(req.headers);
    headers.delete('host');
    headers.delete('connection');
    headers.delete('content-length');
    
    if (session?.user?.sub) {
        headers.set('x-user-auth0-id', session.user.sub);
        headers.set('x-internal-secret', process.env.AUTH0_SECRET || '');
    }
    
    try {
        const fetchOptions: RequestInit = {
            method: req.method,
            headers: headers,
            redirect: 'manual'
        };
        
        if (req.method !== 'GET' && req.method !== 'HEAD') {
            const buffer = await req.arrayBuffer();
            if (buffer.byteLength > 0) {
                fetchOptions.body = buffer;
            }
        }

        const backendResponse = await fetch(backendEndpoint, fetchOptions);
        
        const responseHeaders = new Headers(backendResponse.headers);
        responseHeaders.delete('content-encoding');
        
        return new NextResponse(backendResponse.body, {
            status: backendResponse.status,
            statusText: backendResponse.statusText,
            headers: responseHeaders
        });
    } catch (error) {
        console.error('Proxy error:', error);
        return new NextResponse('Internal Server Error Proxy', { status: 500 });
    }
}

export const GET = handleProxy;
export const POST = handleProxy;
export const PUT = handleProxy;
export const PATCH = handleProxy;
export const DELETE = handleProxy;

import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { ADMIN_SESSION_COOKIE, backendBaseUrl, hasSameOrigin } from '../auth';

const allowedMethods = new Set(['GET', 'POST', 'PATCH', 'PUT', 'DELETE']);

const proxy: RequestHandler = async ({ request, params, cookies, fetch }) => {
	const path = params.path || '';
	if (!path || !(path === 'change-password' || path === 'terms' || path.startsWith('terms/')) || !allowedMethods.has(request.method)) {
		return json({ detail: 'Not found.' }, { status: 404 });
	}
	if (request.method !== 'GET' && !hasSameOrigin(request)) {
		return json({ detail: 'Cross-origin admin requests are not allowed.' }, { status: 403 });
	}

	const token = cookies.get(ADMIN_SESSION_COOKIE);
	if (!token) return json({ detail: 'Admin sign-in is required.' }, { status: 401 });

	try {
		const body = request.method === 'GET' ? undefined : new Uint8Array(await request.arrayBuffer());
		const upstream = await fetch(`${backendBaseUrl()}/api/v1/${path.split('/').map(encodeURIComponent).join('/')}`, {
			method: request.method,
			headers: {
				Authorization: `Bearer ${token}`,
				'ngrok-skip-browser-warning': 'true',
				...(request.headers.get('content-type') ? { 'Content-Type': request.headers.get('content-type')! } : {})
			},
			...(body?.byteLength ? { body } : {}),
			cache: 'no-store'
		});
		if (upstream.status === 204) return new Response(null, { status: 204 });
		const responseBody = await upstream.arrayBuffer();
		const response = new Response(responseBody, {
			status: upstream.status,
			headers: {
				'Content-Type': upstream.headers.get('content-type') || 'application/json',
				'Cache-Control': 'no-store'
			}
		});
		if (upstream.status === 401) cookies.delete(ADMIN_SESSION_COOKIE, { path: '/api/admin' });
		return response;
	} catch {
		return json({ detail: 'Could not reach the admin service.' }, { status: 502 });
	}
};

export const GET = proxy;
export const POST = proxy;
export const PATCH = proxy;
export const PUT = proxy;
export const DELETE = proxy;

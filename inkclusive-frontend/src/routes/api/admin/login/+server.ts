import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { ADMIN_SESSION_COOKIE, backendBaseUrl, hasSameOrigin } from '../auth';

export const POST: RequestHandler = async ({ request, cookies, url, fetch }) => {
	if (!hasSameOrigin(request)) return json({ detail: 'Cross-origin admin requests are not allowed.' }, { status: 403 });
	let password: unknown;
	try {
		password = (await request.json())?.password;
	} catch {
		return json({ detail: 'Enter your admin password.' }, { status: 400 });
	}
	if (typeof password !== 'string' || !password) {
		return json({ detail: 'Enter your admin password.' }, { status: 400 });
	}

	try {
		const response = await fetch(`${backendBaseUrl()}/api/v1/admin/login`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json', 'ngrok-skip-browser-warning': 'true' },
			body: JSON.stringify({ password }),
			cache: 'no-store'
		});
		if (!response.ok) {
			const body = await response.json().catch(() => ({}));
			return json({ detail: body.detail || 'Admin sign-in failed.' }, { status: response.status });
		}

		const result = await response.json();
		if (typeof result.access_token !== 'string' || !result.access_token) {
			return json({ detail: 'The backend returned an invalid admin session.' }, { status: 502 });
		}
		cookies.set(ADMIN_SESSION_COOKIE, result.access_token, {
			httpOnly: true,
			secure: url.protocol === 'https:',
			sameSite: 'strict',
			path: '/api/admin',
			maxAge: Number(result.expires_in) || 8 * 60 * 60
		});
		return json({ success: true }, { headers: { 'Cache-Control': 'no-store' } });
	} catch {
		return json({ detail: 'Could not reach the admin authentication service.' }, { status: 502 });
	}
};

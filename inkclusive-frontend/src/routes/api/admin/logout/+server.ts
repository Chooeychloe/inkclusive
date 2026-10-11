import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { ADMIN_SESSION_COOKIE, hasSameOrigin } from '../auth';

export const POST: RequestHandler = ({ request, cookies }) => {
	if (!hasSameOrigin(request)) return json({ detail: 'Cross-origin admin requests are not allowed.' }, { status: 403 });
	cookies.delete(ADMIN_SESSION_COOKIE, { path: '/api/admin' });
	return json({ success: true }, { headers: { 'Cache-Control': 'no-store' } });
};

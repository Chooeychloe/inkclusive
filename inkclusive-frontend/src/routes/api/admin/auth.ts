import { env as publicEnv } from '$env/dynamic/public';

export const ADMIN_SESSION_COOKIE = 'inkclusive_admin_session';

export function backendBaseUrl(): string {
	const baseUrl = publicEnv.PUBLIC_BACKEND_URL?.replace(/\/+$/, '');
	if (!baseUrl) throw new Error('PUBLIC_BACKEND_URL is not configured.');
	return baseUrl;
}

export function hasSameOrigin(request: Request): boolean {
	return request.headers.get('origin') === new URL(request.url).origin;
}

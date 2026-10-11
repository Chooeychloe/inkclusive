import { refreshStore } from '$lib/stores/refreshStore';
import { get } from 'svelte/store';
import type { TGenderTermProcessed } from './column';
import { toast } from 'svelte-sonner';

export type TermRecord = { term: string; options: string[]; category: string; guidance: string; examples: string[] };

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
	let response: Response;
	try {
		const headers = new Headers(init.headers);
		if (init.body && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json');
		response = await fetch(`/api/admin/${path}`, {
			...init,
			headers,
			credentials: 'same-origin',
			cache: 'no-store'
		});
	} catch (error) {
		throw new Error(error instanceof Error ? error.message : 'The API could not be reached.');
	}

	if (!response.ok) {
		let message = `Request failed (${response.status}).`;
		try {
			const body = await response.json();
			message = typeof body.detail === 'string' ? body.detail : message;
		} catch { /* Keep the HTTP status message when the response is not JSON. */ }
		throw new Error(message);
	}
	if (response.status === 204) return undefined as T;
	return await response.json() as T;
}

function toPayload(request: TGenderTermProcessed) {
	return {
		term: request.term.trim(),
		options: request.alternatives.split(',').map((value) => value.trim()).filter(Boolean),
		category: request.category || 'Other',
		guidance: request.guidance || '',
		examples: (request.examples || '').split(';').map((value) => value.trim()).filter(Boolean)
	};
}

export async function getTermRecords(): Promise<TermRecord[]> {
	return request<TermRecord[]>('terms');
}

export async function postBulkList(entries: TGenderTermProcessed[]): Promise<boolean> {
	try {
		await request('terms/bulk', { method: 'POST', body: JSON.stringify({ terms: entries.map(toPayload) }) });
		toast.success(`${entries.length} ${entries.length === 1 ? 'term' : 'terms'} added`);
		refreshStore.set(get(refreshStore) + 1);
		return true;
	} catch (error) {
		toast.error(error instanceof Error ? error.message : 'Could not add terms.');
		return false;
	}
}

export async function putList(term: string, alternatives: string, category = 'Other', guidance = '', examples = ''): Promise<TermRecord> {
	try {
	const updated = await request<TermRecord>(`terms/${encodeURIComponent(term)}`, {
		method: 'PATCH',
		body: JSON.stringify({
			options: alternatives.split(',').map((value) => value.trim()).filter(Boolean),
			category,
			guidance,
			examples: examples.split(';').map((value) => value.trim()).filter(Boolean)
		})
	});
	toast.success('Term updated');
	refreshStore.set(get(refreshStore) + 1);
	return updated;
	} catch (error) {
		toast.error(error instanceof Error ? error.message : 'Could not update the term.');
		throw error;
	}
}

export async function deleteListItem(term: string): Promise<void> {
	try {
		await request<void>(`terms/${encodeURIComponent(term)}`, { method: 'DELETE' });
		toast.success('Term deleted');
		refreshStore.set(get(refreshStore) + 1);
	} catch (error) {
		toast.error(error instanceof Error ? error.message : 'Could not delete the term.');
	}
}

export async function bulkDeleteListItem(terms: string[]): Promise<void> {
	try {
		const result = await request<{ deleted: number }>('terms', {
			method: 'DELETE',
			body: JSON.stringify({ terms })
		});
		toast.success(`${result.deleted} ${result.deleted === 1 ? 'term' : 'terms'} deleted`);
		refreshStore.set(get(refreshStore) + 1);
	} catch (error) {
		toast.error(error instanceof Error ? error.message : 'Could not delete terms.');
		throw error;
	}
}

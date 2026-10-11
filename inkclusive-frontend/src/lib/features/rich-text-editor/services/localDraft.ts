export const LOCAL_DRAFT_KEY = 'inkclusive.localDraft.v1';

export type LocalDraft = {
	text: string;
	html: string;
	title: string;
	updatedAt: string;
};

export function readLocalDraft(): LocalDraft | null {
	try {
		const value = localStorage.getItem(LOCAL_DRAFT_KEY);
		if (!value) return null;
		const draft = JSON.parse(value) as Partial<LocalDraft>;
		if (typeof draft.text !== 'string' || typeof draft.html !== 'string') return null;
		return {
			text: draft.text,
			html: draft.html,
			title: typeof draft.title === 'string' ? draft.title : 'Untitled_1',
			updatedAt: typeof draft.updatedAt === 'string' ? draft.updatedAt : ''
		};
	} catch {
		return null;
	}
}

export function writeLocalDraft(draft: Omit<LocalDraft, 'updatedAt'>): boolean {
	try {
		localStorage.setItem(LOCAL_DRAFT_KEY, JSON.stringify({ ...draft, updatedAt: new Date().toISOString() }));
		return true;
	} catch {
		return false;
	}
}

export function clearLocalDraft(): void {
	try { localStorage.removeItem(LOCAL_DRAFT_KEY); } catch { /* Storage can be disabled by the browser. */ }
}

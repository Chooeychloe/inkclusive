import { writable } from 'svelte/store';
import type { TSuggestion } from '../features/suggestion-bot/entities/suggestions';

export const aiSuggestions = writable<TSuggestion[]>([]);
export const replaceStore = writable<TSuggestion[]>([]);
export const genderFairReviewFindings = writable<TSuggestion[]>([]);

export function enqueueReplacements(replacements: TSuggestion[]) {
	replaceStore.update((queued) => [...queued, ...replacements]);
}

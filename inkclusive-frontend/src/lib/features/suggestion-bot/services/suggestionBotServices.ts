import { textContent } from '$lib/stores/textFromEditorStore';
import type { TSuggestion } from '$lib/features/suggestion-bot/entities/suggestions';
import { aiSuggestions } from '$lib/stores/lintingStore';
import { progressStore } from '$lib/stores/progressStore';
import { get } from 'svelte/store';
import { revisedTextStore } from '$lib/stores/revisedTextStore';
import { toast } from 'svelte-sonner';
import { getSavedPronounPreferenceMap } from '$lib/features/suggestion-bot/entities/formSchema';
import { ignoreGrammarStore } from '$lib/stores/ignoreStore';
import { getCount } from './countService';
import { env } from '$env/dynamic/public';

// const url = import.meta.env.VITE_BACKEND_URL || 'NOTHING';
const url = `${env.PUBLIC_BACKEND_URL?.replace(/\/+$/, '') ?? ''}/api/v1/`;

console.log('Backend URL:', url);

// const url = 'http://localhost:80';

export async function grammarCheckService(nextSlide: () => void) {
	try {
		const post = await fetch(`${url}grammar`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({ prompt: get(textContent) })
		});

		if (!post.ok) {
			const error = await post.json().catch(() => ({}));
			throw new Error(error.detail || `Grammar check failed (${post.status}).`);
		}
		const data = await post.json();
		console.log(data);
		await revisedTextStore.set(data.revised_text as string);
		if (Object.keys(data).length !== 0) {
			const suggestions: Promise<TSuggestion[]> = data.corrections.map(
				(correction: {
					word_index: number;
					character_offset: number;
					character_endset: number;
					original_text: string;
					message: string;
					replacements: string[];
					category?: string;
					rule_id?: string;
					examples?: string[];
				}) => ({
					indexReplacement: correction.word_index,
					originalText: correction.original_text,
					offSet: correction.character_offset,
					endSet: correction.character_endset,
					replacements: Array.isArray(correction.replacements) ? correction.replacements : [],
					correctionType: 'grammar',
					chosenReplacement: '',
					message: correction.message,
					rationale: correction.message,
					category: correction.category,
					ruleId: correction.rule_id
				})
			);

			const filteredSuggestions = await (
				await suggestions
			).filter((value) => !get(ignoreGrammarStore).includes(value.originalText));
			aiSuggestions.set(await filteredSuggestions);
			console.log('suggestions', suggestions);

			nextSlide();
			progressStore.set(50);
		} else {
			nextSlide();
			progressStore.set(50);
		}
	} catch (error) {
		toast.error(error instanceof Error ? error.message : 'The grammar service could not be reached.');
		console.error('Error:', error);
	}
}

export async function glfCheckService(nextSlide: () => void) {
	const preferenceMap = getSavedPronounPreferenceMap();

	// For Deployment
	try {
		const post = await fetch(`${url}gfl`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({
				prompt: get(textContent),
				pronoun_map: preferenceMap
			})
		});

		if (!post.ok) {
			const error = await post.json().catch(() => ({}));
			throw new Error(error.detail || `Gender-fair check failed (${post.status}).`);
		}
		const data = await post.json();
		console.log('data', data);

		await revisedTextStore.set(data.revised_text as string);

		if (Object.keys(data).length !== 0) {
			const suggestions: Promise<TSuggestion[]> = data.corrections.map(
				(correction: {
					word_index: number;
					character_offset: number;
					character_endset: number;
					original_text: string;
					message: string;
					replacements: string[] | string;
					rationale?: string;
					category?: string;
					rule_id?: string;
					examples?: string[];
				}) => ({
					indexReplacement: correction.word_index,
					originalText: correction.original_text,
					offSet: correction.character_offset,
					endSet: correction.character_endset,
					replacements: Array.isArray(correction.replacements) ? correction.replacements : [correction.replacements],
					correctionType: 'gfl',
					chosenReplacement: '',
					message: correction.message || 'Consider a gender-neutral alternative',
					rationale: correction.rationale || '',
					category: correction.category || 'Gender-fair language',
					ruleId: correction.rule_id,
					examples: correction.examples
				})
			);
			aiSuggestions.set(await suggestions);
			nextSlide();
			progressStore.set(100);

			console.log(data.revised_text);
			console.log(data, 'hello');
		} else {
			progressStore.set(100);
			nextSlide();
		}
	} catch (error) {
		toast.error(error instanceof Error ? error.message : 'The gender-fair service could not be reached.');
		console.error('Error:', error);
	}

	await getCount();
}

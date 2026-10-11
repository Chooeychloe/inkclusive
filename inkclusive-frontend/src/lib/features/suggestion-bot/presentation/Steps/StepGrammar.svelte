<script lang="ts">
	import * as Card from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import { ScrollArea } from '$lib/components/ui/scroll-area';
	import SuggestionCard from './SuggestionCard.svelte';
	import { aiSuggestions, replaceStore } from '$lib/stores/lintingStore';
	import type { TSuggestion } from '$lib/features/suggestion-bot/entities/suggestions';
	import { ArrowRight, Check, Languages, LoaderCircle, Pencil } from '@lucide/svelte';
	import { ignoreGrammarStore } from '$lib/stores/ignoreStore';
	import { waitStore } from '$lib/stores/waitStore';

	let {
		nextSlide,
		backToTheStart
	}: { nextSlide: () => Promise<void>; backToTheStart: () => void } = $props();
	let suggestionsReference = $state<TSuggestion[]>($aiSuggestions);
	let hasSuggestions = $derived(suggestionsReference.length > 0);
	let isLoading = $state(false);

	function removeMe(index: number, correctionString: string) {
		const suggestion = { ...$aiSuggestions[index], chosenReplacement: correctionString };
		$replaceStore = [suggestion];
		$aiSuggestions.splice(index, 1);
		suggestionsReference.splice(index, 1);
	}

	function applyAllChanges() {
		$replaceStore = [...$aiSuggestions]
			.sort((a, b) => b.offSet - a.offSet)
			.map((suggestion) => ({ ...suggestion, chosenReplacement: suggestion.replacements[0] }));
		$aiSuggestions = [];
	}

	function ignoreMe(index: number, ignoreString: string) {
		$aiSuggestions.splice(index, 1);
		suggestionsReference.splice(index, 1);
		if (!$ignoreGrammarStore.includes(ignoreString)) $ignoreGrammarStore.push(ignoreString);
		$aiSuggestions = [...$aiSuggestions.filter((value) => value.originalText !== ignoreString)];
	}

	$effect(() => {
		suggestionsReference = $aiSuggestions;
	});

	async function proceed() {
		if (hasSuggestions || isLoading || $waitStore) return;
		isLoading = true;
		try {
			await nextSlide();
		} finally {
			isLoading = false;
		}
	}
</script>

<ScrollArea class="w-full px-3 pb-3 pt-2 lg:h-137.5 lg:px-4 2xl:h-175">
	<Card.Root class="mb-3 w-full overflow-hidden border-border shadow-sm">
		<Card.Header class="space-y-0 bg-primary/4 p-4 pb-4">
			<div class="flex items-center justify-between gap-2">
				<div class="flex min-w-0 items-center gap-2">
					<div class="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
					<Languages class="size-5" aria-hidden="true" />
					</div>
					<p class="text-[11px] font-semibold uppercase tracking-[0.14em] text-primary">Step 2</p>
				</div>
				<span class="shrink-0 rounded-full border border-border bg-background px-2.5 py-1 text-xs font-medium text-muted-foreground">
					{suggestionsReference.length} {suggestionsReference.length === 1 ? 'suggestion' : 'suggestions'}
				</span>
			</div>
			<Card.Title class="mt-3 text-base font-semibold leading-snug">Review grammar</Card.Title>
			<Card.Description class="mt-1 leading-relaxed">Choose revisions that make your draft clearer.</Card.Description>
		</Card.Header>

		<Card.Content class="space-y-3 p-4">
			<div class={hasSuggestions ? 'flex items-start gap-2 rounded-lg border border-primary/20 bg-primary/5 p-3 text-sm text-foreground' : 'flex items-start gap-2 rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-3 text-sm text-foreground'} role="status" aria-live="polite">
				{#if hasSuggestions}
					<Languages class="size-4 shrink-0 text-primary" aria-hidden="true" />
					<p class="min-w-0 flex-1 leading-relaxed">Review each suggestion or apply all revisions before continuing.</p>
				{:else}
					<Check class="size-4 shrink-0 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
					<p class="min-w-0 flex-1 leading-relaxed">No grammar suggestions remain. You are ready for the next step.</p>
				{/if}
			</div>

			<Button class="h-11 w-full justify-between px-3" disabled={hasSuggestions || isLoading || $waitStore} onclick={proceed}>
				<span>{isLoading ? 'Preparingâ€¦' : 'Continue to Step 3'}</span>
				{#if isLoading}<LoaderCircle class="size-4 animate-spin" aria-hidden="true" />{:else}<ArrowRight class="size-4" aria-hidden="true" />{/if}
			</Button>

			<div class="grid gap-2">
				<Button variant="outline" class="w-full justify-between" disabled={!hasSuggestions || $waitStore} onclick={applyAllChanges}>
					<span class="mr-auto">Apply all revisions</span>
					<Check class="size-4 shrink-0" aria-hidden="true" />
				</Button>
				<Button variant="outline" class="w-full justify-between" disabled={$waitStore} onclick={backToTheStart}>
					<span class="mr-auto">Back to write</span>
					<Pencil class="size-4 shrink-0" aria-hidden="true" />
				</Button>
			</div>
		</Card.Content>
	</Card.Root>

	{#key $ignoreGrammarStore}
		{#key $aiSuggestions}
			{#if hasSuggestions}
				{#each suggestionsReference as payload, index}
					{#if !$ignoreGrammarStore.includes(payload.originalText)}
						<SuggestionCard suggestion={payload} {index} {removeMe} {ignoreMe} />
					{/if}
				{/each}
			{:else}
				<div class="rounded-xl border border-dashed border-border bg-card/60 px-4 py-6 text-center">
					<div class="mx-auto mb-2 flex size-9 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
						<Check class="size-5" aria-hidden="true" />
					</div>
					<p class="text-sm font-medium text-foreground">All clear</p>
					<p class="mt-1 text-xs text-muted-foreground">Your grammar suggestions have been reviewed.</p>
				</div>
			{/if}
		{/key}
	{/key}
</ScrollArea>

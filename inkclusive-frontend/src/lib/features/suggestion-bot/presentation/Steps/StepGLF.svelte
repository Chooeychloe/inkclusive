<script lang="ts">
	import * as Card from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import { ScrollArea } from '$lib/components/ui/scroll-area';
	import SuggestionCard from './SuggestionCard.svelte';
	import { aiSuggestions, replaceStore } from '$lib/stores/lintingStore';
	import type { TSuggestion } from '$lib/features/suggestion-bot/entities/suggestions';
	import { ArrowRight, Check, HeartHandshake, Languages, Pencil } from '@lucide/svelte';
	import { GLFScore } from '$lib/stores/omegaLOL';
	import { waitStore } from '$lib/stores/waitStore';
	import { suggestionSessionStore } from '$lib/stores/suggestionSessionStore';

	let {
		nextSlide,
		goBackToGrammar,
		backToTheStart
	}: { nextSlide: () => void; goBackToGrammar: () => void; backToTheStart: () => void } = $props();
	let suggestionsReference = $state<TSuggestion[]>($aiSuggestions);
	let appliedSuggestions = $state<{ suggestion: TSuggestion; applied: boolean; currentOffset: number }[]>([]);
	let reviewTab = $state<'pending' | 'applied'>('pending');
	let lastSuggestionSession = $state($suggestionSessionStore);
	let hasSuggestions = $derived(suggestionsReference.length > 0);

	function removeMe(index: number, correctionString: string) {
		const suggestion = { ...$aiSuggestions[index], chosenReplacement: correctionString };
		shiftAppliedOffsets(suggestion.offSet, suggestion.originalText.length, correctionString.length);
		appliedSuggestions = [...appliedSuggestions.filter((item) => item.applied), { suggestion, applied: true, currentOffset: suggestion.offSet }];
		$replaceStore = [suggestion];
		$aiSuggestions = $aiSuggestions.filter((_, itemIndex) => itemIndex !== index);
		reviewTab = 'applied';
	}

	function shiftAppliedOffsets(position: number, oldLength: number, newLength: number) {
		const delta = newLength - oldLength;
		if (delta === 0) return;
		appliedSuggestions = appliedSuggestions.map((item) => item.currentOffset > position
			? { ...item, currentOffset: item.currentOffset + delta }
			: item);
	}

	function applyAllChanges() {
		if ($aiSuggestions[0]?.correctionType === 'gfl') $GLFScore += $aiSuggestions.length;
		const selected = [...$aiSuggestions]
			.sort((a, b) => b.offSet - a.offSet)
			.map((suggestion) => ({ ...suggestion, chosenReplacement: suggestion.replacements[0] }));
		let nextApplied = appliedSuggestions.filter((item) => item.applied);
		for (const suggestion of selected) {
			const delta = suggestion.chosenReplacement.length - suggestion.originalText.length;
			nextApplied = nextApplied.map((item) => item.currentOffset > suggestion.offSet
				? { ...item, currentOffset: item.currentOffset + delta }
				: item);
			nextApplied.push({ suggestion, applied: true, currentOffset: suggestion.offSet });
		}
		appliedSuggestions = nextApplied;
		$replaceStore = selected;
		$aiSuggestions = [];
		reviewTab = 'applied';
	}

	function undoApplied(index: number) {
		const item = appliedSuggestions[index];
		if (!item?.applied) return;
		const { suggestion, currentOffset } = item;
		$replaceStore = [{ ...suggestion, offSet: currentOffset, endSet: currentOffset + suggestion.chosenReplacement.length, chosenReplacement: suggestion.originalText }];
		$GLFScore = Math.max(0, $GLFScore - 1);
		shiftAppliedOffsets(currentOffset, suggestion.chosenReplacement.length, suggestion.originalText.length);
		appliedSuggestions[index] = { ...item, applied: false };
		appliedSuggestions = [...appliedSuggestions];
	}
	function redoApplied(index: number) {
		const item = appliedSuggestions[index];
		if (!item || item.applied) return;
		const { suggestion, currentOffset } = item;
		$replaceStore = [{ ...suggestion, offSet: currentOffset, endSet: currentOffset + suggestion.originalText.length, chosenReplacement: suggestion.chosenReplacement }];
		$GLFScore += 1;
		shiftAppliedOffsets(currentOffset, suggestion.originalText.length, suggestion.chosenReplacement.length);
		appliedSuggestions[index] = { ...item, applied: true };
		appliedSuggestions = [...appliedSuggestions];
	}

	function ignoreMe(index: number) {
		$aiSuggestions.splice(index, 1);
		suggestionsReference.splice(index, 1);
		$aiSuggestions = [...$aiSuggestions];
	}

	$effect(() => {
		if ($suggestionSessionStore !== lastSuggestionSession) {
			lastSuggestionSession = $suggestionSessionStore;
			appliedSuggestions = [];
			reviewTab = 'pending';
		}
	});

	$effect(() => {
		suggestionsReference = $aiSuggestions;
	});
</script>

<ScrollArea class="w-full px-3 pb-3 pt-2 lg:h-137.5 lg:px-4 2xl:h-175">
	<Card.Root class="mb-3 w-full overflow-hidden border-border shadow-sm">
		<Card.Header class="space-y-0 bg-primary/4 p-4 pb-4">
			<div class="flex items-center justify-between gap-2">
				<div class="flex min-w-0 items-center gap-2">
					<div class="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
					<HeartHandshake class="size-5" aria-hidden="true" />
					</div>
					<p class="text-[11px] font-semibold uppercase tracking-[0.14em] text-primary">Step 3</p>
				</div>
				<span class="shrink-0 rounded-full border border-border bg-background px-2.5 py-1 text-xs font-medium text-muted-foreground">
					{suggestionsReference.length} {suggestionsReference.length === 1 ? 'suggestion' : 'suggestions'}
				</span>
			</div>
			<Card.Title class="mt-3 text-base font-semibold leading-snug">Review inclusive language</Card.Title>
			<Card.Description class="mt-1 leading-relaxed">Consider alternatives that preserve your intended meaning.</Card.Description>
		</Card.Header>

		<Card.Content class="space-y-3 p-4">
			<div class={hasSuggestions ? 'flex items-start gap-2 rounded-lg border border-primary/20 bg-primary/5 p-3 text-sm text-foreground' : 'flex items-start gap-2 rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-3 text-sm text-foreground'} role="status" aria-live="polite">
				{#if hasSuggestions}
					<HeartHandshake class="size-4 shrink-0 text-primary" aria-hidden="true" />
					<p class="min-w-0 flex-1 leading-relaxed">Review each suggestion or apply all revisions to finish this step.</p>
				{:else}
					<Check class="size-4 shrink-0 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
					<p class="min-w-0 flex-1 leading-relaxed">No gender-fair suggestions remain. You are ready to view your summary.</p>
				{/if}
			</div>

			<Button class="h-11 w-full justify-between px-4" disabled={hasSuggestions || $waitStore} onclick={nextSlide}>
				<span>Continue to summary</span>
				<ArrowRight class="size-4" aria-hidden="true" />
			</Button>

			<div class="grid gap-2">
				<Button variant="outline" class="w-full justify-between" disabled={!hasSuggestions || $waitStore} onclick={applyAllChanges}>
					<span>Apply all suggestions</span>
					<Check class="size-4" aria-hidden="true" />
				</Button>
			</div>

			<div class="grid grid-cols-2 gap-2">
				<Button variant="outline" class="min-w-0 gap-1 px-1.5 text-xs" aria-label="Return to grammar review" title="Return to grammar review" disabled={$waitStore} onclick={goBackToGrammar}>
					<Languages class="size-4 shrink-0" aria-hidden="true" />
					<span>Grammar</span>
				</Button>
				<Button variant="outline" class="min-w-0 gap-1 px-1.5 text-xs" aria-label="Return to writing" title="Return to writing" disabled={$waitStore} onclick={backToTheStart}>
					<Pencil class="size-4 shrink-0" aria-hidden="true" />
					<span>Write</span>
				</Button>
			</div>
		</Card.Content>
	</Card.Root>

	<div class="mb-3 grid grid-cols-2 gap-1 rounded-lg border border-border bg-muted/50 p-1" role="tablist" aria-label="Suggestion lists">
		<button role="tab" aria-selected={reviewTab === 'pending'} class="rounded-md px-3 py-2 text-sm font-medium {reviewTab === 'pending' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground'}" onclick={() => (reviewTab = 'pending')}>Suggestions ({suggestionsReference.length})</button>
		<button role="tab" aria-selected={reviewTab === 'applied'} class="rounded-md px-3 py-2 text-sm font-medium {reviewTab === 'applied' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground'}" onclick={() => (reviewTab = 'applied')}>Applied ({appliedSuggestions.length})</button>
	</div>
	{#if reviewTab === 'pending'}
		{#if hasSuggestions}
			{#key $aiSuggestions}
				{#each suggestionsReference as payload, index}<SuggestionCard suggestion={payload} {index} {removeMe} {ignoreMe} />{/each}
			{/key}
		{:else}
			<div class="rounded-xl border border-dashed border-border bg-card/60 px-4 py-6 text-center"><p class="text-sm font-medium text-foreground">No pending suggestions</p><p class="mt-1 text-xs text-muted-foreground">Open Applied to undo or redo a correction.</p></div>
		{/if}
	{:else if appliedSuggestions.length}
		{#each appliedSuggestions as item, index}
			<SuggestionCard suggestion={item.suggestion} index={index} removeMe={() => {}} ignoreMe={() => {}} historyItem applied={item.applied} canUndo={item.applied} canRedo={!item.applied} undoApplied={() => undoApplied(index)} redoApplied={() => redoApplied(index)} />
		{/each}
	{:else}
		<div class="rounded-xl border border-dashed border-border bg-card/60 px-4 py-6 text-center"><p class="text-sm font-medium text-foreground">No applied suggestions yet</p></div>
	{/if}
</ScrollArea>

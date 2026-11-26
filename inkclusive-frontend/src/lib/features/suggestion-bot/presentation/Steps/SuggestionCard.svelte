<script lang="ts">
	import * as Card from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import { cn } from '$lib/utils';
	import type { TSuggestion } from '$lib/features/suggestion-bot/entities/suggestions';
	import { onMount } from 'svelte';
	import { GLFScore } from '$lib/stores/omegaLOL';
	import { waitStore } from '$lib/stores/waitStore';
	import { ChevronDown, ChevronUp, Trash2, Undo2, Redo2, Check } from '@lucide/svelte';

	let isCompact = $state<boolean>(false);
	let {
		suggestion,
		removeMe,
		index,
		ignoreMe,
		historyItem = false,
		applied = false,
		canUndo = false,
		canRedo = false,
		undoApplied = () => {},
		redoApplied = () => {}
	}: {
		suggestion: TSuggestion;
		removeMe: (index: number, correctionString: string) => void;
		index: number;
		ignoreMe: (index: number, ignoreString: string) => void;
		historyItem?: boolean;
		applied?: boolean;
		canUndo?: boolean;
		canRedo?: boolean;
		undoApplied?: () => void;
		redoApplied?: () => void;
	} = $props();

	let isLoading = $state<boolean>(false);
	onMount(() => {
		$inspect('card', suggestion);
	});
</script>

<Card.Root class="my-3 w-full overflow-hidden border-border shadow-sm">
	{#if !isCompact}
		<Card.Header class="border-b border-border bg-muted/20 px-3 py-3">
			<Card.Title
				class="flex items-start justify-between gap-3 text-sm leading-relaxed"
			>
				<div class="min-w-0 flex-1 text-left">
					{suggestion.message}
				</div>

				<button
					class="inline-flex size-8 shrink-0 items-center justify-center rounded-full border border-border text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
					aria-label="Collapse suggestion"
					title="Collapse suggestion"
					onclick={() => (isCompact = true)}
				>
					<ChevronUp class="size-4" aria-hidden="true" /></button
				>
			</Card.Title>
		</Card.Header>
		<Card.Content class="space-y-3 p-3">
			{#if historyItem}
				<div class="flex items-center gap-2 rounded-lg border border-emerald-500/20 bg-emerald-500/5 px-3 py-2 text-sm text-emerald-700 dark:text-emerald-300" role="status">
					<Check class="size-4" aria-hidden="true" />
					<span>{applied ? `Applied: ${suggestion.chosenReplacement}` : `Undone: ${suggestion.chosenReplacement}`}</span>
				</div>
			{/if}
			<div class="space-y-1">
				<p class="text-[11px] font-semibold uppercase tracking-wide text-destructive">Original wording</p>
				<p class="break-words text-sm leading-relaxed text-foreground">{suggestion.originalText}</p>
			</div>
			{#if (suggestion.rationale && suggestion.rationale !== suggestion.message) || suggestion.examples?.length || suggestion.correctionType === 'gfl'}
				<div class="rounded-lg border border-border bg-muted/40 p-3 text-sm">
					<p class="font-semibold text-foreground">Why this suggestion</p>
					{#if suggestion.rationale && suggestion.rationale !== suggestion.message}<p class="mt-1 leading-5 text-muted-foreground">{suggestion.rationale}</p>{/if}
					{#if suggestion.correctionType === 'gfl'}<p class="mt-2 text-xs font-medium text-muted-foreground">Gender-fair language</p>{/if}
					{#if suggestion.examples?.length}<p class="mt-2 text-xs text-muted-foreground">Examples: {suggestion.examples.join(' · ')}</p>{/if}
				</div>
			{/if}
			<div class="space-y-1.5">
				<p class="text-[11px] font-semibold uppercase tracking-wide text-primary">Suggested revision</p>
				<div class="flex w-full flex-col gap-2">
				{#if historyItem}
					<p class="break-words rounded-lg border border-primary/20 bg-primary/5 p-2 text-sm">{suggestion.chosenReplacement}</p>
				{:else}
				{#each suggestion.replacements as item}
					<button
						aria-label={`Replace ${suggestion.originalText} with ${item}`}
						disabled={$waitStore}
						class="group flex w-full items-center justify-center rounded-lg border border-primary bg-primary p-1 text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
						onclick={async () => {
							if (suggestion.correctionType === 'gfl') {
								$GLFScore += 1;
							}
							isLoading = true;
							$waitStore = true;
							try {
								removeMe(index, item);
							} finally {
								isLoading = false;
								$waitStore = false;
							}
						}}
					>
						<span class="w-full rounded-md p-1 text-base font-bold">
							{item}
						</span>
					</button>
				{/each}
				{/if}
				</div>
			</div>
		</Card.Content>
		{#if historyItem}
			<Card.Footer class="flex justify-end gap-2 px-3 pb-3 pt-0">
				<Button variant="outline" size="sm" disabled={!canUndo || $waitStore} onclick={undoApplied}>
					<Undo2 class="mr-1 size-4" aria-hidden="true" />Undo
				</Button>
				<Button variant="outline" size="sm" disabled={!canRedo || $waitStore} onclick={redoApplied}>
					<Redo2 class="mr-1 size-4" aria-hidden="true" />Redo
				</Button>
			</Card.Footer>
		{:else}
		<Card.Footer class="flex flex-col items-center justify-start gap-2 px-3 pb-3 pt-0">
			<Button
				variant="outline"
				size="sm"
				class="w-full text-base font-bold text-muted-foreground "
				disabled={isLoading}
				onclick={() => {
					if (suggestion.correctionType === 'gfl') {
						$GLFScore += 1;
					}
					ignoreMe(index, suggestion.originalText);
				}}>Ignore</Button
			>
		</Card.Footer>
		{/if}
	{:else}
		<!-- compact vers -->
		<Card.Content class="flex min-w-0 items-center gap-2 px-3 py-2">
			<div
				class={cn(
					'h-[10px] w-[10px] rounded-full',
					suggestion.correctionType === 'grammar' && 'bg-blue-500',
					suggestion.correctionType === 'spelling' && 'bg-red-500',
					suggestion.correctionType === 'gfl' && 'bg-violet-500'
				)}
			>
				&nbsp;
			</div>

			<p class="min-w-0 flex-1 truncate text-start text-sm">
				{suggestion.message}
			</p>

			<div class="flex shrink-0 items-center justify-center gap-1">
				<button
					class="inline-flex size-8 items-center justify-center rounded-full border border-destructive text-destructive transition-colors hover:bg-destructive hover:text-destructive-foreground"
					aria-label="Ignore suggestion"
					title="Ignore suggestion"
					disabled={isLoading}
					onclick={() => {
						if (suggestion.correctionType === 'gfl') {
							$GLFScore += 1;
						}
						ignoreMe(index, suggestion.originalText);
					}}><Trash2 class="size-4" aria-hidden="true" /></button
				>
				<button
					class="inline-flex size-8 items-center justify-center rounded-full border border-border bg-transparent text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
					aria-label="Expand suggestion"
					title="Expand suggestion"
					onclick={() => (isCompact = false)}
					><ChevronDown class="size-4" aria-hidden="true" />
				</button>
			</div>
		</Card.Content>
	{/if}
</Card.Root>

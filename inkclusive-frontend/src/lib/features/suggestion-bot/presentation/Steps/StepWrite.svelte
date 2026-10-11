<script lang="ts">
	import * as Card from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import { Progress } from '$lib/components/ui/progress';
	import { textContent } from '$lib/stores/textFromEditorStore';
	import { ArrowRight, FilePenLine, LoaderCircle } from '@lucide/svelte';

	let { nextSlide }: { nextSlide: () => Promise<void> } = $props();
	let isLoading = $state(false);
	let wordCount = $derived($textContent.trim() ? $textContent.trim().split(/\s+/).length : 0);
	let readiness = $derived(Math.min((wordCount / 26) * 100, 100));
	let canContinue = $derived(wordCount >= 26 && wordCount <= 600 && !isLoading);

	async function proceed() {
		if (!canContinue) return;
		isLoading = true;
		try {
			await nextSlide();
		} finally {
			isLoading = false;
		}
	}
</script>

<Card.Root class="w-full overflow-hidden border-border shadow-sm">
	<Card.Header class="space-y-0 bg-primary/[0.04] p-4 pb-4">
		<div class="flex items-center gap-2">
			<div class="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
				<FilePenLine class="size-5" aria-hidden="true" />
			</div>
			<p class="text-[11px] font-semibold uppercase tracking-[0.14em] text-primary">Step 1</p>
		</div>
		<Card.Title class="mt-3 text-base font-semibold leading-snug">Write your draft</Card.Title>
		<Card.Description class="mt-1 leading-relaxed">Build your text in the editor, then review grammar suggestions.</Card.Description>
	</Card.Header>

	<Card.Content class="space-y-4 p-4">
		<div class="space-y-2.5 rounded-xl border border-border bg-background p-3.5">
			<div class="flex items-center justify-between gap-3">
				<span class="text-sm font-medium text-foreground">Draft length</span>
				<span class="shrink-0 text-sm font-semibold tabular-nums text-foreground">
					{wordCount}<span class="font-normal text-muted-foreground"> / 600 words</span>
				</span>
			</div>
			<Progress value={readiness} aria-label="Progress toward the 26-word minimum" class="h-1.5" />
			<p
				class={wordCount > 600 ? 'text-xs leading-5 text-destructive' : 'text-xs leading-5 text-muted-foreground'}
				role={wordCount > 600 ? 'alert' : 'status'}
				aria-live={wordCount > 600 ? 'assertive' : 'polite'}
			>
				{#if wordCount > 600}
					The 600-word limit is exceeded. Remove {wordCount - 600} {wordCount - 600 === 1 ? 'word' : 'words'} to continue.
				{:else if wordCount < 26}
					Add {26 - wordCount} {26 - wordCount === 1 ? 'word' : 'words'} to unlock grammar review.
				{:else}
					Your draft is ready for grammar review.
				{/if}
			</p>
		</div>

		<Button class="h-11 w-full justify-between px-4" disabled={!canContinue} onclick={proceed}>
			<span>{isLoading ? 'Preparing…' : 'Continue to grammar'}</span>
			{#if isLoading}
				<LoaderCircle class="size-4 animate-spin" aria-hidden="true" />
			{:else}
				<ArrowRight class="size-4" aria-hidden="true" />
			{/if}
		</Button>
	</Card.Content>
</Card.Root>

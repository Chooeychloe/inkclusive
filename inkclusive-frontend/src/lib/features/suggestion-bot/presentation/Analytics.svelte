<script lang="ts">
	import * as Card from '$lib/components/ui/card/index.js';
	import { Button } from '$lib/components/ui/button';
	import Gauge from '$lib/features/suggestion-bot/presentation/Steps/Gauge.svelte';
	import ExportButton from '$lib/features/suggestion-bot/presentation/Utils/ExportButton.svelte';
	import { GLFScore } from '$lib/stores/omegaLOL';
	import { textContent } from '$lib/stores/textFromEditorStore';
	import ScrollArea from '$lib/components/ui/scroll-area/scroll-area.svelte';
	import { countStore } from '$lib/stores/countStore';
	import { RotateCcw } from '@lucide/svelte';
	import { genderFairReviewFindings } from '$lib/stores/lintingStore';
	import type { TSuggestion } from '$lib/features/suggestion-bot/entities/suggestions';
	import { ListChecks } from '@lucide/svelte';

	let { backToTheStart }: { backToTheStart: () => void } = $props();

	function getTheDifferential(wrong: number, total: number) {
		if (total == 0) {
			return 0;
		}

		return wrong / total;
	}

	let difference = $derived.by(() => {
		return getTheDifferential($GLFScore, $textContent.split(' ').length);
	});

	let findingGroups = $derived.by(() => {
		const groups = new Map<string, TSuggestion[]>();
		for (const finding of $genderFairReviewFindings) {
			const category = finding.category || 'Gender-fair language';
			groups.set(category, [...(groups.get(category) ?? []), finding]);
		}
		return [...groups.entries()];
	});


	// let doubled = $derived.by(() => {
	// 	if (difference == 0) {
	// 		return 100;
	// 	} else if (difference > 0 && difference <= 0.2) {
	// 		return 80;
	// 	} else if (difference > 0.2 && difference <= 0.5) {
	// 		return 50;
	// 	} else if (difference > 0.5 && difference <= 1) {
	// 		return 20;
	// 	} else {
	// 		return 0;
	// 	}
	// });
</script>

<ScrollArea
	class="flex w-full flex-col items-center justify-stretch  pl-4 lg:h-[550px] 2xl:h-[850px]"
>
	<Card.Root class="my-3 w-full max-w-xl border-border shadow-sm">
		<Card.Header class="pb-3">
			<div class="flex items-center gap-2 text-primary">
				<ListChecks class="size-5" aria-hidden="true" />
				<Card.Title class="text-lg">Document-level reflection</Card.Title>
			</div>
			<Card.Description class="leading-relaxed">
				Review recurring wording patterns, then consider how the document’s framing may affect its readers.
			</Card.Description>
		</Card.Header>
		<Card.Content class="space-y-4">
			<div class="rounded-lg border border-amber-500/25 bg-amber-500/5 p-3 text-sm leading-relaxed text-foreground" role="note">
				This overview summarizes rule-based wording matches. It does not understand the document’s full meaning or determine whether its ideas are gender-sensitive. Check each signal in context.
			</div>

			{#if findingGroups.length}
				<div class="space-y-3">
					<h3 class="text-sm font-semibold">Patterns flagged in this document</h3>
					{#each findingGroups as [category, findings]}
						<div class="rounded-lg border border-border bg-muted/40 p-3">
							<div class="flex items-center justify-between gap-2">
								<p class="text-sm font-medium">{category}</p>
								<span class="shrink-0 rounded-full bg-background px-2 py-0.5 text-xs text-muted-foreground">{findings.length}</span>
							</div>
							<ul class="mt-2 space-y-1.5 text-sm text-muted-foreground">
								{#each findings.slice(0, 5) as finding}
									<li><span class="font-medium text-foreground">“{finding.originalText}”</span> — {finding.rationale || finding.message}</li>
								{/each}
							</ul>
							{#if findings.length > 5}<p class="mt-2 text-xs text-muted-foreground">And {findings.length - 5} more matches in this category.</p>{/if}
						</div>
					{/each}
				</div>
			{:else}
				<p class="rounded-lg border border-border bg-muted/40 p-3 text-sm leading-relaxed text-muted-foreground">
					The wording rules found no gender-fair language matches. They do not assess the document’s overall ideas, so use the reflection questions below as well.
				</p>
			{/if}

		</Card.Content>
	</Card.Root>

	<Gauge radius={100} percent={difference}></Gauge>

	<Card.Root class="my-2">
		<Card.Header>
			<Card.Title class="border-b border-dashed border-border pb-2 text-lg font-bold text-foreground"
				>Inkclusive's Total Scanned Files:</Card.Title
			>
		</Card.Header>
		<Card.Content class="text-base text-muted-foreground">
			<p class="text-center text-base font-bold text-foreground">
				{$countStore} Scanned Documents
			</p>
		</Card.Content>
	</Card.Root>

	<Card.Root class="my-2">
		<Card.Header>
			<Card.Title class="border-b border-dashed border-border pb-2 text-lg font-bold text-foreground"
				>Useful Articles:</Card.Title
			>
		</Card.Header>
		<Card.Content class="text-base text-muted-foreground">
			<ul class="list-outside list-disc px-3">
				<li class="hover:underline">
					<a
						target="_blank"
						href="https://www.frontiersin.org/journals/psychology/articles/10.3389/fpsyg.2016.00025/full"
						rel="noopener noreferrer"
						>How we gender fair language can reduce gender stereotyping and discrimination</a
					>
				</li>
				<li class="mt-2 hover:underline">
					<a
						target="_blank"
						href="https://pcieerd.dost.gov.ph/images/gad_corner/Gender-fair-language-a-primer.pdf"
						rel="noopener noreferrer">What is gender fair language</a
					>
				</li>
			</ul>
		</Card.Content>
	</Card.Root>
	<Button
		variant="outline"
		onclick={backToTheStart}
		class="my-2 flex w-full items-center border-primary bg-primary p-6 text-base font-bold text-primary-foreground hover:bg-primary/90"
		><p>Start All Over Again</p>

		<RotateCcw class="size-5" aria-hidden="true" />
	</Button>
	<ExportButton></ExportButton>
</ScrollArea>

<style>
</style>

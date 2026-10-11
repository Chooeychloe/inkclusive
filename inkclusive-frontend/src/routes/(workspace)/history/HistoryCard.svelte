<script lang="ts">
	import type { History } from './historyManager';
	import * as Card from '$lib/components/ui/card/index.js';
	import { formatDistanceStrict } from 'date-fns';
	import Button from '$lib/components/ui/button/button.svelte';
	import { Trash } from '@lucide/svelte';
	import { textContent, textContentHTML, textTitle } from '$lib/stores/textFromEditorStore';
	import { goto } from '$app/navigation';
	import { cn } from '$lib/utils';

	const { history, deleteFunc }: { history: History; deleteFunc: (id: number) => void } = $props();
</script>

<div
	class="w-full border-2 border-dashed border-transparent p-1 transition-colors hover:border-primary/50"
>
	<Card.Root
		class="grid w-full cursor-pointer grid-cols-1 items-center gap-3 p-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.5fr)_auto] sm:gap-4 sm:p-4"
		onclick={() => {
			$textContent = history.text;
			$textContentHTML = history.htmlAsText;
			$textTitle = history.title;
			goto('/write');
		}}
	>
		<Card.Header class="min-w-0 p-0">
			<div class="min-w-0">
				<Card.Title class="mb-1 truncate">
					{history.title}
				</Card.Title>
				<p
					class={cn(
						history.type == 'Grammar' && 'bg-sky-500/10 text-sky-700 dark:text-sky-300',
						history.type == 'GFL' && 'bg-primary/10 text-primary',
						'inline-flex rounded-full px-2 py-0.5 text-xs font-semibold'
					)}
				>
					{history.type}
				</p>
			</div>
		</Card.Header>
		<Card.Content class="min-w-0 p-0">
			<p class="line-clamp-2 text-left text-sm leading-5 text-muted-foreground">
				{history.text}
			</p>
		</Card.Content>
		<Card.Footer class="flex w-full items-center justify-between gap-3 p-0 sm:justify-end">
			<p class="text-xs text-muted-foreground sm:text-sm">
				{formatDistanceStrict(history.timestamp, new Date())} ago
			</p>
			<Button
				onclick={(e) => {
					e.stopPropagation();
					deleteFunc(history.id);
				}}
				size="icon"
				variant="destructive"
			>
				<Trash></Trash>
			</Button>
		</Card.Footer>
	</Card.Root>
</div>

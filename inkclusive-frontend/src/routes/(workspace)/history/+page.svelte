<script lang="ts">
	import { onMount } from 'svelte';
	import { type History } from './historyManager';
	import HistoryCard from './HistoryCard.svelte';
	import Button from '$lib/components/ui/button/button.svelte';
	import ScrollArea from '$lib/components/ui/scroll-area/scroll-area.svelte';

	let history = $state<History[]>([]);

	let manager = $state({
		manager: null as null | InstanceType<typeof import('./historyManager').HistoryManager>
	});
	onMount(async () => {
		const { HistoryManager } = await import('./historyManager');
		manager.manager = new HistoryManager();
		history = (await manager.manager.getAllStore()).reverse();
	});
	async function deleteFunc(id: number) {
		await manager.manager!.deleteStore(id);
		history = (await manager.manager!.getAllStore()).reverse();
	}
</script>

<div class="flex min-h-0 w-full min-w-0 flex-1 flex-col items-center overflow-hidden bg-muted">
	<div class="flex w-full max-w-5xl shrink-0 items-center justify-end gap-3 px-4 py-4 sm:px-6">
		<Button
			variant="destructive"
			onclick={async () => {
				await manager.manager!.clearAll();
				history = (await manager.manager!.getAllStore()).reverse();
			}}>Clear All</Button
		>
	</div>

	{#key history}
		{#if history.length == 0}
			<div class="flex min-h-0 w-full flex-1 flex-wrap items-center justify-center gap-2 px-5">
				<h3 class="mb-10 scroll-m-20 text-2xl font-semibold tracking-tight text-muted-foreground">
					EMPTY
				</h3>
			</div>
		{:else}
			<ScrollArea class="min-h-0 w-full max-w-5xl flex-1 px-4 sm:px-6">
				<div class="flex w-full flex-col items-center justify-start gap-3 pb-4">
					{#each history as item}
						<HistoryCard history={item} {deleteFunc}></HistoryCard>
					{/each}
				</div>
			</ScrollArea>
		{/if}
	{/key}
</div>

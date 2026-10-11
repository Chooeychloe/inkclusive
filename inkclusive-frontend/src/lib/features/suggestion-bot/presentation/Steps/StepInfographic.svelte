<script lang="ts">
	import { Progress } from '$lib/components/ui/progress';
	import { progressStore } from '$lib/stores/progressStore';
	import { cn } from '$lib/utils';
	import { FilePenLine, Languages, SearchCheck } from '@lucide/svelte';
</script>

<div class="flex w-full flex-col items-center justify-start gap-3 px-4 py-3">
	<div class="relative flex w-full items-center justify-between">
		<span
			class={cn(
				'select-none z-10 flex size-11 items-center justify-center rounded-full border-2 border-solid transition-all ease-in-out',
				$progressStore === 0 && 'border-primary bg-primary/10 text-primary',
				$progressStore >= 50 && 'border-primary bg-primary text-primary-foreground'
			)}
			><FilePenLine class="size-6" aria-hidden="true" /></span>

		<span
			class={cn(
				'select-none z-10 flex size-11 items-center justify-center rounded-full border-2 border-solid border-border bg-muted text-muted-foreground transition-all ease-in-out',
				$progressStore === 50 && 'border-primary bg-primary/10 text-primary',
				$progressStore === 100 && 'border-primary bg-primary text-primary-foreground'
			)}
			><Languages class="size-6" aria-hidden="true" /></span>

		<span
			class={cn(
				'select-none z-10 flex size-11 items-center justify-center rounded-full border-2 border-solid border-border bg-muted text-muted-foreground transition-all ease-in-out',
				$progressStore === 100 && 'border-primary bg-primary/10 text-primary',
				$progressStore === 101 && 'border-primary bg-primary text-primary-foreground'
			)}
			><SearchCheck class="size-6" aria-hidden="true" /></span>

		<Progress value={$progressStore} class="absolute z-0 h-1"></Progress>
	</div>
	<div class="flex w-full items-center justify-between px-1 text-sm font-medium text-foreground">
		<p>Write</p>
		<p>Grammar</p>
		<p>GFL</p>
	</div>
</div>

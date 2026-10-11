<script lang="ts">
	import { Skeleton } from '$lib/components/ui/skeleton/index.js';
</script>

{#await import('$lib/features/rich-text-editor/presentation/RichTextEditor.svelte')}
<section class="flex flex-1 flex-col items-center bg-muted ">
	<Skeleton class=" w-full h-[55px] rounded-none border-solid border-b border-border" />
	<Skeleton
		class="flex-1 w-[700px] rounded-none border-solid border border-border border-t-0"
	></Skeleton>
</section>

{:then c}
	<svelte:component this={c.default} />
{/await}



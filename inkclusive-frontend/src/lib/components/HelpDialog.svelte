<script lang="ts">
	import * as Dialog from '$lib/components/ui/dialog';
	let { onViewDocumentation }: { onViewDocumentation: () => void } = $props();
</script>

<Dialog.Content class="sm:max-w-[425px]">
	<Dialog.Header>
		<Dialog.Title>Help & Support</Dialog.Title>
	</Dialog.Header>
	<div class="space-y-4 py-4">
		<div class="rounded-lg border border-primary/20 bg-primary/5 p-4">
			<h4 class="mb-1 text-sm font-bold text-primary">How it works</h4>
			<p class="text-xs text-muted-foreground">
				Upload or paste text into the editor. Inkclusive highlights gendered terms and suggests inclusive alternatives.
			</p>
		</div>
		<button onclick={onViewDocumentation} class="w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">
			View documentation
		</button>
		<p class="text-center text-xs text-muted-foreground">Version 1.0.0 (Beta)</p>
	</div>
</Dialog.Content>

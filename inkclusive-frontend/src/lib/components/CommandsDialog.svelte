<script lang="ts">
	import * as Dialog from '$lib/components/ui/dialog';
	
	const commands = [
		{ key: 'Ctrl / Cmd + B', desc: 'Toggle bold' },
		{ key: 'Ctrl / Cmd + I', desc: 'Toggle italic' },
		{ key: 'Ctrl / Cmd + Z', desc: 'Undo' },
		{ key: 'Ctrl / Cmd + Y or Shift + Z', desc: 'Redo' },
		{ key: 'Ctrl / Cmd + Shift + 8', desc: 'Start a bulleted list' }
	];
</script>

<Dialog.Content class="sm:max-w-[425px]">
	<Dialog.Header>
		<Dialog.Title>Keyboard Commands</Dialog.Title>
		<Dialog.Description>Use these editor shortcuts. On macOS, use Command where Ctrl is shown. You can also reach toolbar controls with Tab and activate them with Enter or Space.</Dialog.Description>
	</Dialog.Header>
	<div class="grid gap-4 py-4">
		{#each commands as cmd}
			<div class="flex items-center justify-between border-b border-border pb-2">
				<span class="text-sm font-medium text-foreground">{cmd.desc}</span>
				<kbd class="rounded border border-border bg-muted px-2 py-1 text-xs font-semibold text-primary">
					{cmd.key}
				</kbd>
			</div>
		{/each}
	</div>
</Dialog.Content>

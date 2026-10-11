<script lang="ts">
	import { Moon, Sun } from '@lucide/svelte';
	import { mode, toggleMode } from 'mode-watcher';
</script>

<button
	type="button"
	class="inline-flex items-center justify-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
	aria-label={$mode === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
	title={$mode === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
	onclick={toggleMode}
>
	{#if $mode === 'dark'}
		<Sun size={16} aria-hidden="true" />
		<span class="hidden lg:inline">Light mode</span>
	{:else}
		<Moon size={16} aria-hidden="true" />
		<span class="hidden lg:inline">Dark mode</span>
	{/if}
</button>

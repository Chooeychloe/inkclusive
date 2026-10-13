<script lang="ts">
	import '../app.css';
	let { children } = $props();
	import { Toaster } from '$lib/components/ui/sonner/index.js';
	import { beforeNavigate, goto } from '$app/navigation';
	import { textContent, textContentHTML, textTitle } from '$lib/stores/textFromEditorStore';
	import { progressStore } from '$lib/stores/progressStore';
	import { GLFScore } from '$lib/stores/omegaLOL';
	import { aiSuggestions, replaceStore } from '$lib/stores/lintingStore';
	import { ignoreGrammarStore } from '$lib/stores/ignoreStore';
	import { page } from '$app/state';
	import { ModeWatcher } from 'mode-watcher';
	import * as Dialog from '$lib/components/ui/dialog';
	import { Button } from '$lib/components/ui/button';
	import { ArrowRight, FilePenLine, ScanSearch, History } from '@lucide/svelte';

	let leaveDialogOpen = $state(false);
	let pendingUrl = $state<string | null>(null);
	let destinationName = $derived(pendingUrl ? new URL(pendingUrl).pathname.split('/').filter(Boolean).at(-1) ?? 'page' : 'page');
	let skipLeaveGuard = false;

	function clearDraft() {
		$textContent = '';
		$textContentHTML = '';
		$textTitle = 'Untitled_1';
		$progressStore = 0;
		$GLFScore = 0;
		$aiSuggestions = [];
		$replaceStore = [];
		$ignoreGrammarStore = [];
	}

	async function continueNavigation() {
		if (!pendingUrl) return;
		const destination = pendingUrl;
		pendingUrl = null;
		leaveDialogOpen = false;
		clearDraft();
		skipLeaveGuard = true;
		await goto(destination);
	}

	beforeNavigate(({ cancel, to }) => {
		if (skipLeaveGuard) {
			skipLeaveGuard = false;
			return;
		}
		if (['/write', '/scan', '/dashboard/editor', '/dashboard/scan'].includes(page.url.pathname)) {
			if ($textContent == '') return;
			if (!to?.url) return;
			cancel();
			pendingUrl = to.url.href;
			leaveDialogOpen = true;
		}
	});
</script>

<ModeWatcher />
<Toaster richColors position="top-center"></Toaster>
{@render children()}

<Dialog.Root bind:open={leaveDialogOpen}>
	<Dialog.Content class="overflow-hidden p-0 sm:max-w-md">
		<div class="bg-gradient-to-br from-primary/10 via-background to-background px-6 pb-5 pt-7">
			<div class="mb-4 flex size-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
				<ArrowRight class="size-5" aria-hidden="true" />
			</div>
			<Dialog.Header class="text-left">
				<Dialog.Title class="text-xl">Ready to explore another feature?</Dialog.Title>
				<Dialog.Description class="mt-2 text-sm leading-relaxed">
					Your current writing will be cleared when you leave. Choose where you’d like to go next.
				</Dialog.Description>
			</Dialog.Header>
		</div>
		<div class="flex flex-col-reverse gap-2 px-6 pb-6 sm:flex-row sm:justify-end">
			<Button variant="ghost" onclick={() => { pendingUrl = null; leaveDialogOpen = false; }}>Stay here</Button>
			<Button onclick={continueNavigation} class="gap-2">
				{#if destinationName === 'scan'}<ScanSearch class="size-4" aria-hidden="true" />{:else if destinationName === 'history'}<History class="size-4" aria-hidden="true" />{:else}<FilePenLine class="size-4" aria-hidden="true" />{/if}
				Continue to {destinationName.charAt(0).toUpperCase() + destinationName.slice(1)}
				<ArrowRight class="size-4" aria-hidden="true" />
			</Button>
		</div>
	</Dialog.Content>
</Dialog.Root>

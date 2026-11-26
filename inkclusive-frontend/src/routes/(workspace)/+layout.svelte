<script lang="ts">
	import type { Snippet } from 'svelte';
	import { page } from '$app/stores';
	import { mode, toggleMode } from 'mode-watcher';
	import { cn } from '$lib/utils';
	import SuggestionTab from '$lib/features/suggestion-bot/presentation/SuggestionTab.svelte';
	import WorkspaceFooter from '$lib/components/WorkspaceFooter.svelte';
	import * as Dialog from '$lib/components/ui/dialog';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
	import CommandsDialog from '$lib/components/CommandsDialog.svelte';
	import HelpDialog from '$lib/components/HelpDialog.svelte';
	import InfoDialog from '$lib/components/InfoDialog.svelte';
	import OnboardingDialog from '$lib/components/OnboardingDialog.svelte';
	import { onMount, tick } from 'svelte';
	import { goto } from '$app/navigation';
	import {
		FilePenLine,
		ScanSearch,
		History,
		Keyboard,
		HeartHandshake,
		Info,
		Moon,
		Sun,
		Settings2
	} from '@lucide/svelte';

	let { children }: { children: Snippet } = $props();

	let commandsOpen = $state(false);
	let helpOpen = $state(false);
	let infoOpen = $state(false);
	let onboardingOpen = $state(false);
	let logoClickCount = 0;
	let lastLogoClickAt = 0;
	function handleLogoClick() {
		const now = Date.now();
		logoClickCount = now - lastLogoClickAt > 5000 ? 1 : logoClickCount + 1;
		lastLogoClickAt = now;
		if (logoClickCount === 5) {
			logoClickCount = 0;
			window.location.assign('/admin');
		}
	}
	async function openDocumentation() {
		helpOpen = false;
		await tick();
		await goto('/help');
	}
	onMount(() => {
		try {
			if (!localStorage.getItem('inkclusive-onboarding-writer-seen')) onboardingOpen = true;
		} catch { onboardingOpen = true; }
	});

</script>



<div class="flex min-h-[100svh] flex-col bg-background md:h-[100svh] md:min-h-0 md:overflow-hidden">
	<div class="flex min-h-0 flex-1 flex-col md:flex-row">
		<aside
			class="step-1 order-2 flex w-full shrink-0 flex-col border-t border-border bg-card md:order-none md:w-[4.75rem] md:border-r md:border-t-0 lg:w-48 2xl:w-64"
		>
			<div class="flex flex-col gap-1 px-2 md:px-2">
				<div
					class="hidden h-14 items-center justify-center gap-2 border-b border-border bg-muted/50 lg:justify-start md:flex"
				>
					<button type="button" onclick={handleLogoClick} aria-label="Inkclusive" title="Inkclusive" class="flex h-full items-center justify-center gap-2 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring lg:justify-start">
						<img src="/inkclusive.svg" alt="" class="ml-1 h-8 w-8 shrink-0 lg:ml-0" />
						<img src="/inkclusive-wordmark.svg" alt="" class="hidden h-6 w-auto max-w-[9rem] object-contain lg:block" />
					</button>
				</div>

			

				<nav aria-label="Workspace" class="flex flex-row justify-around gap-2 py-1 md:flex-col md:justify-start md:py-0 md:px-1">
					<a
						id="workspace-write"
						href="/write"
						aria-current={$page.url.pathname === '/write' ? 'page' : undefined}
						class={cn(
							'flex items-center justify-center gap-3 rounded-xl border border-transparent p-2.5 text-base font-medium transition-colors lg:justify-start',
							'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
							$page.url.pathname === '/write' &&
								'border-primary bg-primary text-primary-foreground shadow-sm hover:bg-primary/90 hover:text-primary-foreground'
						)}
					>
						<span class={cn(
							'flex items-center justify-center rounded-lg bg-primary/10 p-1.5 text-primary',
							$page.url.pathname === '/write' && 'bg-primary-foreground/15 text-primary-foreground'
						)}>
							<FilePenLine class="size-5" aria-hidden="true" />
						</span>
						<span class="hidden lg:inline">Write</span>
					</a>

					<a
						id="workspace-scan"
						href="/scan"
						aria-current={$page.url.pathname === '/scan' ? 'page' : undefined}
						class={cn(
							'flex items-center justify-center gap-3 rounded-xl border border-transparent p-2.5 text-base font-medium transition-colors lg:justify-start',
							'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
							$page.url.pathname === '/scan' &&
								'border-primary bg-primary text-primary-foreground shadow-sm hover:bg-primary/90 hover:text-primary-foreground'
						)}
					>
						<span class={cn(
							'flex items-center justify-center rounded-lg bg-primary/10 p-1.5 text-primary',
							$page.url.pathname === '/scan' && 'bg-primary-foreground/15 text-primary-foreground'
						)}>
							<ScanSearch class="size-5" aria-hidden="true" />
						</span>
						<span class="hidden lg:inline">Scan</span>
					</a>

					<a
						id="workspace-history"
						href="/history"
						aria-current={$page.url.pathname === '/history' ? 'page' : undefined}
						class={cn(
							'flex items-center justify-center gap-3 rounded-xl border border-transparent p-2.5 text-base font-medium transition-colors lg:justify-start',
							'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
							$page.url.pathname === '/history' &&
								'border-primary bg-primary text-primary-foreground shadow-sm hover:bg-primary/90 hover:text-primary-foreground'
						)}
					>
						<span class={cn(
							'flex items-center justify-center rounded-lg bg-primary/10 p-1.5 text-primary',
							$page.url.pathname === '/history' && 'bg-primary-foreground/15 text-primary-foreground'
						)}>
							<History class="size-5" aria-hidden="true" />
						</span>
						<span class="hidden lg:inline">History</span>
					</a>
				</nav>
			</div>
		</aside>

		<div class="flex min-h-0 min-w-0 flex-1 flex-col">
			<header class="sticky top-0 z-20 flex h-14 shrink-0 items-center justify-between border-b border-border bg-background/95 px-4 backdrop-blur sm:px-6">
				<div class="flex min-w-0 items-center gap-2">
					<button
						type="button"
						onclick={handleLogoClick}
						aria-label="Inkclusive"
						title="Inkclusive"
						class="flex items-center gap-2 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring md:hidden"
					>
						<img src="/inkclusive.svg" alt="" class="size-8 shrink-0" />
						<img src="/inkclusive-wordmark.svg" alt="" class="h-5 w-auto max-w-28 object-contain" />
					</button>
					<p class="hidden text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground sm:block">Inkclusive workspace</p>
				</div>
				<DropdownMenu.Root>
					<DropdownMenu.Trigger
						class="inline-flex h-9 items-center gap-2 rounded-lg border border-border bg-card px-3 text-sm font-medium text-foreground shadow-sm transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
						aria-label="Open help and preferences"
					>
						<Settings2 class="size-4 text-primary" aria-hidden="true" />
						<span class="hidden sm:inline">Help & preferences</span>
					</DropdownMenu.Trigger>
					<DropdownMenu.Content align="end" class="w-60 p-1.5">
						<DropdownMenu.Label class="px-2 py-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
							Preferences & support
						</DropdownMenu.Label>
						<DropdownMenu.Item class="h-10 cursor-pointer gap-2" onclick={toggleMode}>
							{#if $mode === 'dark'}
								<Sun class="size-4 text-amber-500" aria-hidden="true" />
								<span>Switch to light theme</span>
							{:else}
								<Moon class="size-4 text-primary" aria-hidden="true" />
								<span>Switch to dark theme</span>
							{/if}
						</DropdownMenu.Item>
						<DropdownMenu.Separator />
						<DropdownMenu.Item class="h-10 cursor-pointer gap-2" onclick={() => (commandsOpen = true)}>
							<Keyboard class="size-4 text-primary" aria-hidden="true" />
							<span>Keyboard commands</span>
						</DropdownMenu.Item>
						<DropdownMenu.Item class="h-10 cursor-pointer gap-2" onclick={() => (helpOpen = true)}>
							<HeartHandshake class="size-4 text-primary" aria-hidden="true" />
							<span>Help & guidance</span>
						</DropdownMenu.Item>
						<DropdownMenu.Item class="h-10 cursor-pointer gap-2" onclick={() => (onboardingOpen = true)}>
							<Keyboard class="size-4 text-primary" aria-hidden="true" />
							<span>Getting started guide</span>
						</DropdownMenu.Item>
						<DropdownMenu.Item class="h-10 cursor-pointer gap-2" onclick={() => (infoOpen = true)}>
							<Info class="size-4 text-muted-foreground" aria-hidden="true" />
							<span>About Inkclusive</span>
						</DropdownMenu.Item>
					</DropdownMenu.Content>
				</DropdownMenu.Root>
			</header>

			<main class="flex min-h-0 flex-1 flex-col overflow-x-hidden bg-background md:overflow-y-auto lg:flex-row lg:overflow-hidden">
				{@render children()}
				<SuggestionTab></SuggestionTab>
			</main>
		</div>
	</div>

	<WorkspaceFooter />
</div>

<Dialog.Root bind:open={commandsOpen}>
	<CommandsDialog />
</Dialog.Root>
<Dialog.Root bind:open={helpOpen}>
	<HelpDialog onViewDocumentation={openDocumentation} />
</Dialog.Root>
<Dialog.Root bind:open={infoOpen}>
	<InfoDialog />
</Dialog.Root>
<OnboardingDialog audience="writer" bind:open={onboardingOpen} />

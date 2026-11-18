<script lang="ts">
	import { onDestroy } from 'svelte';
	import { driver, type DriveStep, type Driver } from 'driver.js';

	type Audience = 'writer' | 'admin';
	let { audience, open = $bindable(false) }: { audience: Audience; open?: boolean } = $props();
	let tour: Driver | undefined;

	const writerSteps: DriveStep[] = [
		{ element: '#workspace-write', popover: { title: 'Write', description: 'Type or paste your document here. The editor toolbar provides text styles, lists, alignment, undo, and redo.', side: 'right' } },
		{ element: '#workspace-scan', popover: { title: 'Scan a document', description: 'Extract text from PDF, DOCX, JPG, JPEG, and PNG files. Check extracted text for errors before reviewing it.', side: 'right' } },
		{ element: '#workspace-history', popover: { title: 'Review history', description: 'Return to or remove review snapshots saved in this browser. History stays on this device.', side: 'right' } },
		{ element: '.step-4', popover: { title: 'AI Companion', description: 'Run the grammar review first, then continue to gender-fair suggestions. Review each suggestion and apply or ignore it based on context.', side: 'left' } },
		{ element: '.step-5', popover: { title: 'Pronoun preferences', description: 'Add names and known pronouns here when they matter to your document. These preferences guide the gender-fair check.', side: 'left' } },
		{ element: '[aria-label="Open help and preferences"]', popover: { title: 'Help and preferences', description: 'Reopen this tour, find keyboard commands, or switch the display theme from this menu.', side: 'bottom' } }
	];

	const adminSteps: DriveStep[] = [
		{ element: '#term-search', popover: { title: 'Search the library', description: 'Search terms, alternatives, categories, examples, and guidance. Every word you enter must match.', side: 'bottom' } },
		{ element: '#admin-add-term', popover: { title: 'Add terms', description: 'Create a term with comma-separated alternatives, a category, and optional guidance and examples. Review the batch before saving.', side: 'bottom' } },
		{ element: '#admin-library-transfer', popover: { title: 'Import and export', description: 'Export a CSV backup before large changes. Imports add terms and use | to separate alternatives and examples; duplicate terms can reject a batch.', side: 'bottom' } },
		{ element: '#admin-bulk-delete', popover: { title: 'Remove selected terms', description: 'Select rows with their checkboxes, then use this control to delete them. Deletions are permanent.', side: 'top' } },
		{ element: '[aria-label="Open admin menu"]', popover: { title: 'Password and sign out', description: 'Change the admin password or sign out from this menu. Password changes sign out the current session.', side: 'bottom' } }
	];

	function finish() {
		try { localStorage.setItem(`inkclusive-onboarding-${audience}-seen`, 'true'); } catch { /* Storage may be unavailable. */ }
		open = false;
	}

	$effect(() => {
		if (!open || typeof document === 'undefined') return;
		const start = window.setTimeout(() => {
			const source = audience === 'admin' ? adminSteps : writerSteps;
			const steps = source.filter((item) => typeof item.element === 'string' && document.querySelector(item.element));
			if (!steps.length) { finish(); return; }
			tour = driver({
				steps,
				showProgress: true,
				allowClose: true,
				overlayOpacity: 0.45,
				popoverClass: 'inkclusive-guide',
				onDestroyed: finish
			});
			tour.drive();
		}, 80);
		return () => window.clearTimeout(start);
	});

	onDestroy(() => tour?.destroy());
</script>

<style>
	:global(.driver-popover.inkclusive-guide) {
		max-width: min(360px, calc(100vw - 32px));
		padding: 1.1rem;
		border: 1px solid hsl(var(--border));
		border-radius: calc(var(--radius) + 0.25rem);
		background: hsl(var(--card));
		color: hsl(var(--card-foreground));
		box-shadow: 0 18px 48px rgb(32 20 58 / 22%);
		font-family: var(--font-ui);
	}

	:global(.driver-popover.inkclusive-guide .driver-popover-title) {
		margin-bottom: 0.45rem;
		color: hsl(var(--foreground));
		font-size: 1rem;
		font-weight: 700;
	}

	:global(.driver-popover.inkclusive-guide .driver-popover-description) {
		color: hsl(var(--muted-foreground));
		font-size: 0.875rem;
		line-height: 1.55;
	}

	:global(.driver-popover.inkclusive-guide .driver-popover-progress-text) {
		color: hsl(var(--muted-foreground));
		font-size: 0.75rem;
	}

	:global(.driver-popover.inkclusive-guide .driver-popover-navigation-btns button) {
		border: 1px solid hsl(var(--border));
		border-radius: calc(var(--radius) - 0.15rem);
		background: hsl(var(--background));
		color: hsl(var(--foreground));
		font-family: var(--font-ui);
		font-size: 0.8rem;
		font-weight: 600;
		text-shadow: none;
	}

	:global(.driver-popover.inkclusive-guide .driver-popover-navigation-btns .driver-popover-next-btn) {
		border-color: hsl(var(--primary));
		background: hsl(var(--primary));
		color: hsl(var(--primary-foreground));
	}

	:global(.driver-popover.inkclusive-guide .driver-popover-arrow-side-left.driver-popover-arrow) {
		border-left-color: hsl(var(--card));
	}
	:global(.driver-popover.inkclusive-guide .driver-popover-arrow-side-right.driver-popover-arrow) {
		border-right-color: hsl(var(--card));
	}
	:global(.driver-popover.inkclusive-guide .driver-popover-arrow-side-top.driver-popover-arrow) {
		border-top-color: hsl(var(--card));
	}
	:global(.driver-popover.inkclusive-guide .driver-popover-arrow-side-bottom.driver-popover-arrow) {
		border-bottom-color: hsl(var(--card));
	}
</style>

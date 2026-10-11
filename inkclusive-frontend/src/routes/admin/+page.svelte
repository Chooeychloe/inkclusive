<script lang="ts">
	import { cn } from '$lib/utils';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import SuggestionTab from '$lib/features/suggestion-bot/presentation/SuggestionTab.svelte';
	import * as Card from '$lib/components/ui/card/index.js';
	import * as Carousel from '$lib/components/ui/carousel/index.js';
	import * as Dialog from '$lib/components/ui/dialog';
	import { onMount } from 'svelte';
	import * as AlertDialog from '$lib/components/ui/alert-dialog/index.js';
	import * as Table from '$lib/components/ui/table/index.js';
	import { Alert, AlertDescription } from '$lib/components/ui/alert';
	import { AlertTriangle, BookText, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Eye, EyeOff, FileText, HandHeart, KeyRound, Search, ShieldCheck, Trash2, X } from '@lucide/svelte';

	import {
		type SortingState,
		type PaginationState,
		type ColumnFiltersState,
		type RowSelectionState,
		getCoreRowModel,
		getPaginationRowModel,
		getSortedRowModel,
		getFilteredRowModel
	} from '@tanstack/table-core';
	import { createSvelteTable, FlexRender } from '$lib/components/ui/data-table/index.js';

	import { Button } from '$lib/components/ui/button/index.js';
	import type { PageData } from './$types.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import AddTermForm from './AddTermForm.svelte';
	import TermLibraryTransfer from './TermLibraryTransfer.svelte';

	import AdminNavbar from './AdminNavbar.svelte';

	import { columns, type TGenderTermProcessed } from './column';
	import { bulkDeleteListItem, getTermRecords } from './service.js';
	import { listStore, refreshStore } from '$lib/stores/refreshStore.js';
	import { Toaster } from 'svelte-sonner';

	// Admin authentication state
	let showPasswordDialog = $state(true);
	let adminPassword = $state('');
	let showAdminPassword = $state(false);
	let authError = $state('');
	let isAuthenticated = $state(false);
	let isAuthLoading = $state(false);

	let burger = $state<TGenderTermProcessed[]>([]);
	let burger2 = $state<TGenderTermProcessed[]>([]);
	let sorting = $state<SortingState>([]);
	let pagination = $state<PaginationState>({ pageIndex: 0, pageSize: 10 });
	let globalFilter = $state('');
	let columnFilters = $state<ColumnFiltersState>([]);
	let rowSelection = $state<RowSelectionState>({});

	// Add loading state
	let isLoading = $state(true);
	let loadError = $state('');
	let totalAlternatives = $derived(
		burger.reduce((total, item) => total + item.alternatives.split(',').filter(Boolean).length, 0)
	);

	// Derived state for submit button
	let isSubmitDisabled = $derived(isAuthLoading || !adminPassword.trim());

	function normalizeSearchText(value: string): string {
		return value.normalize('NFKD').toLocaleLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ').trim();
	}

	function updateSearch(value: string): void {
		globalFilter = value;
		table.setPageIndex(0);
	}

	async function verifyAdminPassword(): Promise<void> {
		if (!adminPassword.trim()) {
			authError = 'Password is required';
			return;
		}

		isAuthLoading = true;
		authError = '';

		try {
			const response = await fetch('/api/admin/login', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({ password: adminPassword })
			});

			const result = await response.json().catch(() => ({}));
			if (!response.ok) {
				authError = result.detail || 'Admin sign-in failed. Please try again.';
				adminPassword = '';
				return;
			}
			isAuthenticated = true;
			showPasswordDialog = false;
			adminPassword = '';
			await loadEverything();
		} catch (err) {
			authError = err instanceof Error ? err.message : 'Authentication failed. Please try again.';
		} finally {
			isAuthLoading = false;
		}
	}

	function handleAuthCancel(): void {
		goto('/'); // Redirect to home or previous page
	}

	function handleAuthKeyPress(event: KeyboardEvent): void {
		if (event.key === 'Enter') {
			verifyAdminPassword();
		}
	}

	function applyRecords(records: Awaited<ReturnType<typeof getTermRecords>>) {
		burger2 = records.map((entry) => ({ term: entry.term, alternatives: entry.options.join(', '), category: entry.category || 'Other', guidance: entry.guidance || '', examples: (entry.examples || []).join('; ') }));
		burger = [...burger2];
		$listStore = [...burger2];
	}

	async function loadEverything() {
		try {
			isLoading = true;
			loadError = '';
			burger = [];
			burger2 = [];
			$listStore = [];
			const records = await getTermRecords();
			applyRecords(records);
		} catch (error) {
			console.error('Error loading data:', error);
			loadError = 'We could not load the term library. Check the backend connection and try again.';
		} finally {
			isLoading = false;
		}
	}

	onMount(async () => {
		try {
			const records = await getTermRecords();
			applyRecords(records);
			isAuthenticated = true;
			showPasswordDialog = false;
		} catch {
			// No valid secure admin cookie yet; leave the sign-in dialog open.
		} finally {
			isLoading = false;
		}
	});

	$effect(() => {
		if ($refreshStore > 0 && isAuthenticated) {
			loadEverything();
		}
	});

	async function logoutAdmin() {
		await fetch('/api/admin/logout', { method: 'POST' });
		isAuthenticated = false;
		showPasswordDialog = true;
		burger = [];
		burger2 = [];
		$listStore = [];
	}

	const table = createSvelteTable({
		get data() {
			return burger;
		},
		columns: columns,
		getCoreRowModel: getCoreRowModel(),
		getPaginationRowModel: getPaginationRowModel(),
		getSortedRowModel: getSortedRowModel(),
		getFilteredRowModel: getFilteredRowModel(),
		globalFilterFn: (row, _columnId, filterValue) => {
			const query = normalizeSearchText(String(filterValue ?? ''));
			if (!query) return true;
			const haystack = normalizeSearchText([
				row.original.term,
				row.original.alternatives,
				row.original.category,
				row.original.guidance,
				row.original.examples
			].join(' '));
			return query.split(/\s+/).every((word) => haystack.includes(word));
		},
		onSortingChange: (updater) => {
			if (typeof updater === 'function') {
				sorting = updater(sorting);
			} else {
				sorting = updater;
			}
		},
		onPaginationChange: (updater) => {
			if (typeof updater === 'function') {
				pagination = updater(pagination);
			} else {
				pagination = updater;
			}
		},
		onColumnFiltersChange: (updater) => {
			if (typeof updater === 'function') {
				columnFilters = updater(columnFilters);
			} else {
				columnFilters = updater;
			}
		},
		onGlobalFilterChange: (updater) => {
			globalFilter = typeof updater === 'function' ? updater(globalFilter) : updater;
		},
		onRowSelectionChange: (updater) => {
			if (typeof updater === 'function') {
				rowSelection = updater(rowSelection);
			} else {
				rowSelection = updater;
			}
		},
		state: {
			get pagination() {
				return pagination;
			},
			get sorting() {
				return sorting;
			},
			get columnFilters() {
				return columnFilters;
			},
			get globalFilter() {
				return globalFilter;
			},
			get rowSelection() {
				return rowSelection;
			}
		}
	});

	let pageWindow = $derived.by(() => {
		const count = Math.max(1, table.getPageCount());
		if (count <= 5) return { count, start: 0, end: count, middle: [] as number[] };
		const current = table.getState().pagination.pageIndex;
		let start = Math.max(1, Math.min(current - 1, count - 4));
		let end = Math.min(count - 1, start + 3);
		start = Math.max(1, end - 3);
		return { count, start, end, middle: Array.from({ length: end - start }, (_, index) => start + index) };
	});

	let { data }: { data: PageData } = $props();
	let deleteDialogOpen = $state(false);
	function openDeleteDialog() {
		deleteDialogOpen = true;
		// Keep dropdown open when dialog opens
	}

	function handleDeleteDialogClose() {
		deleteDialogOpen = false;
	}
</script>

<Toaster richColors position="top-center"></Toaster>

<!-- Admin Password Dialog -->
<AlertDialog.Root bind:open={showPasswordDialog}>
	<AlertDialog.Content class="sm:max-w-md">
		<AlertDialog.Header>
			<div class="flex items-start gap-3">
				<div class="rounded-xl bg-primary/10 p-2.5 text-primary"><ShieldCheck class="size-5" /></div>
				<div class="space-y-1">
					<AlertDialog.Title>Admin access</AlertDialog.Title>
					<AlertDialog.Description>Enter your administrator password to manage the language library.</AlertDialog.Description>
				</div>
			</div>
		</AlertDialog.Header>

		<div class="space-y-2 py-2">
			<label for="admin-password" class="text-sm font-medium">Password</label>
			<div class="relative">
				<Input
					id="admin-password"
					type={showAdminPassword ? 'text' : 'password'}
					autocomplete="current-password"
					placeholder="Enter your password"
					bind:value={adminPassword}
					onkeypress={handleAuthKeyPress}
					disabled={isAuthLoading}
					class="mb-2 pr-11"
				/>
				<button type="button" class="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" aria-label={showAdminPassword ? 'Hide password' : 'Show password'} title={showAdminPassword ? 'Hide password' : 'Show password'} aria-pressed={showAdminPassword} onclick={() => (showAdminPassword = !showAdminPassword)} disabled={isAuthLoading}>
					{#if showAdminPassword}<EyeOff size={17} aria-hidden="true" />{:else}<Eye size={17} aria-hidden="true" />{/if}
				</button>
			</div>

			{#if authError}
				<Alert variant="destructive" class="mt-2">
					<AlertTriangle class="h-4 w-4" />
					<AlertDescription>{authError}</AlertDescription>
				</Alert>
			{/if}
		</div>

		<AlertDialog.Footer class="mt-2 gap-2">
			<AlertDialog.Cancel onclick={handleAuthCancel} disabled={isAuthLoading}>
				Cancel
			</AlertDialog.Cancel>
			<Button onclick={verifyAdminPassword} disabled={isSubmitDisabled} class="gap-2">
				<KeyRound class="size-4" />
				{#if isAuthLoading}
					Verifying...
				{:else}
					Access Page
				{/if}
			</Button>
		</AlertDialog.Footer>
	</AlertDialog.Content>
</AlertDialog.Root>

<!-- Protected Content (only shown when authenticated) -->
{#if isAuthenticated}
	<main class="min-h-[100svh] w-full bg-background text-foreground">
		{#key $listStore}
			<AdminNavbar onLogout={logoutAdmin}></AdminNavbar>

			<div class="mx-auto max-w-[1440px] px-4 py-8 sm:px-8 lg:py-10">
				<div class="mb-8 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
					<div>
						<div class="mb-3 inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-primary">
						<span class="h-1.5 w-1.5 rounded-full bg-primary"></span> Language resources
						</div>
						<h1 class="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">Term library</h1>
						<p class="mt-2 max-w-xl text-sm leading-6 text-muted-foreground sm:text-base">Manage inclusive language guidance used across Inkclusive suggestions.</p>
					</div>
					<div class="flex items-center gap-2 text-sm text-muted-foreground">
						<span class="h-2 w-2 rounded-full {loadError ? 'bg-rose-500' : isLoading ? 'animate-pulse bg-amber-400' : 'bg-emerald-500'}"></span>
						{loadError ? 'Connection issue' : isLoading ? 'Syncing library' : 'Library connected'}
					</div>
				</div>

				<div class="mb-6 grid gap-4 sm:grid-cols-3">
					<div class="rounded-2xl border border-border bg-card p-5 shadow-sm">
						<p class="text-sm font-medium text-muted-foreground">Inclusive terms</p>
						<div class="mt-3 flex items-end justify-between"><p class="text-3xl font-bold tracking-tight text-foreground">{isLoading ? '—' : burger.length}</p><span class="rounded-lg bg-primary/10 p-2 text-primary"><BookText class="size-5" aria-hidden="true" /></span></div>
						<p class="mt-2 text-xs text-muted-foreground">Managed in your language library</p>
					</div>
					<div class="rounded-2xl border border-border bg-card p-5 shadow-sm">
						<p class="text-sm font-medium text-muted-foreground">Alternative suggestions</p>
						<div class="mt-3 flex items-end justify-between"><p class="text-3xl font-bold tracking-tight text-foreground">{isLoading ? '—' : totalAlternatives}</p><span class="rounded-lg bg-primary/10 p-2 text-primary"><FileText class="size-5" aria-hidden="true" /></span></div>
						<p class="mt-2 text-xs text-muted-foreground">Options available across all terms</p>
					</div>
					<div class="rounded-2xl border border-border bg-card p-5 shadow-sm">
						<p class="text-sm font-medium text-muted-foreground">Review workflow</p>
						<div class="mt-3 flex items-end justify-between"><p class="text-lg font-bold tracking-tight text-foreground">Keep it inclusive</p><span class="rounded-lg bg-primary/10 p-2 text-primary"><HandHeart class="size-5" aria-hidden="true" /></span></div>
						<p class="mt-2 text-xs text-muted-foreground">Use clear, respectful language in every entry</p>
					</div>
				</div>

				<section class="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
					<div class="flex flex-col gap-4 border-b border-border p-5 lg:flex-row lg:items-center lg:justify-between sm:px-6">
						<div>
							<h2 class="text-lg font-bold text-foreground">Managed terms</h2>
							<p class="mt-1 text-sm text-muted-foreground">Search, edit, add, or remove language suggestions.</p>
						</div>
						<div class="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
						<div class="min-w-0 flex-1 sm:min-w-72">
						<div class="relative w-full">
							<label for="term-search" class="sr-only">Search the term library</label>
							<Search class="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
							<Input
								id="term-search"
								placeholder="Search terms, alternatives, guidance…"
								value={globalFilter}
								oninput={(event) => updateSearch(event.currentTarget.value)}
								class="pl-9 pr-10"
								autocomplete="off"
								aria-describedby="term-search-help"
								disabled={isLoading}
							/>
							{#if globalFilter}
								<button type="button" class="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-muted-foreground transition hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" aria-label="Clear search" title="Clear search" onclick={() => updateSearch('')}>
									<X size={15} aria-hidden="true" />
								</button>
							{/if}
						</div>
						<p id="term-search-help" class="mt-1.5 text-xs text-muted-foreground">Search term names, alternatives, categories, examples, and guidance. All words must match.</p>
						</div>
						<div class="flex items-center gap-2">
						<AddTermForm {data}></AddTermForm>
						<TermLibraryTransfer />
						</div>
						</div>
				</div>
				{#if loadError}
					<div role="alert" class="m-5 rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">{loadError}</div>
				{/if}
				<div class="overflow-x-auto px-5 sm:px-6">
					<Table.Root>
						<Table.Header>
							{#each table.getHeaderGroups() as headerGroup (headerGroup.id)}
								<Table.Row>
									{#each headerGroup.headers as header (header.id)}
										<Table.Head>
											{#if !header.isPlaceholder}
												<FlexRender
													content={header.column.columnDef.header}
													context={header.getContext()}
												/>
											{/if}
										</Table.Head>
									{/each}
								</Table.Row>
							{/each}
						</Table.Header>
						<Table.Body>
							{#if isLoading}
								<!-- Loading skeleton rows -->
								{#each Array(5) as _, i}
									<Table.Row>
										{#each columns as column}
												<Table.Cell class="border-t border-t-border">
										<div class="h-4 animate-pulse rounded bg-muted"></div>
											</Table.Cell>
										{/each}
									</Table.Row>
								{/each}
							{:else}
								{#each table.getRowModel().rows as row (row.id)}
									<Table.Row data-state={row.getIsSelected() && 'selected'}>
										{#each row.getVisibleCells() as cell (cell.id)}
										<Table.Cell class="border-t border-t-border">
												<FlexRender
													content={cell.column.columnDef.cell}
													context={cell.getContext()}
												/>
											</Table.Cell>
										{/each}
									</Table.Row>
								{:else}
									<Table.Row>
										<Table.Cell colspan={columns.length} class="h-24 text-center">
											{#if globalFilter.trim()}
												No terms match: {globalFilter}. Try another search.
											{:else}
												No terms have been added yet.
											{/if}
										</Table.Cell>
									</Table.Row>
								{/each}
							{/if}
						</Table.Body>
					</Table.Root>
					<div class="flex flex-col gap-4 border-t border-border bg-muted/20 px-4 py-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
						<div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-5">
							<Button size="sm" variant="destructive" onclick={openDeleteDialog} disabled={isLoading || table.getSelectedRowModel().rows.length === 0}>Delete selected ({table.getSelectedRowModel().rows.length})</Button>
							<p class="text-sm text-muted-foreground" aria-live="polite">
								{#if isLoading}Loading terms…{:else}{table.getFilteredSelectedRowModel().rows.length} of {table.getFilteredRowModel().rows.length} selected{/if}
							</p>
						</div>
						<div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-5">
							<p class="whitespace-nowrap text-sm text-muted-foreground" aria-live="polite">
								{#if isLoading}Loading…{:else}
									{table.getFilteredRowModel().rows.length === 0 ? 0 : table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1}–{Math.min((table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize, table.getFilteredRowModel().rows.length)} of {table.getFilteredRowModel().rows.length} terms
								{/if}
							</p>
							<div class="flex items-center justify-between gap-2 sm:justify-start">
								<label for="terms-page-size" class="whitespace-nowrap text-sm text-muted-foreground">Rows per page</label>
								<select id="terms-page-size" class="h-9 rounded-md border border-input bg-background px-2 text-sm text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" value={pagination.pageSize} disabled={isLoading} onchange={(event) => table.setPageSize(Number(event.currentTarget.value))}>
									{#each [10, 25, 50, 100] as size}<option value={size}>{size}</option>{/each}
								</select>
							</div>
							<nav class="flex items-center justify-center gap-1" aria-label="Term library pages">
								<Button variant="outline" size="icon" class="hidden h-9 w-9 sm:inline-flex" aria-label="First page" title="First page" onclick={() => table.setPageIndex(0)} disabled={isLoading || !table.getCanPreviousPage()}><ChevronsLeft aria-hidden="true" /></Button>
								<Button variant="outline" size="icon" class="h-9 w-9" aria-label="Previous page" title="Previous page" onclick={() => table.previousPage()} disabled={isLoading || !table.getCanPreviousPage()}><ChevronLeft aria-hidden="true" /></Button>
								<span class="whitespace-nowrap px-2 text-sm font-medium text-muted-foreground sm:hidden" aria-live="polite">Page {pagination.pageIndex + 1} of {pageWindow.count}</span>
								{#if pageWindow.count <= 5}
									{#each Array.from({ length: pageWindow.count }, (_, index) => index) as pageIndex (pageIndex)}
										<Button variant={pagination.pageIndex === pageIndex ? 'secondary' : 'ghost'} size="icon" class="hidden h-9 w-9 sm:inline-flex" aria-label={`Page ${pageIndex + 1}`} aria-current={pagination.pageIndex === pageIndex ? 'page' : undefined} onclick={() => table.setPageIndex(pageIndex)} disabled={isLoading}>{pageIndex + 1}</Button>
									{/each}
								{:else}
									<Button variant={pagination.pageIndex === 0 ? 'secondary' : 'ghost'} size="icon" class="hidden h-9 w-9 sm:inline-flex" aria-label="Page 1" aria-current={pagination.pageIndex === 0 ? 'page' : undefined} onclick={() => table.setPageIndex(0)} disabled={isLoading}>1</Button>
									{#if pageWindow.start > 1}<span class="hidden px-0.5 text-muted-foreground sm:inline" aria-hidden="true">…</span>{/if}
									{#each pageWindow.middle as pageIndex (pageIndex)}
										<Button variant={pagination.pageIndex === pageIndex ? 'secondary' : 'ghost'} size="icon" class="hidden h-9 w-9 sm:inline-flex" aria-label={`Page ${pageIndex + 1}`} aria-current={pagination.pageIndex === pageIndex ? 'page' : undefined} onclick={() => table.setPageIndex(pageIndex)} disabled={isLoading}>{pageIndex + 1}</Button>
									{/each}
									{#if pageWindow.end < pageWindow.count - 1}<span class="hidden px-0.5 text-muted-foreground sm:inline" aria-hidden="true">…</span>{/if}
									<Button variant={pagination.pageIndex === pageWindow.count - 1 ? 'secondary' : 'ghost'} size="icon" class="hidden h-9 w-9 sm:inline-flex" aria-label={`Page ${pageWindow.count}`} aria-current={pagination.pageIndex === pageWindow.count - 1 ? 'page' : undefined} onclick={() => table.setPageIndex(pageWindow.count - 1)} disabled={isLoading}>{pageWindow.count}</Button>
								{/if}
								<Button variant="outline" size="icon" class="h-9 w-9" aria-label="Next page" title="Next page" onclick={() => table.nextPage()} disabled={isLoading || !table.getCanNextPage()}><ChevronRight aria-hidden="true" /></Button>
								<Button variant="outline" size="icon" class="hidden h-9 w-9 sm:inline-flex" aria-label="Last page" title="Last page" onclick={() => table.setPageIndex(table.getPageCount() - 1)} disabled={isLoading || !table.getCanNextPage()}><ChevronsRight aria-hidden="true" /></Button>
							</nav>
						</div>
					</div>
				</div>
				</section>
			</div>

			<Dialog.Root bind:open={deleteDialogOpen} onOpenChange={handleDeleteDialogClose}>
				<Dialog.Content class="sm:max-w-md">
					<Dialog.Header>
						<div class="flex items-start gap-3">
							<div class="rounded-full bg-destructive/10 p-2 text-destructive"><AlertTriangle class="size-5" /></div>
							<div class="space-y-1"><Dialog.Title>Delete selected terms?</Dialog.Title>
								<Dialog.Description>This permanently removes {table.getSelectedRowModel().rows.length} selected terms and their alternatives from the library.</Dialog.Description>
							</div>
						</div>
					</Dialog.Header>
					<Dialog.Footer class="mt-2 gap-2">
						<Button
							variant="destructive"
							onclick={() => {
								const selectedRowsData = table
									.getSelectedRowModel()
									.rows.map((row) => row.original);
								const selectedTerms = selectedRowsData.map((data) => data.term);
								bulkDeleteListItem(selectedTerms);
								table.resetRowSelection(true);
								deleteDialogOpen = false;
							}}><Trash2 class="mr-2 size-4" />Delete selected</Button
						>
						<Button variant="outline" onclick={() => (deleteDialogOpen = false)}>Cancel</Button>
					</Dialog.Footer>
				</Dialog.Content>
			</Dialog.Root>
		{/key}
	</main>
{/if}

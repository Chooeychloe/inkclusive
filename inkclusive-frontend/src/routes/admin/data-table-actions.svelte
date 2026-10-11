<script lang="ts">
	import { Ellipsis, Pencil, Save, Trash2, TriangleAlert } from '@lucide/svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu/index.js';
	import type { TGenderTermProcessed } from './column';
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import Input from '$lib/components/ui/input/input.svelte';
	import { Label } from '$lib/components/ui/label';
	import { deleteListItem, putList } from './service';

	let { term, index }: { term: TGenderTermProcessed; index: number } = $props();

	// State to control dropdown visibility
	let dropdownOpen = $state(false);
	let editDialogOpen = $state(false);
	let deleteDialogOpen = $state(false);

	let optionsResponse = $state('');
	let categoryResponse = $state('Other');
	let guidanceResponse = $state('');
	let examplesResponse = $state('');
	let isSaving = $state(false);
	// Function to handle dialog open while keeping dropdown open
	function openEditDialog() {
		optionsResponse = term.alternatives;
		categoryResponse = term.category || 'Other';
		guidanceResponse = term.guidance || '';
		examplesResponse = term.examples || '';
		editDialogOpen = true;
		// Keep dropdown open when dialog opens
		dropdownOpen = true;
	}

	function openDeleteDialog() {
		deleteDialogOpen = true;
		// Keep dropdown open when dialog opens
		dropdownOpen = true;
	}

	// Close dropdown when dialogs close
	function handleEditDialogClose() {
		editDialogOpen = false;
		dropdownOpen = false;
	}

	function handleDeleteDialogClose() {
		deleteDialogOpen = false;
		dropdownOpen = false;
	}

</script>

<DropdownMenu.Root bind:open={dropdownOpen}>
	<DropdownMenu.Trigger>
		{#snippet child({ props })}
			<Button {...props} variant="ghost" size="icon" class="relative size-8 p-0">
				<span class="sr-only">Open menu</span>
				<Ellipsis />
			</Button>
		{/snippet}
	</DropdownMenu.Trigger>
	<DropdownMenu.Content>
		<DropdownMenu.Group>
			<DropdownMenu.Label>Actions</DropdownMenu.Label>

			<!-- Edit Dialog -->
			<DropdownMenu.Item
				onSelect={(e) => {
					e.preventDefault();
					openEditDialog();
				}}
			>
				<Pencil class="mr-2 size-4" />Edit term
			</DropdownMenu.Item>

			<!-- Delete Dialog -->
			<DropdownMenu.Item
				onSelect={(e) => {
					e.preventDefault();
					openDeleteDialog();
				}}
			>
				<Trash2 class="mr-2 size-4" />Delete term
			</DropdownMenu.Item>
		</DropdownMenu.Group>
	</DropdownMenu.Content>
</DropdownMenu.Root>

<!-- Edit Dialog (outside dropdown) -->
<Dialog.Root bind:open={editDialogOpen} onOpenChange={handleEditDialogClose}>
	<Dialog.Content class="flex max-h-[min(92dvh,760px)] flex-col gap-0 overflow-hidden p-0 sm:max-w-xl">
		<Dialog.Header class="shrink-0 border-b border-border bg-muted/20 px-5 py-5 pr-12 sm:px-7">
			<div class="flex items-start gap-3"><div class="rounded-xl bg-primary/10 p-2.5 text-primary"><Pencil class="size-5" /></div><div class="space-y-1"><Dialog.Title class="text-lg">Edit term</Dialog.Title><Dialog.Description>Update the term details used in suggestions and matching.</Dialog.Description></div></div>
		</Dialog.Header>
		<div class="min-h-0 flex-1 space-y-5 overflow-y-auto px-5 py-5 sm:px-7">
			<div class="rounded-lg border border-border bg-muted/30 px-4 py-3"><p class="text-xs font-medium uppercase tracking-wide text-muted-foreground">Term being managed</p><p class="mt-1 break-words font-semibold">{term.term}</p></div>
			<div class="grid gap-5 sm:grid-cols-2">
				<div class="grid gap-2"><Label for="term-alternatives">Suggested alternatives</Label><Input id="term-alternatives" bind:value={optionsResponse} placeholder="Separate alternatives with commas" /><p class="text-xs text-muted-foreground">Separate options with commas.</p></div>
				<div class="grid gap-2"><Label for="term-category">Category</Label><Input id="term-category" bind:value={categoryResponse} placeholder="e.g. Job title" /></div>
			</div>
			<div class="grid gap-5 sm:grid-cols-2">
				<div class="grid gap-2"><Label for="term-guidance">Suggestion guidance <span class="font-normal text-muted-foreground">(optional)</span></Label><textarea id="term-guidance" bind:value={guidanceResponse} class="min-h-28 w-full resize-y rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring" placeholder="Explain why this wording may need review."></textarea></div>
				<div class="grid gap-2"><Label for="term-examples">Example phrases <span class="font-normal text-muted-foreground">(optional)</span></Label><textarea id="term-examples" bind:value={examplesResponse} class="min-h-28 w-full resize-y rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring" placeholder="Separate examples with semicolons."></textarea></div>
			</div>
		</div>
		<Dialog.Footer class="shrink-0 border-t border-border bg-muted/30 px-5 py-4 sm:px-7">
			<Button type="button" variant="outline" onclick={handleEditDialogClose}>Cancel</Button>
			<Button
				type="button"
				disabled={isSaving || !optionsResponse.trim() || !categoryResponse.trim()}
				onclick={async () => {
					isSaving = true;
					try { await putList(term.term, optionsResponse, categoryResponse, guidanceResponse, examplesResponse); handleEditDialogClose(); }
					catch { /* The API service displays the error. */ }
					finally { isSaving = false; }
				}}><Save class="mr-2 size-4" />{isSaving ? 'Saving…' : 'Save changes'}</Button
			>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>

<!-- Delete Dialog (outside dropdown) -->
<Dialog.Root bind:open={deleteDialogOpen} onOpenChange={handleDeleteDialogClose}>
	<Dialog.Content class="sm:max-w-md">
		<Dialog.Header>
			<div class="flex items-start gap-3">
				<div class="rounded-full bg-destructive/10 p-2 text-destructive"><TriangleAlert class="size-5" /></div>
				<div class="space-y-1"><Dialog.Title>Delete this term?</Dialog.Title>
			<Dialog.Description>
				This permanently removes <strong>{term.term}</strong> and its alternatives from the library.
			</Dialog.Description>
				</div>
			</div>
		</Dialog.Header>
		<Dialog.Footer class="mt-2 gap-2">
			<Button
				variant="destructive"
				onclick={() => {
					deleteDialogOpen = false;
					deleteListItem(term.term);
				}}><Trash2 class="mr-2 size-4" />Delete term</Button
			>
			<Button
				variant="outline"
				onclick={() => {
					deleteDialogOpen = false;
				}}>Cancel</Button
			>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>

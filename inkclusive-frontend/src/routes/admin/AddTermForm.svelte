<script lang="ts">
	import { untrack } from 'svelte';
	import * as Form from '$lib/components/ui/form';
	import Button from '$lib/components/ui/button/button.svelte';
	import * as Dialog from '$lib/components/ui/dialog';
	import Input from '$lib/components/ui/input/input.svelte';
	import { type SuperValidated, superForm } from 'sveltekit-superforms';
	import { zod4Client as zodClient } from 'sveltekit-superforms/adapters';
	import { formSchema } from './schema';
	import { postBulkList } from './service';
	import { Plus, Tags, Trash2, Upload } from '@lucide/svelte';

	type TermDraft = { term: string; alternatives: string; category: string; guidance: string; examples: string };
	interface Props { data: { form: SuperValidated<TermDraft> } }
	let { data }: Props = $props();
	let dialogOpen = $state(false);
	let isSaving = $state(false);
	let submittedEntries: TermDraft[] = $state([]);

	const form = untrack(() => superForm(data.form, {
		validators: zodClient(formSchema),
		SPA: true,
		onUpdated: ({ form }) => {
			if (form.valid) {
				submittedEntries.push({ ...form.data });
				form.data.term = '';
				form.data.alternatives = '';
				form.data.category = 'Other';
				form.data.guidance = '';
				form.data.examples = '';
			}
		}
	}));
	const { form: formData, enhance, reset } = form;

	function closeDialog() {
		dialogOpen = false;
		submittedEntries = [];
		reset();
	}

	async function saveTerms() {
		if (!submittedEntries.length || isSaving) return;
		isSaving = true;
		try {
			if (await postBulkList(submittedEntries)) closeDialog();
		} finally {
			isSaving = false;
		}
	}
</script>

<Dialog.Root open={dialogOpen} onOpenChange={(open) => open ? (dialogOpen = true) : closeDialog()}>
	<Button variant="outline" class="gap-2" onclick={() => (dialogOpen = true)}><Plus class="size-4" />Add term</Button>
	<Dialog.Content class="flex max-h-[min(92dvh,860px)] flex-col gap-0 overflow-hidden p-0 sm:max-w-2xl">
		<Dialog.Header class="shrink-0 border-b border-border bg-muted/20 px-5 py-5 pr-12 sm:px-7">
			<div class="flex items-start gap-3">
				<div class="rounded-xl bg-primary/10 p-2.5 text-primary"><Tags class="size-5" /></div>
				<div class="space-y-1">
					<Dialog.Title class="text-lg">Add language terms</Dialog.Title>
					<Dialog.Description>Build a term with alternatives and practical usage guidance, then add it to your library.</Dialog.Description>
				</div>
			</div>
		</Dialog.Header>

		<form method="POST" use:enhance class="min-h-0 flex-1 space-y-5 overflow-y-auto px-5 py-5 sm:px-7">
			<div class="grid gap-5 sm:grid-cols-2">
				<Form.Field {form} name="term">
					<Form.Control>
						{#snippet children({ props })}
							<Form.Label>Term to flag</Form.Label>
							<Input placeholder="e.g. chairman" {...props} bind:value={$formData.term} />
						{/snippet}
					</Form.Control>
					<Form.Description>The word or phrase the checker should recognize.</Form.Description>
					<Form.FieldErrors />
				</Form.Field>
				<Form.Field {form} name="alternatives">
					<Form.Control>
						{#snippet children({ props })}
							<Form.Label>Suggested alternatives</Form.Label>
							<Input placeholder="chairperson, chair" {...props} bind:value={$formData.alternatives} />
						{/snippet}
					</Form.Control>
					<Form.Description>Separate options with commas.</Form.Description>
					<Form.FieldErrors />
				</Form.Field>
			</div>

			<div class="grid gap-5 sm:grid-cols-2">
				<Form.Field {form} name="category">
					<Form.Control>
						{#snippet children({ props })}
							<Form.Label>Category</Form.Label>
							<select class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-ring" {...props} bind:value={$formData.category}>
								<option>Other</option>
								<option>Occupation &amp; role</option>
								<option>Collective language</option>
								<option>Education</option>
								<option>Family &amp; relationships</option>
								<option>Gendered reference</option>
								<option>Public facilities</option>
								<option>Sexual orientation</option>
								<option>Titles &amp; status</option>
								<option>Potentially stigmatizing wording</option>
								<option>Pronoun</option><option>Age</option><option>Disability</option><option>Identity</option>
							</select>
						{/snippet}
					</Form.Control>
				</Form.Field>
				<Form.Field {form} name="examples">
					<Form.Control>
						{#snippet children({ props })}<Form.Label>Example phrases <span class="font-normal text-muted-foreground">(optional)</span></Form.Label><Input placeholder="Use a semicolon between examples" {...props} bind:value={$formData.examples} />{/snippet}
					</Form.Control>
				</Form.Field>
			</div>

			<Form.Field {form} name="guidance">
				<Form.Control>
					{#snippet children({ props })}<Form.Label>Guidance shown with suggestions <span class="font-normal text-muted-foreground">(optional)</span></Form.Label><textarea class="min-h-24 w-full resize-y rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring" placeholder="Explain why this wording may need review and when an alternative fits." {...props} bind:value={$formData.guidance}></textarea>{/snippet}
				</Form.Control>
			</Form.Field>

			<div class="flex justify-end border-t border-border pt-4">
				<Form.Button class="w-full gap-2 sm:w-auto"><Plus class="size-4" />Add to batch</Form.Button>
			</div>
		</form>

		{#if submittedEntries.length > 0}
			<div class="shrink-0 space-y-3 border-t border-border bg-muted/30 px-5 py-4 sm:px-7">
				<div class="flex items-center justify-between gap-3">
					<div><h3 class="text-sm font-semibold">Batch ready</h3><p class="text-xs text-muted-foreground">Review these entries before saving.</p></div>
					<span class="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">{submittedEntries.length} {submittedEntries.length === 1 ? 'term' : 'terms'}</span>
				</div>
				<ul class="max-h-28 space-y-2 overflow-y-auto pr-1">
					{#each submittedEntries as entry, index}
						<li class="flex items-start justify-between gap-3 rounded-lg border border-border bg-card px-3 py-2.5 text-sm">
							<div class="min-w-0"><p class="font-medium">{entry.term}<span class="ml-2 rounded-full bg-muted px-2 py-0.5 text-xs font-normal text-muted-foreground">{entry.category}</span></p><p class="mt-1 truncate text-xs text-muted-foreground">{entry.alternatives}</p></div>
							<Button type="button" variant="ghost" size="icon" class="size-8 shrink-0 text-muted-foreground hover:text-destructive" aria-label="Remove {entry.term} from batch" onclick={() => submittedEntries.splice(index, 1)}><Trash2 class="size-4" /></Button>
						</li>
					{/each}
				</ul>
				<div class="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
					<Button type="button" variant="outline" onclick={closeDialog}>Cancel</Button>
					<Button type="button" class="gap-2" disabled={isSaving} onclick={saveTerms}><Upload class="size-4" />{isSaving ? 'Saving terms…' : 'Save terms to library'}</Button>
				</div>
			</div>
		{/if}
	</Dialog.Content>
</Dialog.Root>

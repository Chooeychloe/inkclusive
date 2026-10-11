<script lang="ts">
	import { ArrowLeft, Check, Info, Plus, Trash2, UsersRound } from '@lucide/svelte';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label/index.js';
	import * as Select from '$lib/components/ui/select/index.js';
	import type { TformSchema } from '$lib/features/suggestion-bot/entities/formSchema';
	import { preferenceStore } from '$lib/stores/preferenceStore';
	import { onMount } from 'svelte';

	let { toPreferenceModule }: { toPreferenceModule: () => void } = $props();
	let preferences = $state<TformSchema[]>([]);
	const pronounOptions = new Set(['male', 'female', 'gender_fair']);

	function isComplete(preference: TformSchema): boolean {
		return Boolean(preference.name.trim()) && pronounOptions.has(preference.pronoun);
	}

	function isDuplicateName(index: number): boolean {
		const currentName = preferences[index]?.name.trim().toLocaleLowerCase();
		return Boolean(currentName && preferences.some((item, otherIndex) => otherIndex !== index && item.name.trim().toLocaleLowerCase() === currentName));
	}

	let canAddAnother = $derived(preferences.every((preference, index) => isComplete(preference) && !isDuplicateName(index)));
	let hasDuplicateNames = $derived(preferences.some((_, index) => isDuplicateName(index)));
	let savedCount = $derived(preferences.filter((preference, index) => isComplete(preference) && !isDuplicateName(index)).length);

	function persistCompletePreferences() {
		const complete = preferences
			.filter((preference, index) => isComplete(preference) && !isDuplicateName(index))
			.map((preference) => ({ name: preference.name.trim(), pronoun: preference.pronoun }));
		$preferenceStore = complete;
		localStorage.setItem('preferences', JSON.stringify(complete));
	}

	function addPreference() {
		if (!canAddAnother) return;
		preferences = [...preferences, { name: '', pronoun: '' }];
		persistCompletePreferences();
	}

	function removePreference(index: number) {
		preferences = preferences.filter((_, itemIndex) => itemIndex !== index);
		persistCompletePreferences();
	}

	function pronounLabel(value: string): string {
		if (value === 'male') return 'He/Him';
		if (value === 'female') return 'She/Her';
		if (value === 'gender_fair') return 'They/Them';
		return 'Choose pronouns';
	}

	onMount(() => {
		try {
			const stored: unknown = JSON.parse(localStorage.getItem('preferences') || '[]');
			if (Array.isArray(stored)) {
				const seenNames = new Set<string>();
				preferences = stored.reduce<TformSchema[]>((valid, item: unknown) => {
					if (!item || typeof item !== 'object') return valid;
					const candidate = item as Partial<TformSchema>;
					const name = typeof candidate.name === 'string' ? candidate.name.trim() : '';
					const pronoun = typeof candidate.pronoun === 'string' ? candidate.pronoun : '';
					const normalizedName = name.toLocaleLowerCase();
					if (!name || !pronounOptions.has(pronoun) || seenNames.has(normalizedName)) return valid;
					seenNames.add(normalizedName);
					valid.push({ name, pronoun });
					return valid;
				}, []);
			}
		} catch {
			preferences = [];
		}
		persistCompletePreferences();
	});
</script>

<section class="flex h-full min-h-0 w-full flex-col bg-background text-foreground">
	<header class="flex min-h-16 items-center gap-3 border-b border-border bg-card px-4 py-3">
		<Button variant="ghost" size="icon" class="size-9 shrink-0" aria-label="Back to suggestions" title="Back to suggestions" onclick={toPreferenceModule}>
			<ArrowLeft class="size-5" aria-hidden="true" />
		</Button>
		<div class="flex min-w-0 items-center gap-2.5">
			<div class="rounded-lg bg-primary/10 p-2 text-primary"><UsersRound class="size-5" aria-hidden="true" /></div>
			<div class="min-w-0">
				<h2 class="truncate text-base font-semibold">Pronoun preferences</h2>
				<p class="text-xs text-muted-foreground">Personalize suggestions by name</p>
			</div>
		</div>
	</header>

	<div class="min-h-0 flex-1 space-y-4 overflow-y-auto p-4">
		<div class="rounded-xl border border-primary/20 bg-primary/5 p-3.5" role="note">
			<div class="flex items-start gap-2.5">
				<Info class="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
				<div class="space-y-1.5 text-sm leading-5">
					<p class="font-semibold text-foreground">How to set preferences</p>
					<p class="text-muted-foreground">Enter each person's name as it appears in your text, then choose their pronouns. Complete entries are saved on this device and sent with your text when you run the gender-fair check. Leave the list empty if you do not need name-based pronoun suggestions.</p>
				</div>
			</div>
		</div>

		{#if preferences.length === 0}
			<div class="rounded-xl border border-dashed border-border bg-muted/20 px-4 py-7 text-center">
				<div class="mx-auto mb-3 flex size-10 items-center justify-center rounded-full bg-primary/10 text-primary"><UsersRound class="size-5" aria-hidden="true" /></div>
				<p class="text-sm font-medium">No preferences added</p>
				<p class="mt-1 text-xs leading-5 text-muted-foreground">Add a name and pronoun set to guide suggestions for a person in your document.</p>
			</div>
		{:else}
			<div class="space-y-3">
				{#each preferences as preference, index (index)}
					<article class="space-y-3 rounded-xl border border-border bg-card p-3.5 shadow-sm">
						<div class="flex items-center justify-between gap-2">
							<div class="flex items-center gap-2">
								<span class="flex size-6 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">{index + 1}</span>
								<h3 class="text-sm font-semibold">Person {index + 1}</h3>
							</div>
							{#if isComplete(preference) && !isDuplicateName(index)}
								<span class="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-1 text-xs font-medium text-emerald-700 dark:text-emerald-300"><Check size={13} aria-hidden="true" /> Saved</span>
							{/if}
							<Button variant="ghost" size="icon" class="size-8 shrink-0 text-muted-foreground hover:text-destructive" aria-label={`Remove person ${index + 1}${preference.name ? `, ${preference.name}` : ''}`} title="Remove person" onclick={() => removePreference(index)}>
								<Trash2 class="size-4" aria-hidden="true" />
							</Button>
						</div>

						<div class="space-y-1.5">
							<Label for={`preference-name-${index}`}>Name <span class="text-destructive" aria-hidden="true">*</span></Label>
							<Input id={`preference-name-${index}`} type="text" autocomplete="off" placeholder="Name as written in your text" bind:value={preference.name} oninput={persistCompletePreferences} aria-required="true" aria-invalid={isDuplicateName(index)} />
							{#if isDuplicateName(index)}<p class="text-xs text-destructive" role="alert">Each person needs a unique name.</p>{/if}
						</div>

						<div class="space-y-1.5">
							<Label for={`preference-pronouns-${index}`}>Pronouns <span class="text-destructive" aria-hidden="true">*</span></Label>
							<Select.Root type="single" value={preference.pronoun} onValueChange={(value) => { preference.pronoun = value ?? ''; persistCompletePreferences(); }}>
								<Select.Trigger id={`preference-pronouns-${index}`} class="w-full" aria-label={`Pronouns for person ${index + 1}`} aria-required="true">
									{pronounLabel(preference.pronoun)}
								</Select.Trigger>
								<Select.Content>
									<Select.Item value="male">He/Him</Select.Item>
									<Select.Item value="female">She/Her</Select.Item>
									<Select.Item value="gender_fair">They/Them</Select.Item>
								</Select.Content>
							</Select.Root>
						</div>
					</article>
				{/each}
			</div>
		{/if}
	</div>

	<footer class="space-y-2 border-t border-border bg-card p-3.5">
		<Button class="w-full gap-2" variant="outline" onclick={addPreference} disabled={!canAddAnother}>
			<Plus class="size-4" aria-hidden="true" /> Add person
		</Button>
		<p class="text-center text-xs leading-5 text-muted-foreground" aria-live="polite">
			{#if hasDuplicateNames}Use a different name for each person.{:else if !canAddAnother}Complete each person's name and pronouns before adding another.{:else if savedCount > 0}{savedCount} {savedCount === 1 ? 'preference' : 'preferences'} saved on this device.{:else}Both name and pronouns are required for each person.{/if}
		</p>
	</footer>
</section>

<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Download, FileUp } from '@lucide/svelte';
	import { toast } from 'svelte-sonner';
	import { getTermRecords, postBulkList } from './service';
	import type { TGenderTermProcessed } from './column';

	let busy = $state(false);
	function csvCell(value: string) { return `"${value.replaceAll('"', '""')}"`; }
	function parseCsv(text: string): string[][] {
		const rows: string[][] = []; let row: string[] = []; let cell = ''; let quoted = false;
		for (let i = 0; i < text.length; i++) {
			const char = text[i];
			if (quoted && char === '"' && text[i + 1] === '"') { cell += '"'; i++; }
			else if (char === '"') quoted = !quoted;
			else if (char === ',' && !quoted) { row.push(cell); cell = ''; }
			else if ((char === '\n' || char === '\r') && !quoted) { if (char === '\r' && text[i + 1] === '\n') i++; row.push(cell); if (row.some(v => v.trim())) rows.push(row); row = []; cell = ''; }
			else cell += char;
		}
		row.push(cell); if (row.some(v => v.trim())) rows.push(row); return rows;
	}
	async function exportTerms() {
		try {
			const records = await getTermRecords();
			const rows = [['term', 'alternatives', 'category', 'guidance', 'examples'], ...records.map(r => [r.term, r.options.join('|'), r.category || 'Other', r.guidance || '', (r.examples || []).join('|')])];
			const blob = new Blob([rows.map(row => row.map(csvCell).join(',')).join('\r\n')], { type: 'text/csv;charset=utf-8' });
			const link = document.createElement('a'); link.href = URL.createObjectURL(blob); link.download = 'inkclusive-term-library.csv'; link.click(); URL.revokeObjectURL(link.href);
		} catch { toast.error('Could not export the term library.'); }
	}
	async function importTerms(event: Event) {
		const input = event.currentTarget as HTMLInputElement; const file = input.files?.[0]; if (!file) return;
		busy = true;
		try {
			const rows = parseCsv(await file.text());
			const header = rows.shift()?.map(x => x.trim().toLowerCase());
			if (!header || header[0] !== 'term') throw new Error('The first column must be term.');
			const index = (name: string) => header.indexOf(name);
			const entries: TGenderTermProcessed[] = rows.map(row => ({ term: row[index('term')] || '', alternatives: (row[index('alternatives')] || '').split('|').join(', '), category: row[index('category')] || 'Other', guidance: row[index('guidance')] || '', examples: (row[index('examples')] || '').split('|').join('; ') })).filter(r => r.term.trim() && r.alternatives.trim());
			if (!entries.length) throw new Error('No rows with a term and alternatives were found.');
			if (await postBulkList(entries)) input.value = '';
		} catch (error) { toast.error(error instanceof Error ? error.message : 'Could not import the CSV file.'); }
		finally { busy = false; }
	}
</script>

<div class="flex flex-wrap gap-2">
	<Button variant="outline" class="gap-2" onclick={exportTerms} disabled={busy}><Download class="size-4" />Export CSV</Button>
	<label class="inline-flex h-10 cursor-pointer items-center gap-2 rounded-md border border-input bg-background px-4 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground {busy ? 'pointer-events-none opacity-50' : ''}"><FileUp class="size-4" />Import CSV<input class="sr-only" type="file" accept=".csv,text/csv" onchange={importTerms} disabled={busy} /></label>
</div>

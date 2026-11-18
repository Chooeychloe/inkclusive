<svelte:head>
	<title>Inkclusive guide</title>
	<meta name="description" content="How to use Inkclusive, including writing, scanning, reviewing suggestions, history, and admin term management." />
</svelte:head>

<article class="min-h-0 w-full min-w-0 flex-1 overflow-y-auto bg-background px-5 py-8 text-left text-foreground sm:px-8 lg:px-12">
	<div class="mx-auto w-full max-w-3xl space-y-10 text-left">
		<header class="space-y-3">
			<p class="text-xs font-semibold uppercase tracking-wider text-primary">Help & documentation</p>
			<h1 class="text-3xl font-bold tracking-tight sm:text-4xl">Inkclusive user guide</h1>
			<p class="text-base leading-7 text-muted-foreground">Inkclusive helps you review grammar and language that may benefit from gender-fair alternatives. Suggestions support your judgment; review each one in context.</p>
		</header>

		<section class="space-y-4">
			<h2 class="text-2xl font-semibold">Write and review</h2>
			<ol class="list-decimal space-y-3 pl-6 leading-7 text-muted-foreground">
				<li>Open <a class="font-medium text-primary underline" href="/write">Write</a> to type or paste text. Set a document title and format text with the toolbar.</li>
				<li>Your draft saves automatically in this browser on this device. It is not synced between devices. Keep another copy of important work.</li>
				<li>Open the AI Companion settings to add names and known pronouns when they matter to your document.</li>
				<li>Run the grammar check. Review each suggestion, then apply a replacement or ignore it. Continue to the gender-fair check and review its rationale, examples, and alternatives. You can return to writing for larger edits.</li>
				<li>At the end, review the summary. Use the export controls to download a PDF or DOCX copy if needed. Starting over clears the current editor content.</li>
			</ol>
		</section>

		<section class="space-y-4">
			<h2 class="text-2xl font-semibold">Scan a document</h2>
			<p class="leading-7 text-muted-foreground">Open <a class="font-medium text-primary underline" href="/scan">Scan</a> and drop a PDF, DOCX, JPG, JPEG, or PNG file, or choose it from your device. Inkclusive extracts document text and uses OCR for images. Review the extracted text for missing words or recognition errors before running checks. Use Cancel scan to stop processing or Select Another File to replace the file.</p>
		</section>

		<section class="space-y-4">
			<h2 class="text-2xl font-semibold">History</h2>
			<p class="leading-7 text-muted-foreground">The <a class="font-medium text-primary underline" href="/history">History</a> page shows completed review snapshots saved in this browser’s IndexedDB. Use an entry’s controls to revisit or delete it. Clear All removes all history in this browser. History is not a server backup or a cross-device account.</p>
		</section>

		<section class="space-y-4">
			<h2 class="text-2xl font-semibold">Administrator term library</h2>
			<p class="leading-7 text-muted-foreground">Administrators can open <code class="rounded bg-muted px-1.5 py-0.5 text-sm">/admin</code> and sign in with the backend admin password. The term library provides phrases, suggested alternatives, categories, guidance, and examples used by gender-fair suggestions.</p>
			<ul class="list-disc space-y-2 pl-6 leading-7 text-muted-foreground">
				<li><strong class="text-foreground">Add:</strong> Choose Add term, enter the flagged term and comma-separated alternatives, select a category, and optionally add guidance and semicolon-separated examples. Add entries to a batch, review it, then save.</li>
				<li><strong class="text-foreground">Edit or delete:</strong> Use a row’s actions menu. To remove several entries, select their checkboxes and choose Delete selected. Deletions are permanent.</li>
				<li><strong class="text-foreground">Search and browse:</strong> Search checks terms, alternatives, categories, examples, and guidance. All query words must match. Sort by term and adjust rows per page.</li>
				<li><strong class="text-foreground">Import/export:</strong> Export CSV for backup. Imports require <code>term</code> as the first column and <code>alternatives</code> next; use a vertical bar (<code>|</code>) to separate alternatives and examples. Import adds terms; it does not update existing records, and duplicates can reject a batch.</li>
				<li><strong class="text-foreground">Password and sign-out:</strong> Use the Admin menu to change the password. New passwords require at least 12 characters, and a successful change signs out the current session. Sign out on shared devices.</li>
			</ul>
			<p class="leading-7 text-muted-foreground">Back up <code>gendered_terms.csv</code> and <code>gendered_terms_metadata.json</code> together on the backend. Keep the admin credentials file and token secret private and persistent across deployment changes.</p>
		</section>

		<section class="space-y-4 rounded-xl border border-border bg-muted/30 p-5">
			<h2 class="text-xl font-semibold">Text, privacy, and suggestions</h2>
			<p class="leading-7 text-muted-foreground">Drafts and review history stay in the local browser. When you run grammar or gender-fair analysis, the document text is sent to the configured Inkclusive backend. Grammar analysis uses LanguageTool; gender-fair analysis uses spaCy and configured term rules. Pattern-based suggestions may miss context or flag wording that is appropriate in context, so review before applying.</p>
		</section>
	</div>
</article>

<script lang="ts">
	import { onMount } from 'svelte';

	import { EditorState } from 'prosemirror-state';
	import { EditorView } from 'prosemirror-view';
	import { DOMParser, DOMSerializer } from 'prosemirror-model';
	import { history, closeHistory } from 'prosemirror-history';

	import { textContent, textContentHTML, textTitle } from '$lib/stores/textFromEditorStore';
	import mySchema from '$lib/features/rich-text-editor/entities/Schema';

	import ToolBar from './ToolBar.svelte';
	// import ExportButton from './ExportButton.svelte';
	import createLinterPlugin from '../use-case/LinterPlugin';
	import { extendedKeyMap, myKeymap } from '$lib/features/rich-text-editor/entities/keymaps';
	import { placeholder } from '$lib/features/rich-text-editor/use-case/PlaceHolderPlugin';
	import { keymap } from 'prosemirror-keymap';
	import { baseKeymap } from 'prosemirror-commands';
	import { Transaction } from 'prosemirror-state';
	import { replaceWordInDocument } from '$lib/features/rich-text-editor/use-case/replaceText';
	import { aiSuggestions } from '$lib/stores/lintingStore';
	import { replaceStore } from '$lib/stores/lintingStore';
	import ScrollArea from '$lib/components/ui/scroll-area/scroll-area.svelte';
	import type { TSuggestion } from '$lib/features/suggestion-bot/entities/suggestions';
	import { cn } from '$lib/utils';
	import { progressStore } from '$lib/stores/progressStore';
	import { toast } from 'svelte-sonner';
	import { signalTextEditor } from '$lib/stores/signalStore';
	import { buildInputRules } from '$lib/features/document-scan/use-case/inputRules';
	import { cleanPastePlugin } from '../use-case/cleanPastePlugin';
	import { createDocFromText } from '../use-case/createDocFromText';
	import { driver } from 'driver.js';

	import { tourStore } from '$lib/stores/tourStore';
	import { readLocalDraft, writeLocalDraft } from '../services/localDraft';

	let editorContainer: HTMLDivElement | null = $state(null);
	let view: EditorView | null = $state(null);
	let linterPlugin = createLinterPlugin([]);
	let draftStatus = $state('');
	let draftReady = $state(false);
	let draftTimer: ReturnType<typeof setTimeout> | undefined;

	$effect(() => {
		const draft = { text: $textContent, html: $textContentHTML, title: $textTitle };
		if (!draftReady) return;
		draftStatus = 'Saving draft…';
		if (draftTimer) clearTimeout(draftTimer);
		draftTimer = setTimeout(() => {
			draftStatus = writeLocalDraft(draft) ? 'Draft saved on this device' : 'Draft could not be saved in this browser';
		}, 600);
		return () => { if (draftTimer) clearTimeout(draftTimer); };
	});

	$effect(() => {
		const readOnly = $progressStore > 0;
		if (!view) return;
		view.setProps({ editable: () => !readOnly });
		view.dom.setAttribute('aria-readonly', String(readOnly));
	});

	function resetScroll(event: Event) {
		const target = event.target as HTMLDivElement;
		target.scrollLeft = 0;
	}

	// a shitty solution for a big problem but who cares
	$effect(() => {
		if ($signalTextEditor === true) {
			if (view == null) return;
			reinitializeText(view as EditorView);
			$signalTextEditor = false;
		}
	});

	// when stores has changed, the plugins must be reconfigured
	function reinitializeText(view: EditorView) {
		const doc = createDocFromText($textContent);
		const tr = view.state.tr.replaceWith(0, view.state.doc.content.size, doc.content);
		view.dispatch(tr);
	}

	// when stores has changed, the plugins must be reconfigured
	function reconfigureAllPlugins(): void {
		if (view != null) {
			linterPlugin = createLinterPlugin($aiSuggestions);
			const state = view.state.reconfigure({
				plugins: [
					linterPlugin,
					history(),
					extendedKeyMap,
					keymap(baseKeymap),
					myKeymap,
					placeholder('Type your text here'),
					buildInputRules(mySchema),
					cleanPastePlugin
				]
			});

			view.updateState(state);
		}
	}

	$effect(() => {
		if (aiSuggestions) {
			reconfigureAllPlugins();
		}
	});

	function resetHistory() {
		if (view != null) {
			// Use a transaction to close the current history and start a new one
			const tr = view.state.tr;
			closeHistory(tr); // Ends the current history session
			view.dispatch(tr);
		}
	}

	function replaceWordCommand(words: TSuggestion) {
		return (state: EditorState, dispatch?: (tr: Transaction) => void): boolean => {
			if (!dispatch) return false; // No dispatch means no transaction to apply

			replaceWordInDocument(state, dispatch, words);
			return true; // Return true to indicate that the command executed
		};
	}

	$effect(() => {
		if ($replaceStore.length != 0) {
			$replaceStore.forEach((store) => {
				replaceWordCommand(store)(view!.state, view!.dispatch);
			});

			$replaceStore = [];
			resetHistory();
			reconfigureAllPlugins();
		}
	});

	const driverObj = driver({
		showProgress: true,
		allowClose: false,
		steps: [
			{
				element: '.step-1',
				popover: { title: 'Navigation', description: 'This is where you navigate between pages' }
			},
			{
				element: '.step-2',
				popover: { title: 'Editor', description: 'This is were you write your document!' }
			},
			{
				element: '.step-3',
				popover: {
					title: 'Toolbar',
					description: 'This is the toolbar where you can edit your text with styles!'
				}
			},
			{
				element: '.step-4',
				popover: {
					title: 'Suggestion Tab',
					description: 'This tab contains the AI Suggestions and Preference settings'
				}
			},
			{
				element: '.step-5',
				popover: {
					title: 'Preferred Pronouns',
					description:
						'If you have any people in the document that have preferred pronouns you can add their names here'
				}
			},
			{
				element: '.step-6',
				popover: {
					title: 'Submit',
					description:
						'After writing your document, you can begin scanning for inappropriate use of gender fair langauge'
				}
			},
			{
				element: '.step-7',
				popover: {
					title: 'Added Info',
					description: 'For more information please visit these links!'
				}
			}
		]
	});

	$effect(() => {
		// if localstorage exists then just destroy it
		if (localStorage.getItem('tourScan1')) {
			driverObj.destroy();
			return;
		}
		if ($tourStore) {
			localStorage.setItem('tourScan1', 'Poop');
			driverObj.drive();
		} else {
			driverObj.destroy();
		}
	});

	onMount(() => {
		if (!$textContent.trim()) {
			const draft = readLocalDraft();
			if (draft?.text.trim()) {
				$textContent = draft.text;
				$textContentHTML = draft.html;
				$textTitle = draft.title;
				draftStatus = 'Recovered your last draft from this device';
			}
		}
		draftReady = true;
		const state = EditorState.create({
			schema: mySchema,
			doc: DOMParser.fromSchema(mySchema).parse(
				document.createRange().createContextualFragment($textContentHTML)
			),
			plugins: [
				history(),
				extendedKeyMap,
				keymap(baseKeymap),
				myKeymap,
				placeholder('Type your text here'),
				linterPlugin,
				buildInputRules(mySchema),
				cleanPastePlugin
			]
		});

		view = new EditorView(editorContainer, {
			state,
			attributes: {
				role: 'textbox',
				'aria-label': 'Document editor',
				'aria-multiline': 'true',
				'aria-describedby': 'draft-status',
				'aria-readonly': String($progressStore > 0)
			},
			dispatchTransaction(transaction) {
				const newState = view!.state.apply(transaction);
				view!.updateState(newState);
				view!.dom.dispatchEvent(new Event('inkclusive:selectionchange'));
				$textContent = newState.doc.textContent.toString();
				const fragment = DOMSerializer.fromSchema(mySchema).serializeFragment(newState.doc.content);
				const div = document.createElement('div');
				div.appendChild(fragment);
				$textContentHTML = div.innerHTML;
			}
		});
		reconfigureAllPlugins();

		return () => {
			if (draftTimer) clearTimeout(draftTimer);
			writeLocalDraft({ text: $textContent, html: $textContentHTML, title: $textTitle });
			view?.destroy();
		};
	});
</script>

<section class="flex min-h-0 flex-1 flex-col items-center bg-card xl:h-full">
	<!-- Custom toolbar with Chadcn Svelte buttons -->
	<div
		class="step-3 flex min-h-14 w-full shrink-0 flex-wrap items-center gap-x-2 gap-y-1 border-b border-border bg-card px-3 py-2 sm:px-4 lg:flex-nowrap"
	>
		<label class="sr-only" for="document-title">Document title</label>
		<input
			id="document-title"
			type="text"
			class="order-1 w-28 min-w-0 shrink-0 text-ellipsis whitespace-nowrap bg-card px-1 text-base font-semibold focus:outline-none sm:w-40 sm:text-lg"
			bind:value={$textTitle}
			aria-label="Document title"
			onblur={resetScroll}
		/>
		<div class="order-2 ml-auto shrink-0 pl-1 lg:order-3 lg:ml-0">
			<p class="whitespace-nowrap text-xs text-muted-foreground lg:text-sm" aria-label="Word count">
				Count: {$textContent == '' ? 0 : $textContent.trim().split(/\s+/).length}
			</p>
		</div>
		<p id="draft-status" class="order-4 basis-full text-xs text-muted-foreground lg:order-4 lg:basis-auto" role="status" aria-live="polite">
			{draftStatus || 'Drafts are stored only on this device.'}
		</p>
		{#if view !== null}
			<div class="order-3 basis-full lg:order-2 lg:basis-auto lg:flex-1">
				<fieldset disabled={$progressStore > 0} class="min-w-0 border-0 p-0">
					<ToolBar {view} {mySchema}></ToolBar>
				</fieldset>
			</div>
		{/if}
	</div>

	<!-- ProseMirror editor container -->

	<ScrollArea
		class="step-2 min-h-0 w-full flex-1 shadow-inner focus-within:ring-2 focus-within:ring-inset focus-within:ring-primary"
		onclick={() => {
			if ($progressStore > 0) {
				toast.info('You can only edit text during the Write Step');
			}
		}}
	>
		<div class="flex h-full w-full items-start justify-center">
			<div
				bind:this={editorContainer}
				class={cn(
					'editor__paragraph prose prose-sm w-full flex-1 text-foreground focus:outline-none lg:prose-base xl:prose-lg',
					$progressStore > 0 && 'pointer-events-none'
				)}
				id="editor"
			></div>
		</div>
	</ScrollArea>
</section>

<style>
	#editor {
		padding: 1.25rem 1rem;
		width: 100%;
		max-width: 900px;
		/*background: antiquewhite;*/
	}
</style>

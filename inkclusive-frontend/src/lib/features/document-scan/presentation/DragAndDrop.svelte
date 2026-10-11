<script lang="ts">
	import { CloudUpload, FolderOpen, LoaderCircle } from '@lucide/svelte';
	import { Button } from '$lib/components/ui/button';
	import { dragOverHandler } from '../use-case/dragAndDropEvents';
	import { getSuffix } from '$lib/features/document-scan/use-case/utilts';
	import { signalTextEditor } from '$lib/stores/signalStore';
	import {
		convertDragToFile,
		convertInputToFile
	} from '$lib/features/document-scan/use-case/extractDocument';
	import ProseMirrorDocu from '$lib/features/document-scan/presentation/ProseMirrorDocu.svelte';

	import { textContent, textContentHTML, textTitle } from '$lib/stores/textFromEditorStore';
	import { getTextFromPDF } from '$lib/features/document-scan/use-case/extractPDF';
	import { ocrToText } from '$lib/features/document-scan/use-case/imgToText';
	import { aiSuggestions, replaceStore } from '$lib/stores/lintingStore';
	import { GLFScore } from '$lib/stores/omegaLOL';
	import { progressStore } from '$lib/stores/progressStore';
	import { driver } from 'driver.js';
	import { onMount } from 'svelte';
	import 'driver.js/dist/driver.css';

	let {
		setFileNameDisplay,
		fileDocument,
		signal = false,
		changeState,
		cancelScan
	}: {
		setFileNameDisplay: (
			name: string,
			type: 'jpg' | 'jpeg' | 'png' | 'docx' | 'pdf' | undefined
		) => void;
		fileDocument: File | null;
		signal: boolean;
		changeState: (e: boolean) => void;
		cancelScan: () => void;
	} = $props();

	let isLoading = $state(false);
	let scanError = $state('');
	let scanStatus = $state('');
	let scanRequest = 0;
	let scanController: AbortController | null = null;

	$effect(() => {
		if (signal == true) {
			setFileNameDisplay(fileName, fileSuffix);
			convertToText(fileDocument as File, fileSuffix);
			signal = false;
			changeState(false);
		}
	});

	let fileSuffix: 'jpg' | 'jpeg' | 'png' | 'docx' | 'pdf' | undefined = $derived.by(() => {
		if (fileDocument) {
			let doc = fileDocument as File;
			return getSuffix(doc.name);
		} else {
			return undefined;
		}
	});

	let fileName = $derived.by(() => {
		if (fileDocument) {
			let doc = fileDocument as File;
			return doc.name;
		} else {
			return '';
		}
	});
	// todo: add store to this stupid shit v
	let extractedText = $state(false);

	async function convertToText(file: File, type: string | undefined) {
		if (!file) { scanError = 'Choose a file before starting a scan.'; return; }
		const requestId = ++scanRequest;
		scanController?.abort();
		scanController = new AbortController();
		const { signal: abortSignal } = scanController;
		scanError = '';
		scanStatus = type === 'pdf' ? 'Reading text from the PDF…' : type === 'docx' ? 'Reading the Word document…' : 'Recognizing text in the image…';

		const formData = new FormData();
		formData.append('file', file as File);
		isLoading = true;
		try {
			let text = '';
			switch (type) {
				case 'docx': {
					const response = await fetch('/api/extract/docx', { method: 'POST', body: formData, signal: abortSignal });
					const result = await response.json();
					if (!response.ok) throw new Error(result.error || 'The Word document could not be read.');
					text = typeof result.data === 'string' ? result.data : '';
					break;
				}
				case 'pdf': text = await getTextFromPDF(file, abortSignal); break;
				case 'png':
				case 'jpeg':
				case 'jpg': text = await ocrToText(file, 'eng', abortSignal); break;
				default: throw new Error('This file type is not supported. Choose a PDF, DOCX, JPG, or PNG file.');
			}
			if (requestId !== scanRequest || abortSignal.aborted) return;
			if (!text.trim()) throw new Error('No readable text was found. Try a clearer image or a document with selectable text.');
			extractedText = true;
			$textContent = text;
			$signalTextEditor = true;
			scanStatus = 'Text extracted. Review it in the editor before checking suggestions.';
		} catch (error) {
			if (requestId !== scanRequest || abortSignal.aborted) return;
			scanError = error instanceof Error ? error.message : 'The file could not be scanned. Try another file.';
			scanStatus = '';
		} finally {
			if (requestId === scanRequest) isLoading = false;
		}
	}

	function stopScan() {
		scanRequest += 1;
		scanController?.abort();
		scanController = null;
		isLoading = false;
		scanStatus = '';
		scanError = '';
		extractedText = false;
		cancelScan();
	}

	const driverObj = driver({
		popoverClass: 'driverjs-theme',
		stagePadding: 4
	});

	onMount(() => {
		if (localStorage.getItem('tourScan')) {
			driverObj.destroy();
			return;
		} else if (!localStorage.getItem('tourScan')) {
			localStorage.setItem('tourScan', 'Poop');
			driverObj.highlight({
				element: '#File_Label',
				popover: {
					side: 'bottom',
					title: 'Click "Select File" to scan your document'
				}
			});
		}
	});
</script>

<div class="flex min-h-0 w-full min-w-0 flex-1 flex-col items-center justify-center gap-4 overflow-hidden p-4 lg:items-center">
	{#if scanError}<p class="w-full max-w-xl rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive" role="alert">{scanError}</p>{/if}
	{#if scanStatus && !isLoading}<p class="w-full max-w-xl text-sm text-muted-foreground" role="status" aria-live="polite">{scanStatus}</p>{/if}
	{#if isLoading}
		<section class="flex w-full max-w-md flex-col items-center gap-4 rounded-2xl border border-border bg-card p-6 text-center shadow-sm" aria-labelledby="scan-progress-heading">
			<LoaderCircle class="size-10 animate-spin text-primary" aria-hidden="true" />
			<div><h3 id="scan-progress-heading" class="font-semibold">Scanning {fileName || 'your file'}</h3><p class="mt-1 text-sm text-muted-foreground" role="status" aria-live="polite">{scanStatus} Large documents can take a little longer.</p></div>
			<Button type="button" variant="outline" onclick={stopScan}>Cancel scan</Button>
		</section>
	{:else if extractedText === false}
		<form
			class=" flex h-[350px] w-[min(100%,450px)] flex-col items-center justify-center
		gap-5 rounded-sm border-2 border-dashed border-border
		bg-card p-5 lg:h-[450px] lg:w-[450px]"
			ondrop={async (e) => {
				e.preventDefault();
				$textContent = '';
				$textContentHTML = '';
				$textTitle = 'Untitled_1';
				$progressStore = 0;
				$GLFScore = 0;
				$aiSuggestions = [];
				$replaceStore = [];

				try {
					fileDocument = convertDragToFile(e);
					setFileNameDisplay(fileName, fileSuffix);
					await convertToText(fileDocument, fileSuffix);
				} catch (error) {
					scanError = error instanceof Error ? error.message : 'Choose a supported file to scan.';
				}
			}}
			ondragover={(e) => dragOverHandler(e)}
		>
			<FolderOpen class="h-24 w-24 text-primary lg:h-[150px] lg:w-[150px]"></FolderOpen>
			<h3 class="text-center text-lg text-primary">Drag your PDF/DOCX/JPG File Here <br /> OR</h3>
			<label
					class="inline-flex items-center justify-center gap-2 rounded-full border border-primary bg-primary px-5 py-2 text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring active:scale-[0.98]"
				id="File_Label"
			>
				<CloudUpload class="h-8 w-8"></CloudUpload>
				<span
					class="text-center text-lg font-semibold"
					>Select file
				</span>
				<input
					onchange={async (e) => {
						$textContent = '';
						$textContentHTML = '';
						$textTitle = 'Untitled_1';
						$progressStore = 0;
						$GLFScore = 0;
						$aiSuggestions = [];
						$replaceStore = [];
						fileDocument = convertInputToFile(e);
						setFileNameDisplay(fileName, fileSuffix);
						await convertToText(fileDocument, fileSuffix);
					}}
					id="File_Drop"
					accept=".pdf,.docx,.png,.jpeg,.jpg"
					type="file"
					class="sr-only"
					aria-label="Choose a PDF, Word document, or image to scan"
				/>
			</label>
		</form>
	{:else}
		<ProseMirrorDocu></ProseMirrorDocu>
	{/if}
</div>

<style>
</style>

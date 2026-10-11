<script lang="ts">
	import DragAndDrop from './DragAndDrop.svelte';
	import type { IFileNameDisplay } from '$lib/features/document-scan/entities/FileType';
	import FileNameDisplay from '$lib/features/document-scan/presentation/FileNameDisplay.svelte';
	import { convertInputToFile } from '../use-case/extractDocument';
	import { textContent, textContentHTML, textTitle } from '$lib/stores/textFromEditorStore';
	import { aiSuggestions, replaceStore } from '$lib/stores/lintingStore';
	import { GLFScore } from '$lib/stores/omegaLOL';
	import { progressStore } from '$lib/stores/progressStore';
	import { ignoreGrammarStore } from '$lib/stores/ignoreStore';
	let fileNameDisplay: IFileNameDisplay = $state({
		fileName: undefined,
		fileType: undefined
	});
	let fileDocument = $state<File | null>(null);
	let signal = $state<boolean>(false);

	function changeState(e: boolean) {
		$ignoreGrammarStore = [];
		signal = e;
	}
	function cancelScan() {
		fileDocument = null;
		fileNameDisplay = { fileName: undefined, fileType: undefined };
		$textContent = '';
		$textContentHTML = '';
		$textTitle = 'Untitled_1';
	}
	function setFileNameDisplay(
		name: string,
		type: 'jpg' | 'jpeg' | 'png' | 'docx' | 'pdf' | undefined
	): void {
		fileNameDisplay.fileName = name.replace(/\.[^/.]+$/, '');
		$textTitle = name.replace(/\.[^/.]+$/, '');
		fileNameDisplay.fileType = type;
	}
</script>

<div class="flex h-full min-h-0 w-full min-w-0 flex-1 flex-col items-center overflow-hidden bg-muted">
	{#if fileNameDisplay.fileType}
		<div class="flex h-14 w-full items-center justify-between border-b border-border bg-card p-2">
			<FileNameDisplay {...fileNameDisplay} />
			<div>
				<label
					class="inline-flex items-center justify-center gap-2 rounded-full border border-primary bg-primary px-3 py-1 text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 focus-within:outline-none focus-within:ring-2 focus-within:ring-ring"
					id="FileLabel"
				>
					<span class="text-center text-sm font-semibold lg:text-base">Select Another File</span>
					<input
						onchange={(e) => {
							$textContent = '';
							$textContentHTML = '';
							$textTitle = 'Untitled_1';
							$progressStore = 0;
							$GLFScore = 0;
							$aiSuggestions = [];
							$replaceStore = [];
							$ignoreGrammarStore = [];
							fileDocument = convertInputToFile(e);
							signal = true;
						}}
						id="File_Drop2"
						accept=".pdf,.docx,.png,.jpeg,.jpg"
						type="file"
						class="sr-only"
						aria-label="Select another PDF, Word document, or image"
					/>
				</label>
			</div>
		</div>
	{/if}
	<DragAndDrop {setFileNameDisplay} {fileDocument} {changeState} {cancelScan} {signal}></DragAndDrop>
</div>

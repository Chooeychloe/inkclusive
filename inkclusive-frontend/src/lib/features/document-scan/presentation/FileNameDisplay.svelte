<script lang="ts">
	import type { IFileNameDisplay } from '$lib/features/document-scan/entities/FileType';
	import { FileImage, FileText, FileType } from '@lucide/svelte';
	let { fileType, fileName }: IFileNameDisplay = $props();
</script>

{#if fileType !== undefined}
	<div class="flex items-center justify-center gap-2">
		<!-- change icon based on file type-->
		{#if fileType === 'jpeg' || fileType === 'png' || fileType === 'jpg'}
			<span
				class="flex items-center justify-center rounded-[9px] border border-solid border-primary/30 bg-primary/5 p-[1px]"
			>
				<FileImage class="size-7 rounded-[8px] bg-primary p-1 text-primary-foreground" aria-hidden="true" />
			</span>
		{:else if fileType === 'docx'}
			<span
				class="flex items-center justify-center rounded-[9px] border border-solid border-primary/30 bg-primary/5 p-[1px]"
			>
				<FileType class="size-7 rounded-[8px] bg-primary p-1 text-primary-foreground" aria-hidden="true" />
			</span>
		{:else if fileType === 'pdf'}
			<span
				class="flex items-center justify-center rounded-[9px] border border-solid border-primary/30 bg-primary/5 p-[1px]"
			>
				<FileText class="size-7 rounded-[8px] bg-primary p-1 text-primary-foreground" aria-hidden="true" />
			</span>
		{/if}

		<p
			class="max-w-[45vw] overflow-hidden overflow-ellipsis whitespace-nowrap text-base font-bold xl:max-w-none"
			aria-label="Selected file"
			title={fileName}
		>
			{fileName}
		</p>
	</div>
{/if}

<script lang="ts">
	import Button from '../../../../components/ui/button/button.svelte';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu';

	import { exportStateAsPDF } from '$lib/features/rich-text-editor/use-case/exportPDF.js';
	import { textContentHTML, textTitle } from '$lib/stores/textFromEditorStore';
	import { buttonVariants } from '$lib/components/ui/button/index.js';
	import { cn } from '$lib/utils';
	import { toast } from 'svelte-sonner';
	import { Download } from '@lucide/svelte';

	async function downloadDocx() {
		// html-to-docx does not understand newer CSS color syntaxes such as oklch().
		// Resolve inline editor colors through the browser before sending the HTML.
		const doc = document.createElement('div');
		doc.innerHTML = $textContentHTML;
		const canvas = document.createElement('canvas');
		canvas.width = 1;
		canvas.height = 1;
		const context = canvas.getContext('2d', { willReadFrequently: true });
		doc.querySelectorAll<HTMLElement>('[style]').forEach((element) => {
			if (element.style.color) {
				const resolvedColor = getComputedStyle(element).color;
				if (resolvedColor && context) {
					context.clearRect(0, 0, 1, 1);
					context.fillStyle = resolvedColor;
					context.fillRect(0, 0, 1, 1);
					const [red, green, blue] = context.getImageData(0, 0, 1, 1).data;
					element.style.color = `#${[red, green, blue]
						.map((channel) => channel.toString(16).padStart(2, '0'))
						.join('')}`;
				}
			}
		});

		const response = await fetch('/api/docx', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ htmlContent: doc.innerHTML })
		});

		if (response.ok) {
			const blob = await response.blob();
			const url = URL.createObjectURL(blob);
			const link = document.createElement('a');
			link.href = url;
			link.download = `${$textTitle}.docx`;
			link.click();
			URL.revokeObjectURL(url);
		} else {
			toast.error('Failed to Export Docx');
			console.error('Failed to generate docx');
		}
	}
</script>

<DropdownMenu.Root>
	<DropdownMenu.Trigger
		class={cn(
			buttonVariants({ variant: 'outline' }),
			'my-2 flex w-full items-center justify-between border border-primary bg-primary p-6 text-base font-bold text-primary-foreground hover:bg-primary/90'
		)}
	>
		<p>Export As</p>

		<Download class="size-5" aria-hidden="true" />
	</DropdownMenu.Trigger>
	<DropdownMenu.Content>
		<DropdownMenu.Group class="w-[250px]">
			<DropdownMenu.Item
				class="w-full"
				onclick={() => {
					downloadDocx();
				}}><p class="font-semibold">DOCX</p></DropdownMenu.Item
			>
			<DropdownMenu.Item
				class="w-full"
				onclick={() => {
					console.log($textContentHTML);

					exportStateAsPDF($textContentHTML);
				}}
				><p class="w-full font-semibold">PDF</p>
			</DropdownMenu.Item>
		</DropdownMenu.Group>
	</DropdownMenu.Content>
</DropdownMenu.Root>

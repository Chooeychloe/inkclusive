<script lang="ts">
	import Button from '$lib/components/ui/button/button.svelte';
	import { setBlockType, toggleMark } from 'prosemirror-commands';
	import type { Schema } from 'prosemirror-model';
	import type { EditorView } from 'prosemirror-view';
	import { undo, redo } from 'prosemirror-history';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu/index.js';
	import { wrapInList } from 'prosemirror-schema-list';
	import { MarkType } from 'prosemirror-model';

	import {
		AlignCenter,
		AlignJustify,
		AlignLeft,
		AlignRight,
		Bold,
		ChevronDown,
		Italic,
		List,
		Pilcrow,
		Redo2,
		Underline,
		Undo2
	} from '@lucide/svelte';

	let { view, mySchema }: { view: EditorView; mySchema: Schema } = $props();
	function getDefaultFontFamily() {
		if (typeof document === 'undefined') return 'sans-serif';
		return getComputedStyle(document.body).fontFamily.split(',')[0].replace(/["']/g, '').trim();
	}
	let currentFontSize = $state('16px'); // Default font size
	let currentFontFamily = $state(getDefaultFontFamily());
	let currentColor = $state('black');
	let currentTextStyle = $state('Normal');
	let activeTab = $state<'Home' | 'Paragraph'>('Home');
	let activeMarks = $state({ bold: false, italic: false, underline: false });
	let activeAlignment = $state('left');
	let currentBulletStyle = $state('disc');
	let inBulletList = $state(false);
	function setFontSize(size: string) {
		if (!view) return;

		const { state, dispatch } = view;
		const { from, to } = state.selection;

		state.doc.nodesBetween(from, to, (node, pos) => {
			if (node.type === mySchema.nodes.paragraph || node.type === mySchema.nodes.heading) {
				const attrs = { ...node.attrs, fontSize: size };
				setBlockType(node.type, attrs)(state, dispatch);
			}
		});
	}

	function setFontFamily(fontFamily: string) {
		if (!view) return;

		const { state, dispatch } = view;
		const { from, to } = state.selection;

		state.doc.nodesBetween(from, to, (node, pos) => {
			if (node.type === mySchema.nodes.paragraph || node.type === mySchema.nodes.heading) {
				const attrs = { ...node.attrs, fontFamily: fontFamily };
				setBlockType(node.type, attrs)(state, dispatch);
			}
		});

		currentFontFamily = fontFamily; // Update the current font family
	}

	function applyTextColor(view: EditorView, markType: MarkType, color: string) {
		const { state, dispatch } = view;
		const { from, to, empty } = state.selection;

		const tr = state.tr;

		if (empty) {
			// Remove old color marks
			state.storedMarks?.forEach((mark) => {
				if (mark.type === markType) {
					tr.removeStoredMark(markType);
				}
			});
			// Add new color mark
			tr.addStoredMark(markType.create({ color }));
			dispatch(tr);
			return true;
		}

		// Remove all color marks in selection
		tr.removeMark(from, to, markType);
		// Apply the new one
		tr.addMark(from, to, markType.create({ color }));

		dispatch(tr);
		return true;
	}

	function setColor(color: string) {
		if (!view) return;
		const colorMark = mySchema.marks.color;
		applyTextColor(view, colorMark, color);
		currentColor = color;
	}

	// Function to update the current font size based on the selection
	function updateCurrentFontSize() {
		if (!view) return;

		const { state } = view;
		const { $from: selectionFrom, from, to, empty } = state.selection;
		const node = selectionFrom.node(selectionFrom.depth);

		if (node.type === mySchema.nodes.paragraph || node.type === mySchema.nodes.heading) {
			currentFontSize = node.attrs.fontSize || '16px';
			currentFontFamily = node.attrs.fontFamily || getDefaultFontFamily();
			activeAlignment = node.attrs.align || 'left';
			currentTextStyle = node.type === mySchema.nodes.heading ? `Heading ${node.attrs.level}` : 'Normal';
		}

		const activeMarksAtCursor = state.storedMarks ?? selectionFrom.marks();
		activeMarks = {
			bold: empty
				? mySchema.marks.bold.isInSet(activeMarksAtCursor) !== undefined
				: state.doc.rangeHasMark(from, to, mySchema.marks.bold),
			italic: empty
				? mySchema.marks.italic.isInSet(activeMarksAtCursor) !== undefined
				: state.doc.rangeHasMark(from, to, mySchema.marks.italic),
		underline: empty
				? mySchema.marks.underline.isInSet(activeMarksAtCursor) !== undefined
				: state.doc.rangeHasMark(from, to, mySchema.marks.underline)
		};
		const colorMark =
			state.storedMarks?.find((mark) => mark.type === mySchema.marks.color) ??
			selectionFrom.marks().find((mark) => mark.type === mySchema.marks.color);
		currentColor = colorMark?.attrs.color ?? 'black';

		inBulletList = false;
		for (let depth = selectionFrom.depth; depth > 0; depth -= 1) {
			const ancestor = selectionFrom.node(depth);
			if (ancestor.type === mySchema.nodes.bullet_list) {
				inBulletList = true;
				currentBulletStyle = ancestor.attrs.listStyle || 'disc';
				break;
			}
		}
	}

	$effect(() => {
		const editorView = view;
		if (!editorView) return;
		updateCurrentFontSize();
		const update = () => updateCurrentFontSize();
		editorView.dom.addEventListener('mouseup', update);
		editorView.dom.addEventListener('keyup', update);
		editorView.dom.addEventListener('inkclusive:selectionchange', update);
		return () => {
			editorView.dom.removeEventListener('mouseup', update);
			editorView.dom.removeEventListener('keyup', update);
			editorView.dom.removeEventListener('inkclusive:selectionchange', update);
		};
	});

	function toggleHeading(level: number) {
		if (!view) return;
		const { state, dispatch } = view;
		setBlockType(mySchema.nodes.heading, { level })(state, dispatch);
	}

	function toggleParagraph() {
		if (!view) return;
		const { state, dispatch } = view;
		setBlockType(mySchema.nodes.paragraph)(state, dispatch);
	}

	// Toggle bold formatting
	function toggleBold() {
		if (!view) return;
		const { state, dispatch } = view;
		const { schema } = state;
		toggleMark(schema.marks.bold)(state, dispatch);
	}

	// Toggle italic formatting
	function toggleItalic() {
		if (!view) return;
		const { state, dispatch } = view;
		const { schema } = state;
		toggleMark(schema.marks.italic)(state, dispatch);
	}

	function toggleUnderline() {
		if (!view) return;
		const { state, dispatch } = view;
		const { schema } = state;
		toggleMark(schema.marks.underline)(state, dispatch);
	}

	function setTextAlign(align: string) {
		if (!view) return;
		const { state, dispatch } = view;
		const { $from: selectionFrom } = state.selection;
		const node = selectionFrom.node(selectionFrom.depth);

		if (node.type === mySchema.nodes.paragraph || node.type === mySchema.nodes.heading) {
			const attrs = { ...node.attrs, align };
			setBlockType(node.type, attrs)(state, dispatch);
		}
	}
	function toggleBulletList() {
		if (!view) return false;
		return wrapInList(mySchema.nodes.bullet_list, { listStyle: currentBulletStyle })(
			view.state,
			view.dispatch,
			view
		);
	}

	function setBulletStyle(style: string) {
		if (!view) return;
		currentBulletStyle = style;
		const { state, dispatch } = view;
		for (let depth = state.selection.$from.depth; depth > 0; depth -= 1) {
			const node = state.selection.$from.node(depth);
			if (node.type === mySchema.nodes.bullet_list) {
				const position = state.selection.$from.before(depth);
				dispatch(state.tr.setNodeMarkup(position, undefined, { ...node.attrs, listStyle: style }));
				return;
			}
		}
		wrapInList(mySchema.nodes.bullet_list, { listStyle: style })(state, dispatch, view);
	}

	function canApplyBulletList() {
		if (!view) return false;
		return wrapInList(mySchema.nodes.bullet_list)(view.state);
	}
</script>

<div class="w-full border-b border-border bg-card">
	<div class="flex items-center justify-between border-b border-border/70 bg-background/60 px-2">
		<div class="flex items-center gap-1" role="group" aria-label="Editor ribbon tabs">
			<button
				type="button"
				aria-pressed={activeTab === 'Home'}
				class="border-b-2 px-3 py-2 text-sm font-medium transition-colors {activeTab === 'Home'
					? 'border-primary text-primary'
					: 'border-transparent text-muted-foreground hover:text-foreground'}"
				onclick={() => (activeTab = 'Home')}>Home</button
			>
			<button
				type="button"
				aria-pressed={activeTab === 'Paragraph'}
				class="border-b-2 px-3 py-2 text-sm font-medium transition-colors {activeTab === 'Paragraph'
					? 'border-primary text-primary'
					: 'border-transparent text-muted-foreground hover:text-foreground'}"
				onclick={() => (activeTab = 'Paragraph')}>Paragraph</button
			>
		</div>
		<div class="flex items-center border-l border-border pl-1">
			<Button size="icon" class="h-8 w-8" variant="ghost" aria-label="Undo" title="Undo" onclick={() => undo(view.state, view.dispatch)}><Undo2 /></Button>
			<Button size="icon" class="h-8 w-8" variant="ghost" aria-label="Redo" title="Redo" onclick={() => redo(view.state, view.dispatch)}><Redo2 /></Button>
		</div>
	</div>

	{#if activeTab === 'Home'}
		<div class="flex min-h-[88px] flex-wrap items-stretch gap-x-1 px-2 py-2" role="group" aria-label="Home formatting tools">
			<div class="flex min-w-0 flex-col justify-between border-r border-border px-2 pb-1 pr-3">
				<div class="flex flex-wrap items-center gap-1">
					<DropdownMenu.Root>
						<DropdownMenu.Trigger><Button variant="secondary" class="h-8 rounded-md px-2">{currentTextStyle}<ChevronDown /></Button></DropdownMenu.Trigger>
						<DropdownMenu.Content>
							<DropdownMenu.Group>
								<DropdownMenu.Label>Text style</DropdownMenu.Label><DropdownMenu.Separator />
								<DropdownMenu.Item onclick={() => toggleParagraph()}>Normal paragraph</DropdownMenu.Item>
								<DropdownMenu.Item onclick={() => toggleHeading(1)}>Heading 1</DropdownMenu.Item>
								<DropdownMenu.Item onclick={() => toggleHeading(2)}>Heading 2</DropdownMenu.Item>
								<DropdownMenu.Item onclick={() => toggleHeading(3)}>Heading 3</DropdownMenu.Item>
							</DropdownMenu.Group>
						</DropdownMenu.Content>
					</DropdownMenu.Root>
					<DropdownMenu.Root>
						<DropdownMenu.Trigger><Button variant="secondary" class="h-8 w-[88px] px-2 text-xs">{currentFontSize}<ChevronDown /></Button></DropdownMenu.Trigger>
						<DropdownMenu.Content>
							<DropdownMenu.Group><DropdownMenu.Label>Font size</DropdownMenu.Label><DropdownMenu.Separator />
								{#each ['8pt', '10pt', '12pt', '14pt', '16pt', '18pt', '20pt', '24pt', '28pt', '32pt', '36pt'] as size}
									<DropdownMenu.Item onclick={() => setFontSize(size)}>{size}</DropdownMenu.Item>
								{/each}
							</DropdownMenu.Group>
						</DropdownMenu.Content>
					</DropdownMenu.Root>
					<DropdownMenu.Root>
						<DropdownMenu.Trigger><Button variant="secondary" class="h-8 w-[100px] justify-between px-2 text-xs"><span class="truncate">{currentFontFamily}</span><ChevronDown /></Button></DropdownMenu.Trigger>
						<DropdownMenu.Content>
							<DropdownMenu.Group><DropdownMenu.Label>Font family</DropdownMenu.Label><DropdownMenu.Separator />
								{#each ['Open Sans', 'Arial', 'Helvetica', 'Verdana', 'Tahoma', 'Trebuchet MS', 'Times New Roman', 'Times', 'Georgia', 'Courier New', 'Courier', 'Consolas', 'Monaco'] as fontFamily}
									<DropdownMenu.Item onclick={() => setFontFamily(fontFamily)}>{fontFamily}</DropdownMenu.Item>
								{/each}
							</DropdownMenu.Group>
						</DropdownMenu.Content>
					</DropdownMenu.Root>
				</div>
				<div class="flex items-center gap-1">
					<Button size="icon" class="h-8 w-8 font-bold" variant={activeMarks.bold ? 'secondary' : 'ghost'} aria-pressed={activeMarks.bold} aria-label="Bold" title="Bold" onclick={toggleBold}><Bold /></Button>
					<Button size="icon" class="h-8 w-8 italic" variant={activeMarks.italic ? 'secondary' : 'ghost'} aria-pressed={activeMarks.italic} aria-label="Italic" title="Italic" onclick={toggleItalic}><Italic /></Button>
					<Button size="icon" class="h-8 w-8 underline" variant={activeMarks.underline ? 'secondary' : 'ghost'} aria-pressed={activeMarks.underline} aria-label="Underline" title="Underline" onclick={toggleUnderline}><Underline /></Button>
					<DropdownMenu.Root>
						<DropdownMenu.Trigger><Button variant="ghost" class="h-8 gap-1 px-2 text-xs" style={`color:${currentColor}`} aria-label="Text color" title="Text color"><span class="h-4 w-4 rounded border border-border" style={`background-color:${currentColor}`}></span><span class="hidden sm:inline">Text color</span><ChevronDown /></Button></DropdownMenu.Trigger>
						<DropdownMenu.Content><DropdownMenu.Group><DropdownMenu.Label>Text color</DropdownMenu.Label><DropdownMenu.Separator />
							<DropdownMenu.Item onclick={() => setColor('black')}>Black</DropdownMenu.Item>
							<DropdownMenu.Item onclick={() => setColor('oklch(57.7% 0.245 27.325)')}>Red</DropdownMenu.Item>
							<DropdownMenu.Item onclick={() => setColor('oklch(64.6% 0.222 41.116)')}>Orange</DropdownMenu.Item>
							<DropdownMenu.Item onclick={() => setColor('oklch(79.5% 0.184 86.047)')}>Yellow</DropdownMenu.Item>
							<DropdownMenu.Item onclick={() => setColor('oklch(52.7% 0.154 150.069)')}>Green</DropdownMenu.Item>
							<DropdownMenu.Item onclick={() => setColor('oklch(54.6% 0.245 262.881)')}>Blue</DropdownMenu.Item>
							<DropdownMenu.Item onclick={() => setColor('oklch(54.1% 0.281 293.009)')}>Violet</DropdownMenu.Item>
						</DropdownMenu.Group></DropdownMenu.Content>
					</DropdownMenu.Root>
				</div>
				<span class="mt-1 text-center text-[10px] text-muted-foreground">Font</span>
			</div>
		</div>
	{:else}
		<div class="flex min-h-[88px] flex-wrap items-stretch gap-x-1 px-2 py-2" role="group" aria-label="Paragraph formatting tools">
			<div class="flex flex-col justify-between border-r border-border px-3 pb-1">
				<div class="flex items-center gap-1">
					<Button size="icon" class="h-8 w-8" variant={activeAlignment === 'left' ? 'secondary' : 'ghost'} aria-pressed={activeAlignment === 'left'} aria-label="Align left" title="Align left" onclick={() => setTextAlign('left')}><AlignLeft /></Button>
					<Button size="icon" class="h-8 w-8" variant={activeAlignment === 'center' ? 'secondary' : 'ghost'} aria-pressed={activeAlignment === 'center'} aria-label="Align center" title="Align center" onclick={() => setTextAlign('center')}><AlignCenter /></Button>
					<Button size="icon" class="h-8 w-8" variant={activeAlignment === 'right' ? 'secondary' : 'ghost'} aria-pressed={activeAlignment === 'right'} aria-label="Align right" title="Align right" onclick={() => setTextAlign('right')}><AlignRight /></Button>
					<Button size="icon" class="h-8 w-8" variant={activeAlignment === 'justify' ? 'secondary' : 'ghost'} aria-pressed={activeAlignment === 'justify'} aria-label="Justify" title="Justify" onclick={() => setTextAlign('justify')}><AlignJustify /></Button>
				</div>
				<span class="mt-1 text-center text-[10px] text-muted-foreground">Alignment</span>
			</div>
			<div class="flex flex-col justify-between px-3 pb-1">
				<div class="flex items-center gap-1">
					<Button size="icon" class="h-8 w-8" variant={inBulletList ? 'secondary' : 'ghost'} aria-pressed={inBulletList} aria-label="Bulleted list" title="Bulleted list" disabled={!inBulletList && !canApplyBulletList()} onclick={toggleBulletList}><List /></Button>
					<DropdownMenu.Root>
						<DropdownMenu.Trigger><Button variant="outline" class="h-8 gap-1 px-2 text-xs" aria-label="Bullet style" title="Bullet style"><span class="text-base leading-none">{currentBulletStyle === 'disc' ? '•' : currentBulletStyle === 'circle' ? '○' : '▪'}</span><ChevronDown /></Button></DropdownMenu.Trigger>
						<DropdownMenu.Content><DropdownMenu.Group><DropdownMenu.Label>Bullet style</DropdownMenu.Label><DropdownMenu.Separator />
							<DropdownMenu.Item onclick={() => setBulletStyle('disc')}>• Disc</DropdownMenu.Item>
							<DropdownMenu.Item onclick={() => setBulletStyle('circle')}>○ Circle</DropdownMenu.Item>
							<DropdownMenu.Item onclick={() => setBulletStyle('square')}>▪ Square</DropdownMenu.Item>
						</DropdownMenu.Group></DropdownMenu.Content>
					</DropdownMenu.Root>
					<Button size="icon" class="h-8 w-8" variant="ghost" aria-label="Paragraph" title="Paragraph" onclick={toggleParagraph}><Pilcrow /></Button>
					<DropdownMenu.Root>
						<DropdownMenu.Trigger><Button variant="secondary" class="h-8 px-2">Heading style <ChevronDown /></Button></DropdownMenu.Trigger>
						<DropdownMenu.Content><DropdownMenu.Group><DropdownMenu.Label>Text style</DropdownMenu.Label><DropdownMenu.Separator />
							<DropdownMenu.Item onclick={() => toggleParagraph()}>Normal paragraph</DropdownMenu.Item>
							<DropdownMenu.Item onclick={() => toggleHeading(1)}>Heading 1</DropdownMenu.Item>
							<DropdownMenu.Item onclick={() => toggleHeading(2)}>Heading 2</DropdownMenu.Item>
							<DropdownMenu.Item onclick={() => toggleHeading(3)}>Heading 3</DropdownMenu.Item>
						</DropdownMenu.Group></DropdownMenu.Content>
					</DropdownMenu.Root>
				</div>
				<span class="mt-1 text-center text-[10px] text-muted-foreground">Lists and styles</span>
			</div>
		</div>
	{/if}
</div>

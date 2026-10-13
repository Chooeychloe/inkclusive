import jsPDF from 'jspdf';
import { get } from 'svelte/store';
import { textTitle } from '$lib/stores/textFromEditorStore';

type PdfColor = [number, number, number];
type PdfRun = { text: string; color: PdfColor };
type PdfBlock = { runs: PdfRun[]; level: number; listIndent?: number };

function oklchToRgb(value: string): PdfColor | undefined {
	const match = value.match(/oklch\(\s*([\d.]+)%?\s+([\d.]+)\s+([\d.]+)(?:deg)?/i);
	if (!match) return;
	const lightness = Number(match[1]) / (match[1].includes('.') && Number(match[1]) <= 1 ? 1 : 100);
	const chroma = Number(match[2]);
	const hue = (Number(match[3]) * Math.PI) / 180;
	const a = chroma * Math.cos(hue);
	const b = chroma * Math.sin(hue);
	const l_ = lightness + 0.3963377774 * a + 0.2158037573 * b;
	const m_ = lightness - 0.1055613458 * a - 0.0638541728 * b;
	const s_ = lightness - 0.0894841775 * a - 1.291485548 * b;
	const l = l_ ** 3;
	const m = m_ ** 3;
	const s = s_ ** 3;
	const linear = [
		4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
		-1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
		-0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s
	];
	return linear.map((channel) => {
		const srgb = channel <= 0.0031308 ? 12.92 * channel : 1.055 * Math.max(0, channel) ** (1 / 2.4) - 0.055;
		return Math.round(Math.min(1, Math.max(0, srgb)) * 255);
	}) as PdfColor;
}

function parseColor(value: string, fallback: PdfColor): PdfColor {
	const color = value.trim().toLowerCase();
	const hex = color.match(/^#([\da-f]{3}|[\da-f]{6})$/i);
	if (hex) {
		const value = hex[1].length === 3 ? [...hex[1]].map((digit) => digit + digit).join('') : hex[1];
		return [0, 2, 4].map((offset) => parseInt(value.slice(offset, offset + 2), 16)) as PdfColor;
	}
	const rgb = color.match(/^rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)/);
	if (rgb) return [Number(rgb[1]), Number(rgb[2]), Number(rgb[3])];
	if (color.startsWith('oklch(')) return oklchToRgb(color) ?? fallback;
	const named: Record<string, PdfColor> = {
		black: [0, 0, 0], white: [255, 255, 255], red: [255, 0, 0], blue: [0, 0, 255],
		green: [0, 128, 0], yellow: [255, 255, 0], orange: [255, 165, 0], violet: [238, 130, 238]
	};
	return named[color] ?? fallback;
}

function collectRuns(node: Node, inheritedColor: PdfColor, runs: PdfRun[]): void {
	if (node.nodeType === Node.TEXT_NODE) {
		if (node.textContent) runs.push({ text: node.textContent, color: inheritedColor });
		return;
	}
	if (!(node instanceof Element)) return;
	if (node.tagName === 'BR') {
		runs.push({ text: '\n', color: inheritedColor });
		return;
	}
	const elementColor = (node as HTMLElement).style?.color;
	const color = elementColor ? parseColor(elementColor, inheritedColor) : inheritedColor;
	for (const child of Array.from(node.childNodes)) collectRuns(child, color, runs);
}

function collectBlocks(html: string): PdfBlock[] {
	const parsed = new DOMParser().parseFromString(`<div>${html}</div>`, 'text/html');
	const root = parsed.body.firstElementChild;
	if (!root) return [];
	const blocks: PdfBlock[] = [];
	const defaultColor: PdfColor = [17, 24, 39];

	function addBlock(node: Element, level: number, listIndent = 0, prefix = '') {
		const runs: PdfRun[] = [];
		if (prefix) runs.push({ text: prefix, color: defaultColor });
		collectRuns(node, defaultColor, runs);
		const normalized = runs
			.map((run) => ({ ...run, text: run.text.replace(/[\t\r ]+/g, ' ') }))
			.filter((run) => run.text.length > 0);
		while (normalized.length && /^\s+$/.test(normalized[0].text)) normalized.shift();
		while (normalized.length && /^\s+$/.test(normalized[normalized.length - 1].text)) normalized.pop();
		if (normalized.length) blocks.push({ runs: normalized, level, listIndent });
	}

	function visit(node: Element, indent = 0) {
		const tag = node.tagName.toLowerCase();
		if (/^h[1-6]$/.test(tag)) {
			addBlock(node, Math.max(1, 4 - Number(tag[1])));
			return;
		}
		if (tag === 'p' || tag === 'blockquote' || tag === 'pre') {
			addBlock(node, 0, tag === 'blockquote' ? 1 : 0);
			return;
		}
		if (tag === 'ul' || tag === 'ol') {
			const items = Array.from(node.children).filter((child) => child.tagName.toLowerCase() === 'li');
			items.forEach((item, index) => {
				const marker = tag === 'ol' ? `${index + 1}. ` : '• ';
				const itemContent = item.cloneNode(true) as HTMLElement;
				itemContent.querySelectorAll('ul, ol').forEach((list) => list.remove());
				addBlock(itemContent, 0, indent + 1, marker);
				Array.from(item.children).filter((child) => ['ul', 'ol'].includes(child.tagName.toLowerCase())).forEach((child) => visit(child, indent + 1));
			});
			return;
		}
		if (tag === 'li') {
			addBlock(node, 0, indent + 1, '• ');
			return;
		}
		for (const child of Array.from(node.children)) visit(child, indent);
	}

	for (const child of Array.from(root.children)) visit(child);
	if (!blocks.length && root.textContent?.trim()) addBlock(root, 0);
	return blocks;
}

export function exportStateAsPDF(state: string): void {
	const title = get(textTitle).replace(/\.[^/.]+$/, '') || 'document';
	const pdf = new jsPDF({ unit: 'mm', format: 'a4' });
	const margin = 25.4;
	const pageWidth = pdf.internal.pageSize.getWidth();
	const pageHeight = pdf.internal.pageSize.getHeight();
	const maxY = pageHeight - margin;
	let y = margin;

	for (const block of collectBlocks(state)) {
		const fontSize = block.level > 0 ? 18 - (block.level - 1) * 2 : 12;
		const indent = (block.listIndent ?? 0) * 5;
		const lineHeight = fontSize * 0.42;
		const startX = margin + indent;
		let x = startX;
		pdf.setFont('helvetica', block.level > 0 ? 'bold' : 'normal');
		pdf.setFontSize(fontSize);

		for (const run of block.runs) {
			const tokens = run.text.match(/\n|\s+|[^\s]+/g) ?? [];
			pdf.setTextColor(...run.color);
			for (const token of tokens) {
				if (token === '\n') {
					y += lineHeight;
					x = startX;
				} else if (/^\s+$/.test(token)) {
					if (x > startX) x += pdf.getTextWidth(token);
				} else {
					const tokenWidth = pdf.getTextWidth(token);
					if (x > startX && x + tokenWidth > pageWidth - margin) {
						y += lineHeight;
						x = startX;
					}
					if (y + lineHeight > maxY) {
						pdf.addPage();
						y = margin;
					}
					pdf.text(token, x, y);
					x += tokenWidth;
				}
			}
		}
		y += lineHeight + (block.level > 0 ? 3 : 2);
		if (y > maxY) {
			pdf.addPage();
			y = margin;
		}
	}

	pdf.save(title);
}

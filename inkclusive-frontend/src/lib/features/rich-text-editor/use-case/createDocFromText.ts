import type { Node as ProseMirrorNode } from 'prosemirror-model';
import mySchema from '$lib/features/rich-text-editor/entities/Schema';

/** Build a schema-valid ProseMirror document from extracted plain text. */
export function createDocFromText(text: string): ProseMirrorNode {
	const lines = text.replace(/\r\n?/g, '\n').split('\n');
	const paragraphs = lines.map((line) =>
		mySchema.nodes.paragraph.create(null, line ? mySchema.text(line) : null)
	);
	return mySchema.nodes.doc.create(null, paragraphs);
}

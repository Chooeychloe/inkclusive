import { writable } from 'svelte/store';

type EditorHistoryState = {
	canUndo: boolean;
	canRedo: boolean;
	undo: () => void;
	redo: () => void;
};

export const editorHistoryStore = writable<EditorHistoryState>({
	canUndo: false,
	canRedo: false,
	undo: () => {},
	redo: () => {}
});

import { createWorker, type Worker } from 'tesseract.js';

export async function ocrToText(file: File | null, language: string = 'eng', signal?: AbortSignal): Promise<string> {
	if (!file) {
		throw new Error('No file provided');
	}

	const supportedTypes = ['image/jpeg', 'image/png', 'image/webp'];
	if (!supportedTypes.includes(file.type)) {
		throw new Error(`Unsupported file type: ${file.type}`);
	}

	let worker: Worker | null = null;
	let workerTerminated = false;
	let aborted = signal?.aborted ?? false;
	const terminateWorker = () => {
		if (worker && !workerTerminated) {
			workerTerminated = true;
			void worker.terminate();
		}
	};
	const abortRecognition = () => { aborted = true; terminateWorker(); };
	signal?.addEventListener('abort', abortRecognition, { once: true });
	try {
		worker = await createWorker(language);
		if (aborted) throw new DOMException('Scan cancelled', 'AbortError');
		const { data: { text } } = await worker.recognize(file);
		if (aborted) throw new DOMException('Scan cancelled', 'AbortError');

		return text;
	} catch (error) {
		throw new Error(`OCR processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
	} finally {
		signal?.removeEventListener('abort', abortRecognition);
		if (worker && !workerTerminated) {
			workerTerminated = true;
			await worker.terminate();
		}
	}
}

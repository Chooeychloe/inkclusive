# Inkclusive

Inkclusive is an inclusive-writing assistant built with SvelteKit, TypeScript, and a separate FastAPI service. Writers can edit text, scan a document into the editor, review grammar and gender-fair language suggestions, apply changes selectively, and export their work.

## How the system works

1. **Write or import text.** The ProseMirror editor stores the current title and text in Svelte stores. On the Scan page, the browser extracts text from PDFs with PDF.js and images with Tesseract.js; DOCX files are sent to a SvelteKit endpoint that extracts plain text with Mammoth.
2. **Autosave a local draft.** The editor saves the current title, text, and formatted HTML to browser `localStorage` after a short pause in typing. If the editor opens with no current text, it restores the last non-empty draft. No account or login is required. Drafts are local to the current browser and device; clearing browser storage removes them. This autosave is separate from the session History page, which stores completed review sessions in IndexedDB.
3. **Run the checks.** The client sends the text to the FastAPI `/api/v1/grammar` endpoint and then `/api/v1/gfl`. LanguageTool supplies grammar messages and replacement options; internal rule identifiers remain available to the API for diagnostics but are hidden from writers. The gender-fair checker uses its term list, pronoun preferences, and optional admin guidance to produce alternatives and explanations.
4. **Review suggestions.** Each finding is attached to a source range and includes its explanation when available. A writer can apply one replacement, ignore a finding, or apply all suggestions. The editor updates its text and formatted HTML as changes are made.
5. **Save or export.** Review sessions can be revisited from browser history. The editor can export supported document formats using the client-side document utilities.

## Main routes and services

- `/write` - write, format, autosave, and review suggestions.
- `/scan` - extract text from PDF, DOCX, JPG, JPEG, and PNG files, with status, error, and cancel feedback.
- `/history` - view or clear review sessions saved in browser IndexedDB.
- `/admin` - manage term alternatives, categories, guidance, and examples; import or export the library as CSV.
- SvelteKit `/api/extract/*`, `/api/docx`, and `/api/admin/*` - server endpoints for extraction/export helpers and protected admin sessions.
- FastAPI `/api/v1/grammar`, `/api/v1/gfl`, `/api/v1/count`, and `/api/v1/terms/*` - versioned language analysis and term library API.

Admin sign-in is verified by the FastAPI backend. Term-management requests are proxied through same-origin SvelteKit endpoints, which keep the expiring backend token in an HttpOnly cookie. Configure `ADMIN_PASSWORD` and a random `ADMIN_TOKEN_SECRET` of at least 32 bytes on the backend, plus `PUBLIC_BACKEND_URL` for the frontend. Admins can change their password from the admin header; the backend stores a salted hash in `ADMIN_CREDENTIALS_FILE` (default `./admin_credentials.json`), so point it at persistent storage when deploying.

The former `/dashboard/editor`, `/dashboard/scan`, and `/dashboard/history` URLs redirect to `/write`, `/scan`, and `/history` respectively.

## Local data and privacy

- **Draft recovery:** one current draft is stored in `localStorage` under `inkclusive.localDraft.v1`. It is not uploaded automatically, synchronized between devices, or backed up by an account.
- **History:** writing sessions are stored in browser IndexedDB (`HistoryDB`). Clearing this history is independent of the current autosaved draft.
- **Analysis:** grammar and gender-fair checks send text to the configured FastAPI backend. Imported DOCX text is processed by the SvelteKit server endpoint. Configure deployments and privacy notices accordingly.
- **Term metadata:** the backend keeps the existing `gendered_terms.csv` format for compatibility with its checker and saves categories, usage guidance, and examples in `gendered_terms_metadata.json`.

## Setup

Use Node.js 20 or newer. Set `PUBLIC_BACKEND_URL` to the FastAPI base URL; a trailing slash is optional.

```sh
npm ci
npm run dev
```

The dev server normally runs at `http://localhost:5173`. For backend setup and API details, see the [backend README](../inkclusive-backend/README.md).

## Commands

```sh
npm run check       # Svelte and TypeScript diagnostics
npm run build       # production build
npm run preview     # serve the production build locally
npm test            # Vitest unit tests
npm run lint        # ESLint and Prettier checks
```

The client uses Tailwind CSS 4 through its Vite plugin, the SvelteKit Netlify adapter, ProseMirror, TanStack Table, Zod, PDF.js, Tesseract.js, Mammoth, and jsPDF. Tailwind setup is in `vite.config.ts`, `src/app.css`, and `tailwind.config.ts`.

## Configuration

| Variable | Purpose |
| --- | --- |
| `PUBLIC_BACKEND_URL` | Browser-visible base URL of the FastAPI service; a trailing slash is optional. |
| `ADMIN_PASSWORD` | Set on the backend; used by the API to authenticate admin sign-in. |
| `ADMIN_TOKEN_SECRET` | Set on the backend; random secret of at least 32 bytes used to sign expiring admin tokens. |

Netlify uses `npm run build`; its adapter output is configured in `netlify.toml`.

## Setup

Use Node.js 20 or newer. Set `PUBLIC_BACKEND_URL` to the backend base URL; a trailing slash is optional. Configure admin credentials on the backend as described in its README.

```sh
npm ci
npm run dev
```

The dev server normally runs at `http://localhost:5173`. For local backend setup, see the [backend README](../inkclusive-backend/README.md).

## Commands

```sh
npm run check       # Svelte and TypeScript diagnostics
npm run build       # production build
npm run preview     # serve the production build locally
npm test            # Vitest unit tests
npm run lint        # ESLint and Prettier checks
```

The app uses Tailwind CSS 4 through its Vite plugin, SvelteKit's Netlify adapter, ProseMirror, TanStack Table, Zod, PDF.js, Tesseract.js, Mammoth, and jsPDF. Tailwind's project setup is in `vite.config.ts`, `src/app.css`, and `tailwind.config.ts`, following the [Tailwind SvelteKit guide](https://tailwindcss.com/docs/installation/framework-guides/sveltekit).

## Configuration

| Variable | Purpose |
| --- | --- |
| `PUBLIC_BACKEND_URL` | Base URL of the FastAPI server; a trailing slash is optional. The browser uses same-origin SvelteKit proxy routes for admin requests. |
| `ADMIN_PASSWORD` | Configure on the backend only; it is checked by the backend admin login endpoint. |
| `ADMIN_TOKEN_SECRET` | Configure on the backend only; random secret of at least 32 bytes used to sign admin session tokens. |

The Netlify build uses `npm run build` and publishes the adapter output as configured in `netlify.toml`.

# Inkclusive user and administrator guide

Inkclusive helps you review grammar and wording that may benefit from gender-fair alternatives. It offers suggestions for you to review; it does not decide what wording is right for every context. This guide covers the web workspace, document scanning, review history, and administrator term-library management.

## Open the workspace

Open the Inkclusive web address supplied by your administrator. The workspace navigation has three areas:

- **Write**: compose or paste text, format it, and run language checks.
- **Scan**: extract text from a PDF, Word DOCX, or JPG/JPEG/PNG image, then review it.
- **History**: reopen or remove saved review sessions on this browser.

The Help & preferences menu contains the light/dark theme switch, keyboard commands, help guidance, and About information. On narrow screens, navigation labels may be represented by icons.

## Write and review a document

1. Open **Write**. Enter a document title and type or paste text into the editor. The editor supports headings, normal paragraphs, bold, italic, underline, font styling, alignment, and lists from its toolbar. Use undo and redo to reverse edits.
2. Inkclusive saves the current draft automatically in this browser on this device. The save status appears below the title/toolbar. Drafts are not synced between devices or sent to the server until you run a check. Keep a separate copy of important work.
3. Open the **AI Companion** settings (gear) to enter name and preferred-pronoun preferences when the document identifies people whose pronouns are known. These preferences guide the gender-fair check; they are not identity verification.
4. In the companion panel, choose the grammar check. Review the grammar suggestions and their proposed replacements. Apply individual suggestions or use the available apply-all action; ignore suggestions that do not fit your meaning. While reviewing the workflow, the editor is locked against direct edits. Return to the writing step to make broader edits.
5. Continue to the gender-fair language check. Review the flagged wording, rationale/guidance, examples, and alternatives. Choose the replacement that fits, or ignore the suggestion. The checker uses configured term and language patterns, so context matters and results may include false positives or miss wording that needs attention.
6. Finish the review to see the summary/analytics. Use the return/start-over control to begin another document. The full reset clears the current editor content; save or export anything you need first.

You may also use the editor's export controls to download a reviewed document as PDF or DOCX. Export is a copy; it does not publish or share the document.

## Scan a file

1. Open **Scan** and drop a file into the box or choose **Select file**. Supported formats are PDF, DOCX, JPG, JPEG, and PNG.
2. Inkclusive extracts selectable text from PDF and DOCX files and uses OCR for images. Wait for extraction to finish. Use **Cancel scan** to stop processing.
3. Check the extracted text in the editor carefully. OCR and document extraction can introduce errors or miss layout, tables, and formatting. The extracted text becomes the working draft; continue with grammar and gender-fair review as above.
4. Use **Select Another File** to replace the current scan.

If no readable text is found, try a clearer image or a text-based document. Image recognition and file extraction run in the browser/client; analysis requests are sent to the configured Inkclusive API when you run checks.

## Review history

Open **History** to see completed grammar and gender-fair review snapshots saved in this browser's IndexedDB. Select an entry to inspect or restore it using its card controls. Remove one entry with its delete control, or use **Clear All** to erase all history stored for this browser. History is local to the browser profile; it is not a cross-device account or server backup.

## Administrator: access the term library

Administrators manage the language terms and guidance used by gender-fair suggestions at **/admin** on the web client. Sign in with the admin password configured for the backend. The browser receives a secure, HttpOnly session cookie through the frontend; API tokens are not exposed to page scripts. Sessions expire after eight hours. Sign-in is rate-limited after repeated failed attempts.

The page shows the term count, number of alternatives, connection status, and a searchable, sortable, paginated table. Search covers term, alternatives, category, guidance, and examples; all query words must match. Choose 10, 25, 50, or 100 rows per page. Select rows with the checkboxes for bulk deletion.

### Add terms

1. Choose **Add term**.
2. Enter the term or phrase the checker should recognize.
3. Enter one or more suggested alternatives separated by commas.
4. Choose a category (or **Other**). Categories include roles, collective language, education, family and relationships, gendered reference, public facilities, sexual orientation, titles/status, potentially stigmatizing wording, pronouns, age, disability, and identity.
5. Optionally add usage guidance and example phrases. Separate examples with semicolons.
6. Choose **Add to batch** for each entry. Review the batch and remove any accidental entries, then choose **Save terms to library**. The API accepts bulk creation of up to 500 terms per request; duplicate terms are rejected rather than silently overwritten.

Keep terms specific and guidance practical. Explain when an alternative fits; a flag is a prompt to review context, not a ban on a word.

### Edit, search, and delete

- Use the row's actions menu and choose **Edit term** to update alternatives, category, guidance, or examples. Separate alternatives with commas and examples with semicolons, then save.
- Use the search field to find a term or guidance text. Click the term heading to change sort order; use the page controls to move through results.
- Use the row actions menu to delete one term, or select multiple rows and choose **Delete selected**. Confirm the deletion. Deletion is permanent from the library; export a backup first if needed.

### Import and export the library

Choose **Export CSV** to download a backup named `inkclusive-term-library.csv`. Exported columns are `term`, `alternatives`, `category`, `guidance`, and `examples`. Alternatives and examples are joined by `|` inside their CSV cells; the CSV file quotes cells and escapes embedded quotes.

To import, choose **Import CSV** and select a CSV with a `term` column first, followed by `alternatives`. Optional columns are `category`, `guidance`, and `examples`. In this import format, separate alternatives and examples with `|`. Rows without both a term and alternatives are skipped. Import adds entries in bulk; it does not update existing entries, so duplicate terms can cause the batch to be rejected. Export before making a large change.

### Change password and sign out

In the Admin menu, choose **Change password**. Enter the current password and a matching new password of at least 12 characters. The change invalidates the current admin session; return to sign-in and authenticate again. Choose **Sign out** when finished, especially on shared devices.

## Administrator: deployment and data care

The app has a SvelteKit frontend and a FastAPI backend. The frontend needs `PUBLIC_BACKEND_URL` pointing to the backend. The backend needs an initial `ADMIN_PASSWORD` and a persistent random `ADMIN_TOKEN_SECRET` of at least 32 bytes. See the project [README](README.md) and [backend README](inkclusive-backend/README.md) for local setup, Docker, and production configuration.

After a password change, the backend stores a salted PBKDF2 password hash in `ADMIN_CREDENTIALS_FILE` (default `./admin_credentials.json`); this file must persist across container replacement and be kept private. The credentials file takes precedence over the initial `ADMIN_PASSWORD`. Keep the same token secret across restarts or existing sessions will expire.

The term library is stored in `gendered_terms.csv` plus `gendered_terms_metadata.json`; back up and restore them together. The analysis count is stored in `count.csv`. These files are relative to the backend working directory. In Docker, ensure the backend data directory is persisted. Serve production traffic over HTTPS and set `CORS_ORIGINS` to trusted frontend origins. Do not expose admin credentials or secrets in the frontend environment or source control.

## What is sent and stored

- Current draft and autosave: browser localStorage on this device.
- Completed review history: browser IndexedDB on this device.
- When you run grammar or gender-fair analysis, the document text is sent to the configured backend. The backend's grammar analyzer uses LanguageTool; gender-fair checks use spaCy plus the configured term rules. Gender-fair analysis increments the backend request counter; grammar checks do not.
- Admin term changes are written to the backend term files. The browser admin session is held in an HttpOnly cookie.


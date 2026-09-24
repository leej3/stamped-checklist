# Local development and build

From the repository root:

1. Install dependencies:

    ```bash
    npm ci
    ```

2. Start the local development server:

    ```bash
    npm run dev
    ```

3. Build for production:

    ```bash
    npm run build
    ```

4. Preview the production build locally:

    ```bash
    npm run preview
    ```

## Saved-answer compatibility

Browser saves now contain `{ format: 2, responses: { ... } }`, keyed by the
stable `stamped-checklist:<level>/<ordinal>` item IDs. Shared URLs use
`format=2` and a UTF-8/base64 JSON `responses` parameter; new links do not emit
positional `state` bits. Positional DOM identifiers remain internal to the UI.

Unversioned browser responses and old `responses`/`state` URLs are read using
the frozen 30-item mapping in `persistence.js`, taken from checklist release
`v0.1.0`, before M.4 was inserted. This is the only supported legacy layout;
do not update the mapping when current checklist data changes. Migration
happens on read; the next edit saves format 2, and loaded URLs are rewritten
in format 2. Explicit URL answers take precedence over browser saves.

Unrecognized legacy positions, malformed data, or unsupported formats show a
notice and prevent persistence until the user explicitly resets, preserving
the original saved data. The older browser `checkboxes` format remains
unsupported. There is no historical-version detection or migration framework.

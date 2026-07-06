# PDF Splitter

Split and extract PDF pages — entirely in your browser.

**➜ [Use it here](https://vensas.github.io/pdf-splitter/)**

## Why this exists

Most online PDF splitters upload your document to a server. This tool doesn't:
all processing happens locally in your browser using [pdf-lib](https://pdf-lib.js.org)
and [pdf.js](https://mozilla.github.io/pdf.js/). **Your files never leave your machine** —
safe for payslips, contracts, and anything else you'd rather not upload to a stranger's server.

## Features

- 📄 Drag & drop a PDF and see thumbnails of every page
- ✂️ Click pages to select, then extract them as one PDF or one PDF per page (ZIP)
- 🔢 Split by page ranges, e.g. `1-3, 5, 8-10` — each range becomes its own PDF
- 📦 Split the whole document into single pages as a ZIP
- 🌓 Light & dark mode, no accounts, no tracking, no server

## Development

```bash
npm install
npm run dev        # local dev server
npm test           # unit tests
npm run build      # type-check + production build to dist/
```

## Deployment

Every push to `main` runs the tests and deploys to GitHub Pages via
[`.github/workflows/deploy.yml`](.github/workflows/deploy.yml).
The Vite `base` is set to `/pdf-splitter/` to match the Pages URL.

## Limitations

- Very large PDFs are constrained by browser memory (typical documents are fine).
- Password-protected PDFs are not supported.

## License

[MIT](LICENSE)

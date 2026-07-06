# Changelog

## 1.2.1 — 2026-07-06

- The large preview only appears while pages are selected, so it can no
  longer be mistaken for a selection: no more automatic preview of page 1
  after loading, deselecting the previewed page falls back to the most
  recently selected one, and clearing the selection empties the pane

## 1.2.0 — 2026-07-06

- vensas branding: logo in the header (theme-aware light/dark variants),
  brand color palette (ocean primary, jet surfaces) in both themes
- Favicon now uses the vensas mark and adapts to the browser theme
- Footer links to the vensas.de imprint page and the vensas website

## 1.1.0 — 2026-07-06

- Large preview pane next to the page grid: clicking a page shows it big and
  readable on the right, so you can check the content before extracting
- The first page is previewed automatically after loading a document
- The currently previewed page is marked with a dotted outline in the grid
- On narrow screens the preview moves above the grid instead of beside it

## 1.0.0 — 2026-07-06

Initial release.

- Drag & drop a PDF and preview all pages as thumbnails
- Extract selected pages as a single PDF
- Download selected pages as individual PDFs in a ZIP
- Split by page ranges (e.g. `1-3, 5, 8-10`) into separate PDFs
- Split the whole document into single-page PDFs as a ZIP
- All processing happens client-side — no uploads, no server
- Automated tests and GitHub Pages deployment via GitHub Actions

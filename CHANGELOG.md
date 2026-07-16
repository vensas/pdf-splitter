# Changelog

## 1.4.3 — 2026-07-17

- Fixed broken asset loading (404s) on the custom domain: the Vite `base`
  now targets the site root for pdf-splitter.apps.vensas.de instead of the
  old vensas.github.io/pdf-splitter path
- Updated Open Graph/Twitter meta URLs and README links to the custom domain

## 1.4.2 — 2026-07-17

- Switched the package manager from npm to pnpm: pnpm-lock.yaml replaces
  package-lock.json, CI installs with `pnpm install --frozen-lockfile`,
  and the pnpm version is pinned via the `packageManager` field

## 1.4.1 — 2026-07-06

- The status/hint message moved from below the actions to directly under
  the drop zone, so "use a page range below" points the right way
- WCAG 2.1 AA remediation (verified with axe-core in light and dark,
  empty and loaded states — zero violations):
  - Muted text, links, error text, and primary-button text meet 4.5:1
    contrast (darkened ocean/gray shades; dark text on ocean buttons)
  - Focus rings, control borders, selected-page borders, and the drop
    zone boundary meet 3:1 non-text contrast
  - Selected pages are marked with a check mark, not color alone, and
    expose their state via aria-pressed
  - The drop zone is keyboard-operable (Enter/Space opens the file picker)
  - The large preview canvas is labelled for screen readers
  - Animations and transitions are disabled under prefers-reduced-motion

## 1.4.0 — 2026-07-06

- Theme toggle in the header: Auto / Light / Dark, persisted across visits
  and applied before first paint (no flash)
- Social sharing: Open Graph and Twitter card meta tags with a branded
  1200x630 preview image
- Design polish: upload icon and privacy hint in the drop zone, subtle
  header gradient, pill-style status messages, uppercase section labels,
  refined buttons, shadows, and focus rings
- Improved README with badges, screenshot, usage guide, and module overview

## 1.3.0 — 2026-07-06

- The footer shows the current version, injected from package.json at
  build time
- Company name is now written as "vensas GmbH" throughout (footer, page
  title, logo alt text, meta description)

## 1.2.2 — 2026-07-06

- The large preview no longer scrolls: the PDF section grew taller, the
  preview column wider, and the rendered page is capped to fit the pane

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

import './style.css';
import { parseRanges, formatPageLabel } from './ranges';
import { extractPages, splitByGroups, splitToSinglePages } from './split';
import { loadForPreview, type LoadedPdf } from './thumbnails';
import { downloadPdf, downloadZip } from './download';

interface AppState {
  fileName: string;
  bytes: Uint8Array;
  preview: LoadedPdf;
  selected: Set<number>;
}

let state: AppState | null = null;

const dropZone = mustGet<HTMLElement>('#drop-zone');
const fileInput = mustGet<HTMLInputElement>('#file-input');
const workspace = mustGet<HTMLElement>('#workspace');
const fileNameLabel = mustGet<HTMLElement>('#file-name');
const pageCountLabel = mustGet<HTMLElement>('#page-count');
const pageGrid = mustGet<HTMLElement>('#page-grid');
const selectionLabel = mustGet<HTMLElement>('#selection-count');
const rangeInput = mustGet<HTMLInputElement>('#range-input');
const statusLine = mustGet<HTMLElement>('#status');
const previewPane = mustGet<HTMLElement>('#preview-pane');
const previewPlaceholder = mustGet<HTMLElement>('#preview-placeholder');
const previewFigure = mustGet<HTMLElement>('#preview-figure');
const previewCanvas = mustGet<HTMLCanvasElement>('#preview-canvas');
const previewLabel = mustGet<HTMLElement>('#preview-label');

function mustGet<T extends Element>(selector: string): T {
  const element = document.querySelector<T>(selector);
  if (!element) throw new Error(`Missing element: ${selector}`);
  return element;
}

function baseName(): string {
  return state ? state.fileName.replace(/\.pdf$/i, '') : 'document';
}

function setStatus(message: string, kind: 'info' | 'error' | 'busy' = 'info'): void {
  statusLine.textContent = message;
  statusLine.dataset['kind'] = kind;
}

function updateSelectionLabel(): void {
  if (!state) return;
  const count = state.selected.size;
  selectionLabel.textContent = count === 0 ? 'No pages selected' : `${count} page${count === 1 ? '' : 's'} selected`;
  for (const button of document.querySelectorAll<HTMLButtonElement>('[data-needs-selection]')) {
    button.disabled = count === 0;
  }
}

function togglePage(index: number, card: HTMLElement): void {
  if (!state) return;
  if (state.selected.has(index)) {
    state.selected.delete(index);
    card.classList.remove('selected');
  } else {
    state.selected.add(index);
    card.classList.add('selected');
  }
  card.setAttribute('aria-pressed', String(state.selected.has(index)));
  updateSelectionLabel();

  if (state.selected.has(index)) {
    showPreview(index, card);
  } else if (previewedIndex === index) {
    // The previewed page was deselected: fall back to the most recently
    // selected page, or clear the pane when nothing is selected anymore.
    previewLastSelectedOrClear();
  }
}

function previewLastSelectedOrClear(): void {
  if (!state) return;
  const remaining = [...state.selected];
  const fallback = remaining[remaining.length - 1];
  if (fallback === undefined) {
    resetPreviewPane();
    return;
  }
  showPreview(fallback, pageGrid.querySelectorAll<HTMLElement>('.page-card')[fallback] ?? null);
}

let previewedIndex: number | null = null;
let previewRequest = 0;
// pdf.js forbids concurrent render() calls on one canvas, so renders are chained.
let previewChain: Promise<void> = Promise.resolve();

function showPreview(index: number, card: HTMLElement | null): void {
  if (!state) return;
  const request = ++previewRequest;
  const preview = state.preview;
  previewedIndex = index;

  for (const other of pageGrid.querySelectorAll('.page-card.previewed')) {
    other.classList.remove('previewed');
  }
  card?.classList.add('previewed');

  previewPlaceholder.hidden = true;
  previewFigure.hidden = false;
  previewLabel.textContent = `Page ${index + 1} of ${preview.pageCount}`;

  previewChain = previewChain.then(async () => {
    // A newer click superseded this one while it waited in the queue.
    if (request !== previewRequest) return;

    // Render at the pane's actual width so text is readable, with a sane
    // floor, capped to the pane's height so the preview never scrolls.
    const paneStyle = getComputedStyle(previewPane);
    const width = Math.max(
      320,
      previewPane.clientWidth - parseFloat(paneStyle.paddingLeft) - parseFloat(paneStyle.paddingRight),
    );
    const paneMaxHeight = parseFloat(paneStyle.maxHeight); // NaN when 'none' (narrow screens)
    const captionAllowance = 72; // caption line + figure gap + paddings
    const maxHeight = Number.isNaN(paneMaxHeight) ? undefined : paneMaxHeight - captionAllowance;

    try {
      await preview.renderPage(index, previewCanvas, width, maxHeight);
    } catch {
      if (request === previewRequest) {
        previewFigure.hidden = true;
        previewPlaceholder.hidden = false;
        previewPlaceholder.textContent = 'Preview unavailable for this page.';
      }
    }
  });
}

function resetPreviewPane(): void {
  previewRequest++;
  previewedIndex = null;
  for (const card of pageGrid.querySelectorAll('.page-card.previewed')) {
    card.classList.remove('previewed');
  }
  previewFigure.hidden = true;
  previewPlaceholder.hidden = false;
  previewPlaceholder.textContent = 'Select a page to see a large preview here.';
}

async function openFile(file: File): Promise<void> {
  if (file.type !== 'application/pdf' && !/\.pdf$/i.test(file.name)) {
    setStatus('Please choose a PDF file.', 'error');
    return;
  }

  setStatus(`Loading ${file.name} …`, 'busy');
  try {
    const bytes = new Uint8Array(await file.arrayBuffer());
    const preview = await loadForPreview(bytes);

    state?.preview.destroy();
    state = { fileName: file.name, bytes, preview, selected: new Set() };

    fileNameLabel.textContent = file.name;
    pageCountLabel.textContent = `${preview.pageCount} page${preview.pageCount === 1 ? '' : 's'}`;
    dropZone.classList.add('compact');
    workspace.hidden = false;
    resetPreviewPane();

    await renderGrid();
    updateSelectionLabel();
    setStatus('Click pages to select them, or use a page range below.');
  } catch (error) {
    setStatus(errorMessage(error, 'Could not read this PDF. It may be corrupted or password-protected.'), 'error');
  }
}

async function renderGrid(): Promise<void> {
  if (!state) return;
  pageGrid.replaceChildren();

  for (let index = 0; index < state.preview.pageCount; index++) {
    const card = document.createElement('button');
    card.type = 'button';
    card.className = 'page-card';
    card.setAttribute('aria-label', `Page ${index + 1}`);
    card.setAttribute('aria-pressed', 'false');

    const canvas = document.createElement('canvas');
    const label = document.createElement('span');
    label.className = 'page-number';
    label.textContent = String(index + 1);

    card.append(canvas, label);
    card.addEventListener('click', () => togglePage(index, card));
    pageGrid.append(card);

    try {
      await state.preview.renderPage(index, canvas);
    } catch {
      canvas.replaceWith(Object.assign(document.createElement('div'), {
        className: 'thumb-error',
        textContent: 'Preview unavailable',
      }));
    }
  }
}

function errorMessage(error: unknown, fallback: string): string {
  return error instanceof Error && error.message ? error.message : fallback;
}

async function runAction(label: string, action: () => Promise<void>): Promise<void> {
  if (!state) return;
  setStatus(`${label} …`, 'busy');
  try {
    await action();
    setStatus('Done. Your download has started.');
  } catch (error) {
    setStatus(errorMessage(error, 'Something went wrong while processing the PDF.'), 'error');
  }
}

// --- Theme ------------------------------------------------------------------

type Theme = 'auto' | 'light' | 'dark';
const THEME_ORDER: Theme[] = ['auto', 'light', 'dark'];
const THEME_LABELS: Record<Theme, string> = { auto: 'Auto', light: 'Light', dark: 'Dark' };
const themeLabel = mustGet<HTMLElement>('#theme-label');

function applyTheme(theme: Theme): void {
  if (theme === 'auto') {
    delete document.documentElement.dataset['theme'];
  } else {
    document.documentElement.dataset['theme'] = theme;
  }
  themeLabel.textContent = THEME_LABELS[theme];
}

function storedTheme(): Theme {
  const value = localStorage.getItem('theme');
  return value === 'light' || value === 'dark' ? value : 'auto';
}

applyTheme(storedTheme());

mustGet<HTMLButtonElement>('#theme-toggle').addEventListener('click', () => {
  const next = THEME_ORDER[(THEME_ORDER.indexOf(storedTheme()) + 1) % THEME_ORDER.length]!;
  localStorage.setItem('theme', next);
  applyTheme(next);
});

// --- Wire up the UI ---------------------------------------------------------

mustGet<HTMLElement>('#app-version').textContent = `v${__APP_VERSION__}`;

dropZone.addEventListener('click', () => fileInput.click());
dropZone.addEventListener('keydown', (event) => {
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault();
    fileInput.click();
  }
});
dropZone.addEventListener('dragover', (event) => {
  event.preventDefault();
  dropZone.classList.add('dragging');
});
dropZone.addEventListener('dragleave', () => dropZone.classList.remove('dragging'));
dropZone.addEventListener('drop', (event) => {
  event.preventDefault();
  dropZone.classList.remove('dragging');
  const file = event.dataTransfer?.files[0];
  if (file) void openFile(file);
});

fileInput.addEventListener('change', () => {
  const file = fileInput.files?.[0];
  if (file) void openFile(file);
  fileInput.value = '';
});

mustGet<HTMLButtonElement>('#select-all').addEventListener('click', () => {
  if (!state) return;
  const allSelected = state.selected.size === state.preview.pageCount;
  state.selected = allSelected ? new Set() : new Set(Array.from({ length: state.preview.pageCount }, (_, i) => i));
  for (const [position, card] of pageGrid.querySelectorAll('.page-card').entries()) {
    card.classList.toggle('selected', state.selected.has(position));
    card.setAttribute('aria-pressed', String(state.selected.has(position)));
  }
  updateSelectionLabel();
  if (state.selected.size === 0) {
    resetPreviewPane();
  } else if (previewedIndex === null) {
    previewLastSelectedOrClear();
  }
});

mustGet<HTMLButtonElement>('#extract-selected').addEventListener('click', () => {
  void runAction('Extracting selected pages', async () => {
    if (!state) return;
    const indices = [...state.selected].sort((a, b) => a - b);
    const bytes = await extractPages(state.bytes, indices);
    downloadPdf(bytes, `${baseName()}_pages_${formatPageLabel(indices)}.pdf`);
  });
});

mustGet<HTMLButtonElement>('#selected-as-zip').addEventListener('click', () => {
  void runAction('Splitting selected pages', async () => {
    if (!state) return;
    const indices = [...state.selected].sort((a, b) => a - b);
    const groups = indices.map((index) => [index]);
    const documents = await splitByGroups(state.bytes, groups);
    await downloadZip(
      documents.map((bytes, position) => ({
        name: `${baseName()}_page_${indices[position]! + 1}.pdf`,
        bytes,
      })),
      `${baseName()}_pages.zip`,
    );
  });
});

mustGet<HTMLButtonElement>('#split-all').addEventListener('click', () => {
  void runAction('Splitting into single pages', async () => {
    if (!state) return;
    const documents = await splitToSinglePages(state.bytes);
    await downloadZip(
      documents.map((bytes, index) => ({ name: `${baseName()}_page_${index + 1}.pdf`, bytes })),
      `${baseName()}_split.zip`,
    );
  });
});

mustGet<HTMLButtonElement>('#split-ranges').addEventListener('click', () => {
  void runAction('Splitting by ranges', async () => {
    if (!state) return;
    const groups = parseRanges(rangeInput.value, state.preview.pageCount);
    const documents = await splitByGroups(state.bytes, groups);
    if (documents.length === 1) {
      downloadPdf(documents[0]!, `${baseName()}_pages_${formatPageLabel(groups[0]!)}.pdf`);
      return;
    }
    await downloadZip(
      documents.map((bytes, position) => ({
        name: `${baseName()}_pages_${formatPageLabel(groups[position]!)}.pdf`,
        bytes,
      })),
      `${baseName()}_split.zip`,
    );
  });
});

rangeInput.addEventListener('keydown', (event) => {
  if (event.key === 'Enter') mustGet<HTMLButtonElement>('#split-ranges').click();
});

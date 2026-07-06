import { describe, expect, it, beforeAll } from 'vitest';
import { PDFDocument } from 'pdf-lib';
import { extractPages, splitByGroups, splitToSinglePages } from '../src/split';

let fivePages: Uint8Array;

async function makePdf(pageCount: number): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  for (let i = 0; i < pageCount; i++) {
    // Give each page a distinct width so tests can identify pages by size.
    doc.addPage([100 + i, 200]);
  }
  return doc.save();
}

async function pageWidths(bytes: Uint8Array): Promise<number[]> {
  const doc = await PDFDocument.load(bytes);
  return doc.getPages().map((page) => page.getWidth());
}

beforeAll(async () => {
  fivePages = await makePdf(5);
});

describe('extractPages', () => {
  it('extracts the requested pages in order', async () => {
    const result = await extractPages(fivePages, [0, 2, 4]);
    expect(await pageWidths(result)).toEqual([100, 102, 104]);
  });

  it('preserves a custom page order', async () => {
    const result = await extractPages(fivePages, [3, 0]);
    expect(await pageWidths(result)).toEqual([103, 100]);
  });

  it('rejects an empty selection', async () => {
    await expect(extractPages(fivePages, [])).rejects.toThrow(/at least one page/i);
  });

  it('rejects out-of-range pages', async () => {
    await expect(extractPages(fivePages, [5])).rejects.toThrow(/out of range/i);
    await expect(extractPages(fivePages, [-1])).rejects.toThrow(/out of range/i);
  });

  it('rejects bytes that are not a PDF', async () => {
    await expect(extractPages(new Uint8Array([1, 2, 3]), [0])).rejects.toThrow();
  });
});

describe('splitByGroups', () => {
  it('produces one document per group', async () => {
    const results = await splitByGroups(fivePages, [[0, 1], [4]]);
    expect(results).toHaveLength(2);
    expect(await pageWidths(results[0]!)).toEqual([100, 101]);
    expect(await pageWidths(results[1]!)).toEqual([104]);
  });

  it('returns no documents for no groups', async () => {
    expect(await splitByGroups(fivePages, [])).toEqual([]);
  });
});

describe('splitToSinglePages', () => {
  it('creates one single-page PDF per source page', async () => {
    const results = await splitToSinglePages(fivePages);
    expect(results).toHaveLength(5);
    for (const [index, bytes] of results.entries()) {
      expect(await pageWidths(bytes)).toEqual([100 + index]);
    }
  });

  it('handles a single-page document', async () => {
    const onePage = await makePdf(1);
    const results = await splitToSinglePages(onePage);
    expect(results).toHaveLength(1);
    expect(await pageWidths(results[0]!)).toEqual([100]);
  });
});

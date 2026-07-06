import { PDFDocument } from 'pdf-lib';

/**
 * Creates a new PDF containing only the given zero-based pages of the
 * source document, in the given order.
 */
export async function extractPages(sourceBytes: Uint8Array, pageIndices: number[]): Promise<Uint8Array> {
  if (pageIndices.length === 0) {
    throw new Error('Select at least one page.');
  }

  const source = await PDFDocument.load(sourceBytes, { ignoreEncryption: false });
  const pageCount = source.getPageCount();
  for (const index of pageIndices) {
    if (index < 0 || index >= pageCount) {
      throw new Error(`Page ${index + 1} is out of range — the document has ${pageCount} pages.`);
    }
  }

  const target = await PDFDocument.create();
  const copied = await target.copyPages(source, pageIndices);
  for (const page of copied) {
    target.addPage(page);
  }
  return target.save();
}

/**
 * Splits the source document into one PDF per group of zero-based page
 * indices. Groups typically come from parseRanges().
 */
export async function splitByGroups(sourceBytes: Uint8Array, groups: number[][]): Promise<Uint8Array[]> {
  const results: Uint8Array[] = [];
  for (const group of groups) {
    results.push(await extractPages(sourceBytes, group));
  }
  return results;
}

/**
 * Splits the source document into single-page PDFs, one per page.
 */
export async function splitToSinglePages(sourceBytes: Uint8Array): Promise<Uint8Array[]> {
  const source = await PDFDocument.load(sourceBytes, { ignoreEncryption: false });
  const groups = source.getPageIndices().map((index) => [index]);
  return splitByGroups(sourceBytes, groups);
}

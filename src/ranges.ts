/**
 * Parses a page-range expression like "1-3, 5, 8-10" into groups of
 * zero-based page indices. Each comma-separated part becomes its own group,
 * so "1-3, 5" yields [[0, 1, 2], [4]].
 *
 * Throws with a user-facing message on invalid input.
 */
export function parseRanges(input: string, pageCount: number): number[][] {
  const trimmed = input.trim();
  if (trimmed === '') {
    throw new Error('Enter at least one page or range, e.g. "1-3, 5".');
  }

  const groups: number[][] = [];
  for (const rawPart of trimmed.split(',')) {
    const part = rawPart.trim();
    if (part === '') continue;

    const match = /^(\d+)(?:\s*-\s*(\d+))?$/.exec(part);
    if (!match) {
      throw new Error(`"${part}" is not a valid page or range.`);
    }

    const start = Number(match[1]);
    const end = match[2] !== undefined ? Number(match[2]) : start;

    if (start < 1 || end < 1) {
      throw new Error('Page numbers start at 1.');
    }
    if (start > end) {
      throw new Error(`Range "${part}" is reversed — use ${end}-${start}.`);
    }
    if (end > pageCount) {
      throw new Error(`Page ${end} is out of range — the document has ${pageCount} page${pageCount === 1 ? '' : 's'}.`);
    }

    const group: number[] = [];
    for (let page = start; page <= end; page++) {
      group.push(page - 1);
    }
    groups.push(group);
  }

  if (groups.length === 0) {
    throw new Error('Enter at least one page or range, e.g. "1-3, 5".');
  }
  return groups;
}

/**
 * Formats zero-based page indices as a compact one-based range label,
 * e.g. [0,1,2,4] -> "1-3_5". Used for generated file names.
 */
export function formatPageLabel(indices: number[]): string {
  if (indices.length === 0) return '';
  const sorted = [...indices].sort((a, b) => a - b);
  const parts: string[] = [];
  let start = sorted[0]!;
  let prev = start;

  for (const index of sorted.slice(1)) {
    if (index === prev + 1) {
      prev = index;
      continue;
    }
    parts.push(start === prev ? `${start + 1}` : `${start + 1}-${prev + 1}`);
    start = index;
    prev = index;
  }
  parts.push(start === prev ? `${start + 1}` : `${start + 1}-${prev + 1}`);
  return parts.join('_');
}

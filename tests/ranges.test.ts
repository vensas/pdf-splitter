import { describe, expect, it } from 'vitest';
import { parseRanges, formatPageLabel } from '../src/ranges';

describe('parseRanges', () => {
  it('parses a single page', () => {
    expect(parseRanges('3', 10)).toEqual([[2]]);
  });

  it('parses a simple range', () => {
    expect(parseRanges('1-3', 10)).toEqual([[0, 1, 2]]);
  });

  it('parses mixed pages and ranges into separate groups', () => {
    expect(parseRanges('1-2, 5, 8-9', 10)).toEqual([[0, 1], [4], [7, 8]]);
  });

  it('tolerates extra whitespace and empty parts', () => {
    expect(parseRanges('  1 - 2 ,, 4 ', 10)).toEqual([[0, 1], [3]]);
  });

  it('accepts a single-page range like 4-4', () => {
    expect(parseRanges('4-4', 10)).toEqual([[3]]);
  });

  it('rejects empty input', () => {
    expect(() => parseRanges('', 10)).toThrow(/at least one page/i);
    expect(() => parseRanges('  , ,', 10)).toThrow(/at least one page/i);
  });

  it('rejects malformed parts', () => {
    expect(() => parseRanges('abc', 10)).toThrow(/not a valid/i);
    expect(() => parseRanges('1-2-3', 10)).toThrow(/not a valid/i);
    expect(() => parseRanges('-2', 10)).toThrow(/not a valid/i);
  });

  it('rejects page numbers below 1', () => {
    expect(() => parseRanges('0', 10)).toThrow(/start at 1/i);
    expect(() => parseRanges('0-3', 10)).toThrow(/start at 1/i);
  });

  it('rejects reversed ranges with a helpful hint', () => {
    expect(() => parseRanges('5-2', 10)).toThrow(/2-5/);
  });

  it('rejects pages beyond the document length', () => {
    expect(() => parseRanges('11', 10)).toThrow(/10 pages/);
    expect(() => parseRanges('2', 1)).toThrow(/1 page\b/);
  });
});

describe('formatPageLabel', () => {
  it('formats a single page', () => {
    expect(formatPageLabel([2])).toBe('3');
  });

  it('formats consecutive pages as a range', () => {
    expect(formatPageLabel([0, 1, 2])).toBe('1-3');
  });

  it('formats mixed runs and singles', () => {
    expect(formatPageLabel([0, 1, 2, 4, 6, 7])).toBe('1-3_5_7-8');
  });

  it('sorts unordered input', () => {
    expect(formatPageLabel([4, 0, 1])).toBe('1-2_5');
  });

  it('returns an empty string for no pages', () => {
    expect(formatPageLabel([])).toBe('');
  });
});

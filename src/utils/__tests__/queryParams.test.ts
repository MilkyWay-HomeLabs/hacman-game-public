import { describe, expect, it } from 'vitest';
import {
  isValidGalleryId,
  parseGameEntryParams,
  type ParseEntryResult,
} from '../queryParams';

const VALID_ID = '5250215a-521f-4a8b-aba9-c8325cf47615';

function expectOk(result: ParseEntryResult): Extract<ParseEntryResult, { ok: true }> {
  if (!result.ok) throw new Error(`expected ok result, got error: ${result.error}`);
  return result;
}

describe('isValidGalleryId', () => {
  it('accepts a well-formed UUID regardless of case', () => {
    expect(isValidGalleryId(VALID_ID)).toBe(true);
    expect(isValidGalleryId(VALID_ID.toUpperCase())).toBe(true);
  });

  it('rejects non-UUID strings', () => {
    expect(isValidGalleryId('not-a-uuid')).toBe(false);
    expect(isValidGalleryId('1234')).toBe(false);
    expect(isValidGalleryId('')).toBe(false);
  });
});

describe('parseGameEntryParams', () => {
  it('parses a valid galleryId and single-encoded title', () => {
    const result = expectOk(parseGameEntryParams(`?galleryId=${VALID_ID}&title=Gallery%201`));
    expect(result.params.galleryId).toBe(VALID_ID);
    expect(result.params.title).toBe('Gallery 1');
  });

  it('collapses a double-encoded title', () => {
    const result = expectOk(parseGameEntryParams(`?galleryId=${VALID_ID}&title=Gallery%252039`));
    expect(result.params.title).toBe('Gallery 39');
  });

  it('defaults a missing title to an empty string', () => {
    const result = expectOk(parseGameEntryParams(`?galleryId=${VALID_ID}`));
    expect(result.params.title).toBe('');
  });

  it('leaves a literal percent in the title untouched', () => {
    const result = expectOk(parseGameEntryParams(`?galleryId=${VALID_ID}&title=100%25`));
    expect(result.params.title).toBe('100%');
  });

  it('does not throw on a malformed percent sequence in the title', () => {
    const result = expectOk(parseGameEntryParams(`?galleryId=${VALID_ID}&title=bad%2`));
    expect(result.params.title).toBe('bad%2');
  });

  it('returns a missing-gallery-id error when galleryId is absent', () => {
    const result = parseGameEntryParams('?title=Whatever');
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toBe('missing-gallery-id');
  });

  it('returns an invalid-gallery-id error for a non-UUID galleryId', () => {
    const result = parseGameEntryParams('?galleryId=nope');
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toBe('invalid-gallery-id');
  });

  it('accepts an uppercase UUID and preserves its casing', () => {
    const upper = VALID_ID.toUpperCase();
    const result = expectOk(parseGameEntryParams(`?galleryId=${upper}`));
    expect(result.params.galleryId).toBe(upper);
  });
});

// Parsing of the game entry URL: `/play?galleryId=<uuid>&title=<name>`.
//
// `galleryId` is a required UUID. `title` is human-readable and, per the observed entry
// links, may be DOUBLE-encoded (e.g. `Gallery%252039`), so it is decoded defensively.

export interface GameEntryParams {
  galleryId: string;
  title: string;
}

export type QueryParamError = 'missing-gallery-id' | 'invalid-gallery-id';

export type ParseEntryResult =
  | { ok: true; params: GameEntryParams }
  | { ok: false; error: QueryParamError; message: string };

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** True when `value` is a syntactically valid UUID (any version, case-insensitive). */
export function isValidGalleryId(value: string): boolean {
  return UUID_RE.test(value);
}

/**
 * Decode one more percent-encoding layer, but only when the value still looks encoded
 * and decoding succeeds — so already-decoded or literal-`%` titles are left untouched.
 */
function safeDecodeOnce(value: string): string {
  if (!/%[0-9a-fA-F]{2}/.test(value)) return value;
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

/**
 * Parse and validate the game entry parameters from a query string.
 * `URLSearchParams` performs the first decode; `title` gets one extra safe decode to
 * collapse double-encoding. Returns a discriminated result so callers can render a
 * clear error screen for a missing/invalid `galleryId`.
 */
export function parseGameEntryParams(
  search: string = typeof window !== 'undefined' ? window.location.search : '',
): ParseEntryResult {
  const params = new URLSearchParams(search);

  const rawGalleryId = params.get('galleryId');
  if (!rawGalleryId) {
    return {
      ok: false,
      error: 'missing-gallery-id',
      message: 'Missing required "galleryId" parameter.',
    };
  }

  const galleryId = rawGalleryId.trim();
  if (!isValidGalleryId(galleryId)) {
    return {
      ok: false,
      error: 'invalid-gallery-id',
      message: `"${galleryId}" is not a valid gallery id.`,
    };
  }

  const title = safeDecodeOnce(params.get('title') ?? '').trim();

  return { ok: true, params: { galleryId, title } };
}

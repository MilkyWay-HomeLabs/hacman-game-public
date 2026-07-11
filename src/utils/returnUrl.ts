// Build the "return to Nebula" URL used after a game finishes.
//
// Security: this value is assigned to `window.location.href`, so it must never be an
// attacker-controlled destination. Only URLs on the allowed host (milkyway.test and its
// subdomains, http/https) are accepted; anything else falls back to the configured Nebula
// URL and finally to a safe host root — preventing an open redirect via `document.referrer`.

const DEFAULT_ALLOWED_HOST = 'milkyway.test';

export interface BuildReturnUrlParams {
  /** Typically `document.referrer` — the page the player came from. */
  referrer?: string | null;
  /** Configured fallback (e.g. `VITE_NEBULA_RETURN_URL`). */
  fallbackUrl?: string | null;
  /** Appended to the fallback URL as `galleryId`. */
  galleryId?: string | null;
  /** Host allow-list root; defaults to `milkyway.test`. */
  allowedHost?: string;
}

function safeParse(url: string | null | undefined): URL | null {
  if (!url) return null;
  try {
    return new URL(url);
  } catch {
    return null;
  }
}

function isAllowedHost(url: URL, allowedHost: string): boolean {
  if (url.protocol !== 'https:' && url.protocol !== 'http:') return false;
  return url.hostname === allowedHost || url.hostname.endsWith(`.${allowedHost}`);
}

/**
 * Resolve where to send the player after the game.
 * Preference order: a same-host `referrer` → the configured fallback (+ `galleryId`) →
 * a safe `https://<allowedHost>/` root. Never returns an off-host URL.
 */
export function buildReturnUrl({
  referrer,
  fallbackUrl,
  galleryId,
  allowedHost = DEFAULT_ALLOWED_HOST,
}: BuildReturnUrlParams): string {
  // 1) The referrer, when it's on the allowed host — returns the player to the gallery.
  const ref = safeParse(referrer);
  if (ref && isAllowedHost(ref, allowedHost)) {
    return ref.toString();
  }

  // 2) The configured Nebula return URL, with the gallery id appended.
  const fallback = safeParse(fallbackUrl);
  if (fallback && isAllowedHost(fallback, allowedHost)) {
    if (galleryId) fallback.searchParams.set('galleryId', galleryId);
    return fallback.toString();
  }

  // 3) Last resort: a safe root on the allowed host (never an off-host destination).
  return `https://${allowedHost}/`;
}

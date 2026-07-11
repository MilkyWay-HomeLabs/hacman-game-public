import { describe, expect, it } from 'vitest';
import { buildReturnUrl } from '../returnUrl';

const FALLBACK = 'https://milkyway.test/nebula/app/';
const GALLERY = '5250215a-521f-4a8b-aba9-c8325cf47615';

describe('buildReturnUrl', () => {
  it('returns the referrer when it is on the allowed host', () => {
    const referrer = 'https://milkyway.test/nebula/app/gallery/5';
    expect(buildReturnUrl({ referrer, fallbackUrl: FALLBACK, galleryId: GALLERY })).toBe(referrer);
  });

  it('accepts a referrer on an allowed subdomain', () => {
    const referrer = 'https://dev.milkyway.test/nebula/app/';
    expect(buildReturnUrl({ referrer, fallbackUrl: FALLBACK })).toBe(referrer);
  });

  it('falls back to the configured URL with galleryId when the referrer is empty', () => {
    const url = new URL(buildReturnUrl({ referrer: '', fallbackUrl: FALLBACK, galleryId: GALLERY }));
    expect(url.origin + url.pathname).toBe('https://milkyway.test/nebula/app/');
    expect(url.searchParams.get('galleryId')).toBe(GALLERY);
  });

  it('ignores a foreign-host referrer (no open redirect) and uses the fallback', () => {
    const result = buildReturnUrl({
      referrer: 'https://evil.example.com/steal',
      fallbackUrl: FALLBACK,
      galleryId: GALLERY,
    });
    expect(new URL(result).hostname).toBe('milkyway.test');
    expect(new URL(result).searchParams.get('galleryId')).toBe(GALLERY);
  });

  it('rejects a look-alike host that merely ends with the allowed name', () => {
    const result = buildReturnUrl({
      referrer: 'https://notmilkyway.test/x',
      fallbackUrl: FALLBACK,
    });
    expect(new URL(result).hostname).toBe('milkyway.test');
  });

  it('ignores a javascript: referrer', () => {
    const result = buildReturnUrl({
      referrer: 'javascript:alert(1)',
      fallbackUrl: FALLBACK,
    });
    expect(result.startsWith('https://milkyway.test')).toBe(true);
  });

  it('falls back to a safe host root when both referrer and fallback are unusable', () => {
    expect(buildReturnUrl({ referrer: 'https://evil.com', fallbackUrl: 'https://also-evil.com' })).toBe(
      'https://milkyway.test/',
    );
    expect(buildReturnUrl({ referrer: null, fallbackUrl: null })).toBe('https://milkyway.test/');
  });

  it('respects a custom allowed host', () => {
    const referrer = 'https://example.test/back';
    expect(buildReturnUrl({ referrer, fallbackUrl: null, allowedHost: 'example.test' })).toBe(referrer);
  });
});

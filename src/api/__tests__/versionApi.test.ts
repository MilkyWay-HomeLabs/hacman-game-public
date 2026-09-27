import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { getAppVersion, PACKAGE_VERSION } from '../versionApi';

const BASE = 'https://api.example.test/hacman/api';

function jsonResponse(data: unknown, status = 200): Response {
  const bodyless = data === null || status === 204;
  return new Response(bodyless ? null : JSON.stringify(data), {
    status,
    headers: bodyless ? undefined : { 'content-type': 'application/json' },
  });
}

function fetchMock() {
  const mock = vi.fn<typeof fetch>();
  vi.stubGlobal('fetch', mock);
  return mock;
}

beforeEach(() => {
  vi.stubEnv('VITE_API_BASE_URL', BASE);
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('PACKAGE_VERSION', () => {
  it('is injected from package.json at build time', () => {
    expect(PACKAGE_VERSION).toMatch(/^\d+\.\d+\.\d+/);
  });
});

describe('getAppVersion', () => {
  it('requests the public version endpoint', async () => {
    const mock = fetchMock();
    mock.mockResolvedValue(jsonResponse({ version: '2.3.4' }));

    await getAppVersion();

    expect(mock.mock.calls[0][0]).toBe(`${BASE}/v1/version`);
  });

  it('returns the version from an object response', async () => {
    const mock = fetchMock();
    mock.mockResolvedValue(jsonResponse({ version: '2.3.4' }));

    expect(await getAppVersion()).toBe('2.3.4');
  });

  it('returns the version from a bare string response', async () => {
    const mock = fetchMock();
    mock.mockResolvedValue(jsonResponse('9.9.9'));

    expect(await getAppVersion()).toBe('9.9.9');
  });

  it('falls back to PACKAGE_VERSION when the API errors', async () => {
    const mock = fetchMock();
    mock.mockResolvedValue(jsonResponse({ message: 'down' }, 500));

    expect(await getAppVersion()).toBe(PACKAGE_VERSION);
  });

  it('falls back to PACKAGE_VERSION on a network failure', async () => {
    const mock = fetchMock();
    mock.mockRejectedValue(new TypeError('Failed to fetch'));

    expect(await getAppVersion()).toBe(PACKAGE_VERSION);
  });

  it('falls back to PACKAGE_VERSION when the payload lacks a version', async () => {
    const mock = fetchMock();
    mock.mockResolvedValue(jsonResponse({ build: 'abc' }));

    expect(await getAppVersion()).toBe(PACKAGE_VERSION);
  });
});

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { httpGet, httpPost, request, setUnauthorizedHandler } from '../http';
import { ApiError } from '../types';

const BASE = 'https://api.example.test/hacman/api';

function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json' },
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
  setUnauthorizedHandler(null);
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('request URL + defaults', () => {
  it('joins base URL and path without double slashes and sets cookie/Accept defaults', async () => {
    const mock = fetchMock();
    mock.mockResolvedValue(jsonResponse({ ok: true }));

    await request('/v1/version');

    const [url, init] = mock.mock.calls[0];
    expect(url).toBe(`${BASE}/v1/version`);
    expect(init?.credentials).toBe('include');
    const headers = init?.headers as Record<string, string>;
    expect(headers.Accept).toBe('application/json');
    // GET without a body must not advertise a JSON content type.
    expect(headers['Content-Type']).toBeUndefined();
    // Cookie auth only — never a manual Authorization header.
    expect(headers.Authorization).toBeUndefined();
  });

  it('passes absolute URLs through unchanged', async () => {
    const mock = fetchMock();
    mock.mockResolvedValue(jsonResponse({}));

    await request('https://other.host/thing');

    expect(mock.mock.calls[0][0]).toBe('https://other.host/thing');
  });
});

describe('successful responses', () => {
  it('returns parsed JSON on 200', async () => {
    const mock = fetchMock();
    mock.mockResolvedValue(jsonResponse({ version: '1.0.1' }));

    const data = await httpGet<{ version: string }>('/v1/version');

    expect(data).toEqual({ version: '1.0.1' });
  });

  it('returns null for an empty (204) body', async () => {
    const mock = fetchMock();
    mock.mockResolvedValue(new Response(null, { status: 204 }));

    const data = await request('/v1/level-scores', { method: 'POST' });

    expect(data).toBeNull();
  });

  it('serializes a JSON body and sets Content-Type on POST', async () => {
    const mock = fetchMock();
    mock.mockResolvedValue(jsonResponse({ accepted: true }, 201));

    const body = { galleryId: 'g-1', difficulty: 'EASY', timeMs: 1234 };
    await httpPost('/v1/level-scores', body);

    const [, init] = mock.mock.calls[0];
    expect(init?.method).toBe('POST');
    expect(init?.body).toBe(JSON.stringify(body));
    expect((init?.headers as Record<string, string>)['Content-Type']).toBe('application/json');
  });
});

describe('error responses', () => {
  it('throws ApiError with status and body on 400', async () => {
    const mock = fetchMock();
    mock.mockResolvedValue(jsonResponse({ message: 'Bad gallery id' }, 400));

    const err = await request('/v1/maze/levels/bad').catch((e: unknown) => e);

    expect(err).toBeInstanceOf(ApiError);
    expect((err as ApiError).status).toBe(400);
    expect((err as ApiError).message).toBe('Bad gallery id');
    expect((err as ApiError).body).toEqual({ message: 'Bad gallery id' });
  });

  it('throws ApiError with a default message on 500 without a message field', async () => {
    const mock = fetchMock();
    mock.mockResolvedValue(jsonResponse({}, 500));

    const err = await request('/v1/version').catch((e: unknown) => e);

    expect(err).toBeInstanceOf(ApiError);
    expect((err as ApiError).status).toBe(500);
    expect((err as ApiError).message).toBe('Request failed with status 500');
  });

  it('flags transport failures as network errors with status 0', async () => {
    const mock = fetchMock();
    mock.mockRejectedValue(new TypeError('Failed to fetch'));

    const err = await request('/v1/version').catch((e: unknown) => e);

    expect(err).toBeInstanceOf(ApiError);
    expect((err as ApiError).status).toBe(0);
    expect((err as ApiError).isNetworkError).toBe(true);
    expect((err as ApiError).message).toBe('Failed to fetch');
  });
});

describe('401 handling', () => {
  it('invokes the registered unauthorized handler and still throws', async () => {
    const mock = fetchMock();
    mock.mockResolvedValue(jsonResponse({ message: 'expired' }, 401));
    const handler = vi.fn();
    setUnauthorizedHandler(handler);

    const err = await request('/v1/maze/levels/g-1').catch((e: unknown) => e);

    expect(handler).toHaveBeenCalledOnce();
    expect((err as ApiError).status).toBe(401);
  });

  it('does not swallow the 401 if the handler throws', async () => {
    const mock = fetchMock();
    mock.mockResolvedValue(jsonResponse({}, 401));
    setUnauthorizedHandler(() => {
      throw new Error('refresh failed');
    });

    const err = await request('/v1/maze/levels/g-1').catch((e: unknown) => e);

    expect(err).toBeInstanceOf(ApiError);
    expect((err as ApiError).status).toBe(401);
  });

  it('does not call the handler on a 200 response', async () => {
    const mock = fetchMock();
    mock.mockResolvedValue(jsonResponse({ ok: true }));
    const handler = vi.fn();
    setUnauthorizedHandler(handler);

    await request('/v1/version');

    expect(handler).not.toHaveBeenCalled();
  });
});

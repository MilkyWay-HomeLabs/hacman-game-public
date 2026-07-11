// Base HTTP client for the Hacman REST API.
//
// Authentication is carried entirely by httpOnly cookies on `milkyway.test`, so every
// request uses `credentials: 'include'` and NEVER sets an Authorization header — the
// browser attaches the cookies automatically. Non-2xx responses and transport failures
// are normalized into `ApiError`.

import { ApiError, type RequestOptions } from './types';

type UnauthorizedHandler = () => void | Promise<void>;

let unauthorizedHandler: UnauthorizedHandler | null = null;

/**
 * Register a handler invoked whenever the API answers `401 Unauthorized`.
 * Intended for token refresh / redirect-to-Nebula wiring (added in a later phase).
 * Pass `null` to clear it.
 */
export function setUnauthorizedHandler(handler: UnauthorizedHandler | null): void {
  unauthorizedHandler = handler;
}

/** Trailing-slash-safe join of the configured API base URL with a request path. */
function buildUrl(path: string): string {
  if (/^https?:\/\//i.test(path)) return path;
  const base = (import.meta.env.VITE_API_BASE_URL ?? '').replace(/\/+$/, '');
  const rel = path.replace(/^\/+/, '');
  return `${base}/${rel}`;
}

async function parseBody(response: Response): Promise<unknown> {
  const text = await response.text();
  if (text.length === 0) return null;

  const contentType = response.headers.get('content-type') ?? '';
  if (contentType.includes('application/json')) {
    try {
      return JSON.parse(text) as unknown;
    } catch {
      // Malformed JSON: fall back to the raw text rather than throwing here.
      return text;
    }
  }
  return text;
}

function errorMessage(status: number, payload: unknown): string {
  if (payload && typeof payload === 'object') {
    const record = payload as Record<string, unknown>;
    if (typeof record.message === 'string') return record.message;
    if (typeof record.error === 'string') return record.error;
  }
  return `Request failed with status ${status}`;
}

/**
 * Perform a JSON request against the Hacman API and return the parsed body.
 * @throws {ApiError} on any non-2xx response or transport failure.
 */
export async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, headers, signal } = options;

  const finalHeaders: Record<string, string> = {
    Accept: 'application/json',
    ...headers,
  };

  const init: RequestInit = {
    method,
    credentials: 'include', // send httpOnly auth cookies with every request
    headers: finalHeaders,
    signal,
  };

  if (body !== undefined) {
    finalHeaders['Content-Type'] = 'application/json';
    init.body = JSON.stringify(body);
  }

  let response: Response;
  try {
    response = await fetch(buildUrl(path), init);
  } catch (cause) {
    throw new ApiError({
      status: 0,
      message: cause instanceof Error ? cause.message : 'Network request failed',
      isNetworkError: true,
    });
  }

  if (response.status === 401 && unauthorizedHandler) {
    try {
      await unauthorizedHandler();
    } catch {
      // A failing handler must not mask the original 401 below.
    }
  }

  const payload = await parseBody(response);

  if (!response.ok) {
    throw new ApiError({
      status: response.status,
      message: errorMessage(response.status, payload),
      body: payload,
    });
  }

  return payload as T;
}

export function httpGet<T>(
  path: string,
  options?: Omit<RequestOptions, 'method' | 'body'>,
): Promise<T> {
  return request<T>(path, { ...options, method: 'GET' });
}

export function httpPost<T>(
  path: string,
  body?: unknown,
  options?: Omit<RequestOptions, 'method' | 'body'>,
): Promise<T> {
  return request<T>(path, { ...options, method: 'POST', body });
}

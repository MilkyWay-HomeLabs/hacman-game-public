// Shared types for the Hacman REST API client.

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export interface ApiErrorInit {
  /** HTTP status code; `0` for network/transport failures. */
  status: number;
  message: string;
  /** Parsed response body, when available. */
  body?: unknown;
  /** True when the request never reached the server (offline, DNS, CORS). */
  isNetworkError?: boolean;
}

/**
 * Error thrown for every non-2xx response and for transport failures.
 * Carries the HTTP status and the parsed body so callers can branch on them.
 */
export class ApiError extends Error {
  readonly status: number;
  readonly body?: unknown;
  readonly isNetworkError: boolean;

  constructor(init: ApiErrorInit) {
    super(init.message);
    this.name = 'ApiError';
    this.status = init.status;
    this.body = init.body;
    this.isNetworkError = init.isNetworkError ?? false;
    // Restore prototype chain for `instanceof` across transpilation targets.
    Object.setPrototypeOf(this, ApiError.prototype);
  }
}

export interface RequestOptions {
  method?: HttpMethod;
  /** JSON-serializable request body; sets `Content-Type: application/json`. */
  body?: unknown;
  /** Extra headers merged over the defaults. */
  headers?: Record<string, string>;
  /** AbortSignal for cancellation/timeout. */
  signal?: AbortSignal;
}

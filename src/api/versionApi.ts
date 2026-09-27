// App version client. Prefers the live value from `GET /v1/version` (public endpoint)
// and falls back to the build-time package.json version when the API is unreachable.

import { httpGet } from './http';

/** Build-time version from package.json; the offline/error fallback for the UI. */
export const PACKAGE_VERSION: string = __APP_VERSION__;

interface VersionResponse {
  version?: string;
}

/**
 * Fetch the application version for display in the UI.
 * Never rejects: any HTTP/transport failure or unexpected shape yields the
 * build-time `PACKAGE_VERSION`.
 */
export async function getAppVersion(): Promise<string> {
  try {
    const data = await httpGet<VersionResponse | string>('/v1/version');
    if (typeof data === 'string' && data.length > 0) {
      return data;
    }
    if (data && typeof data === 'object' && typeof data.version === 'string' && data.version) {
      return data.version;
    }
    return PACKAGE_VERSION;
  } catch {
    return PACKAGE_VERSION;
  }
}

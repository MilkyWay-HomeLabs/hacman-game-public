import { useEffect, useState } from 'react';
import { getAppVersion, PACKAGE_VERSION } from '../api/versionApi';

/**
 * Resolve the application version for display in the UI.
 *
 * Renders immediately with the build-time `PACKAGE_VERSION` (from package.json),
 * then upgrades to the live value from `GET /v1/version` once it resolves.
 * `getAppVersion` never rejects, so the fallback is the worst case.
 */
export function useAppVersion(): string {
  const [version, setVersion] = useState<string>(PACKAGE_VERSION);

  useEffect(() => {
    let active = true;
    void getAppVersion().then((resolved) => {
      if (active) {
        setVersion(resolved);
      }
    });
    return () => {
      active = false;
    };
  }, []);

  return version;
}

export default useAppVersion;

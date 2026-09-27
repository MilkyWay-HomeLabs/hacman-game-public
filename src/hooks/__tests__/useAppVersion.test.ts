import { renderHook, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

const getAppVersion = vi.fn<() => Promise<string>>();

vi.mock('../../api/versionApi', () => ({
  PACKAGE_VERSION: '1.0.1',
  getAppVersion: () => getAppVersion(),
}));

// Imported after the mock so it binds to the mocked module.
import { useAppVersion } from '../useAppVersion';

afterEach(() => {
  vi.clearAllMocks();
});

describe('useAppVersion', () => {
  it('starts from the build-time PACKAGE_VERSION fallback', () => {
    getAppVersion.mockReturnValue(new Promise(() => {})); // never resolves
    const { result } = renderHook(() => useAppVersion());
    expect(result.current).toBe('1.0.1');
  });

  it('upgrades to the live version once the API resolves', async () => {
    getAppVersion.mockResolvedValue('2.3.4');
    const { result } = renderHook(() => useAppVersion());
    await waitFor(() => expect(result.current).toBe('2.3.4'));
  });

  it('does not update state after unmount', async () => {
    let resolve!: (v: string) => void;
    getAppVersion.mockReturnValue(new Promise<string>((r) => (resolve = r)));

    const { result, unmount } = renderHook(() => useAppVersion());
    unmount();
    resolve('9.9.9');

    // No React "state update on unmounted component" warning; value stays at fallback.
    await Promise.resolve();
    expect(result.current).toBe('1.0.1');
  });
});

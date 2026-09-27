import React from 'react';
import {act, cleanup, render} from '@testing-library/react';
import {afterEach, describe, expect, it, vi} from 'vitest';
import {usePlayerEffects} from '../usePlayerEffects';

type Api = ReturnType<typeof usePlayerEffects>;

afterEach(() => {
    cleanup();
    vi.useRealTimers();
    vi.restoreAllMocks();
});

/**
 * Helper to mount a component that uses the hook and returns the API via onReady.
 */
function mountHook(initial: Map<string, number> | undefined, onReady: (api: Api) => void) {
    function TestComp({initialProp, cb}: { initialProp?: Map<string, number>; cb: (api: Api) => void }) {
        const api = usePlayerEffects(initialProp);
        React.useEffect(() => {
            cb(api);
        }, [api, cb]);
        return null;
    }

    return render(React.createElement(TestComp, {initialProp: initial, cb: onReady}));
}

describe('usePlayerEffects (vitest)', () => {
    it('adds a new effect with the correct expiry time', () => {
        vi.useFakeTimers();
        const base = 1_000_000;
        vi.setSystemTime(base);

        let api!: Api;
        act(() => {
            mountHook(undefined, (a) => (api = a));
        });

        act(() => {
            api.addPlayerEffect('speedBoost', 5000);
        });

        const expiry = api.playerEffects.get('speedBoost');
        expect(expiry).toBe(base + 5000);
    });

    it('returns true for active effects', () => {
        vi.useFakeTimers();
        const base = 2_000_000;
        vi.setSystemTime(base);

        let api!: Api;
        act(() => {
            mountHook(undefined, (a) => (api = a));
        });

        act(() => {
            api.addPlayerEffect('shield', 5000);
        });

        expect(api.hasPlayerEffect('shield')).toBe(true);
    });

    it('returns false for expired effects after time advances', () => {
        vi.useFakeTimers();
        const base = 3_000_000;
        vi.setSystemTime(base);

        let api!: Api;
        act(() => {
            mountHook(undefined, (a) => (api = a));
        });

        act(() => {
            api.addPlayerEffect('invisibility', 100);
        });

        // advance time beyond expiry and run the cleanup interval
        act(() => {
            vi.setSystemTime(base + 200);
            vi.advanceTimersByTime(300); // allow interval callback to run
        });

        expect(api.hasPlayerEffect('invisibility')).toBe(false);
        expect(api.playerEffects.has('invisibility')).toBe(false);
    });

    it('removes expired effects automatically via interval', () => {
        vi.useFakeTimers();
        const base = 4_000_000;
        vi.setSystemTime(base);

        let api!: Api;
        act(() => {
            mountHook(undefined, (a) => (api = a));
        });

        act(() => {
            api.addPlayerEffect('doubleDamage', 100);
        });

        // advance time a bit, but still before expiry -> should remain
        act(() => {
            vi.setSystemTime(base + 50);
            vi.advanceTimersByTime(50);
        });
        expect(api.playerEffects.has('doubleDamage')).toBe(true);

        // advance past expiry and let the interval run
        act(() => {
            vi.setSystemTime(base + 200);
            vi.advanceTimersByTime(300);
        });
        expect(api.playerEffects.has('doubleDamage')).toBe(false);
    });

    it('does not remove effects that are still active', () => {
        vi.useFakeTimers();
        const base = 5_000_000;
        vi.setSystemTime(base);

        let api!: Api;
        act(() => {
            mountHook(undefined, (a) => (api = a));
        });

        act(() => {
            api.addPlayerEffect('regen', 1000);
        });

        // advance timers by 500 ms (advancing timers also advances system time)
        act(() => {
            vi.advanceTimersByTime(500);
        });

        expect(api.playerEffects.has('regen')).toBe(true);
        expect(api.hasPlayerEffect('regen')).toBe(true);
    });

    it('handles adding effects with zero duration as immediately expired', () => {
        vi.useFakeTimers();
        const base = 6_000_000;
        vi.setSystemTime(base);

        let api!: Api;
        act(() => {
            mountHook(undefined, (a) => (api = a));
        });

        act(() => {
            api.addPlayerEffect('instantEffect', 0);
        });

        // allow an interval to run once
        act(() => {
            vi.advanceTimersByTime(300);
        });

        expect(api.hasPlayerEffect('instantEffect')).toBe(false);
        expect(api.playerEffects.has('instantEffect')).toBe(false);
    });

    it('respects a non-empty initial map and reports active effects', () => {
        vi.useFakeTimers();
        const base = 7_000_000;
        vi.setSystemTime(base);

        const initial = new Map<string, number>([['powerUp', base + 5000]]);
        let api!: Api;
        act(() => {
            mountHook(initial, (a) => (api = a));
        });

        expect(api.playerEffects.size).toBe(1);
        expect(api.hasPlayerEffect('powerUp')).toBe(true);

        // advance past expiry and let cleanup run
        act(() => {
            vi.setSystemTime(base + 6000);
            vi.advanceTimersByTime(500);
        });

        expect(api.playerEffects.has('powerUp')).toBe(false);
    });
});
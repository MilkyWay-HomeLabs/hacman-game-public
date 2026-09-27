import React from 'react';
import type {Dispatch, SetStateAction} from 'react';
import {act, cleanup, render} from '@testing-library/react';
import {afterEach, describe, expect, it, vi} from 'vitest';
import {useMagnet} from '../useMagnet';

afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
});

function mountHook(opts: {
    playerPosition: { x: number; y: number };
    hasPlayerEffect: (kind: string) => boolean;
    setActiveDots: Dispatch<SetStateAction<Set<string>>>;
    setCollectedDots: Dispatch<SetStateAction<number>>;
}) {
    function TestComp() {
        useMagnet(opts);
        return null;
    }

    return render(React.createElement(TestComp));
}

function createDotMocks(initialActive?: Iterable<string>) {
    let activeSet = new Set(initialActive ?? []);
    let collected = 0;

    const setActiveDots = vi.fn((updater: SetStateAction<Set<string>>) => {
        if (typeof updater === 'function') {
            activeSet = updater(activeSet);
        } else {
            activeSet = updater;
        }
    });

    const setCollectedDots = vi.fn((updater: SetStateAction<number>) => {
        if (typeof updater === 'function') {
            collected = updater(collected);
        } else {
            collected = updater;
        }
    });

    return {
        setActiveDots,
        setCollectedDots,
        getCollected: () => collected,
    };
}

describe('useMagnet', () => {
    it('removes dots within range when magnet effect is active', () => {
        const playerPosition = {x: 2, y: 2};
        const hasPlayerEffect = vi.fn().mockReturnValue(true);

        const {setActiveDots, setCollectedDots, getCollected} = createDotMocks(['1-1', '2-2', '3-3']);

        act(() => {
            mountHook({playerPosition, hasPlayerEffect, setActiveDots, setCollectedDots});
        });

        expect(setActiveDots).toHaveBeenCalled();
        expect(getCollected()).toBe(3);
    });

    it('does not remove dots if magnet effect is inactive', () => {
        const playerPosition = {x: 2, y: 2};
        const hasPlayerEffect = vi.fn().mockReturnValue(false);
        const {setActiveDots, setCollectedDots, getCollected} = createDotMocks();

        mountHook({playerPosition, hasPlayerEffect, setActiveDots, setCollectedDots});

        expect(setActiveDots).not.toHaveBeenCalled();
        expect(setCollectedDots).not.toHaveBeenCalled();
        expect(getCollected()).toBe(0);
    });

    it('does not remove dots outside the magnet range', () => {
        const playerPosition = {x: 0, y: 0};
        const hasPlayerEffect = vi.fn().mockReturnValue(true);

        const {setActiveDots, setCollectedDots, getCollected} = createDotMocks(['5-5', '6-6']);

        act(() => {
            mountHook({playerPosition, hasPlayerEffect, setActiveDots, setCollectedDots});
        });

        expect(setActiveDots).toHaveBeenCalled();
        expect(getCollected()).toBe(0);
    });

    it('clears the interval on unmount', () => {
        const playerPosition = {x: 2, y: 2};
        const hasPlayerEffect = vi.fn().mockReturnValue(true);
        const {setActiveDots, setCollectedDots} = createDotMocks();

        const {unmount} = mountHook({playerPosition, hasPlayerEffect, setActiveDots, setCollectedDots});

        const clearIntervalSpy = vi.spyOn(window, 'clearInterval');
        unmount();

        expect(clearIntervalSpy).toHaveBeenCalled();
    });

    it('handles empty active dots set gracefully', () => {
        const playerPosition = {x: 2, y: 2};
        const hasPlayerEffect = vi.fn().mockReturnValue(true);

        const {setActiveDots, setCollectedDots, getCollected} = createDotMocks();

        act(() => {
            mountHook({playerPosition, hasPlayerEffect, setActiveDots, setCollectedDots});
        });

        expect(setActiveDots).toHaveBeenCalled();
        expect(getCollected()).toBe(0);
    });
});
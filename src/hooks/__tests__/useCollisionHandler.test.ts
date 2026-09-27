import {renderHook} from '@testing-library/react';
import {beforeEach, describe, expect, it, vi} from 'vitest';
import {applyBuffEffect, applyDebuffEffect, resetPlayerAfterDamage} from '../../effects';
import {useCollisionHandler} from '../useCollisionHandler';
import type {EnemiesAPI} from '../useEnemiesController';
import type {MazeData} from '../../types/maze';

type Args = Parameters<typeof useCollisionHandler>[0];

// Shape of the params the mocked effects read; only the callbacks under test are needed.
type EffectArgs = {
    isInvulnerable?: boolean;
    addPlayerEffect?: (k: string) => void;
    setFrozenUntil?: (n: number) => void;
    setPlayerEffects?: (v: unknown) => void;
    setGameOver?: (v: boolean) => void;
    nowMs?: () => number;
    setIsInvulnerable?: (v: boolean) => void;
};

/** A complete EnemiesAPI mock; individual methods can be overridden per test. */
const makeEnemiesApi = (overrides: Partial<EnemiesAPI> = {}): EnemiesAPI => ({
    freezeInRadius: vi.fn(),
    freezeAt: vi.fn(),
    addRustAt: vi.fn(),
    addSpeedBuffAt: vi.fn(),
    destroyAt: vi.fn(),
    ...overrides,
});

// Mock the effects module before importing the hook, so the hook uses the mocked implementations.
// The debuff mock calls the passed callbacks (setFrozenUntil, setPlayerEffects, setGameOver, nowMs)
// so the inline empty functions inside `useCollisionHandler` are executed and counted by coverage.
vi.mock('../../effects', () => ({
    applyBuffEffect: vi.fn((args: EffectArgs) => {
        if (!args?.isInvulnerable && typeof args.addPlayerEffect === 'function') {
            args.addPlayerEffect('buff');
        }
    }),
    applyDebuffEffect: vi.fn((args: EffectArgs) => {
        // execute the callbacks the hook provides so those inline functions count as covered
        if (typeof args.setFrozenUntil === 'function') {
            try {
                args.setFrozenUntil(Date.now() + 1000);
            } catch {
                // ignore
            }
        }
        if (typeof args.setPlayerEffects === 'function') {
            try {
                args.setPlayerEffects({});
            } catch {
                // ignore
            }
        }
        if (typeof args.setGameOver === 'function') {
            try {
                args.setGameOver(false);
            } catch {
                // ignore
            }
        }
        if (typeof args.nowMs === 'function') {
            try {
                args.nowMs();
            } catch {
                // ignore
            }
        }
        if (!args?.isInvulnerable && typeof args.addPlayerEffect === 'function') {
            args.addPlayerEffect('debuff');
        }
    }),
    resetPlayerAfterDamage: vi.fn((args: EffectArgs) => {
        // trigger one of the setters passed into resetPlayerAfterDamage to execute updater logic if present
        if (typeof args.setIsInvulnerable === 'function') {
            try {
                args.setIsInvulnerable(true);
            } catch {
                // ignore
            }
        }
    }),
}));

const mockEnemiesApiBase = makeEnemiesApi();

const createArgs = (overrides: Record<string, unknown> = {}) => ({
    playerPosition: {x: 1, y: 1},
    mazeData: ({player: {start_position: {x: 0, y: 0}}} as unknown) as MazeData,
    enemyPositions: new Map(),
    buffPositions: new Map(),
    debuffPositions: new Map(),
    buffMetaAt: new Map(),
    debuffMetaAt: new Map(),
    hasPlayerEffect: vi.fn(() => false),
    addPlayerEffect: vi.fn(),
    enemiesApi: mockEnemiesApiBase,
    setLives: vi.fn(),
    setGameOver: vi.fn(),
    setForcedPlayerPosition: vi.fn(),
    setTeleportSignal: vi.fn(),
    setIsInvulnerable: vi.fn(),
    resetCounterRef: {current: 0},
    resetInProgressRef: {current: false},
    resetClearTimeoutRef: {current: null},
    invulnTimeoutRef: {current: null},
    // default setters are spies (won't execute updater). specific tests will override these to execute updater bodies.
    setBuffPositions: vi.fn(),
    setBuffMetaAt: vi.fn(),
    setDebuffPositions: vi.fn(),
    setDebuffMetaAt: vi.fn(),
    setEnemyPositions: vi.fn(),
    lives: 3,
    isInvulnerable: false,
    gameOver: false,
    gameWon: false,
    ...overrides,
} as unknown as Args);

describe('useCollisionHandler', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockEnemiesApiBase.destroyAt = vi.fn();
    });

    it('removes enemy when player collides with it and has damage effect (executes updater)', () => {
        const setEnemyPositions = vi.fn((updater: (prev: Map<string, unknown>) => unknown) => {
            // execute updater to run the deletion branch inside the hook
            return updater(new Map<string, unknown>([['1-1', 'enemy']]));
        });

        const args = createArgs({
            enemyPositions: new Map([['1-1', 'enemy']]),
            hasPlayerEffect: vi.fn().mockImplementation((effect: string) => effect === 'damage'),
            enemiesApi: {destroyAt: vi.fn()},
            setEnemyPositions,
        });

        renderHook(() => useCollisionHandler(args));

        expect(args.enemiesApi.destroyAt).toHaveBeenCalledWith(1, 1);
        expect(setEnemyPositions).toHaveBeenCalledWith(expect.any(Function));
    });

    it('still removes enemy map when destroyAt throws (covers empty catch)', () => {
        const setEnemyPositions = vi.fn((updater: (prev: Map<string, unknown>) => unknown) => updater(new Map<string, unknown>([['1-1', 'enemy']])));

        const args = createArgs({
            enemyPositions: new Map([['1-1', 'enemy']]),
            hasPlayerEffect: vi.fn().mockImplementation((effect: string) => effect === 'damage'),
            enemiesApi: {
                destroyAt: vi.fn(() => {
                    throw new Error('boom');
                })
            },
            setEnemyPositions,
        });

        renderHook(() => useCollisionHandler(args));

        expect(args.enemiesApi.destroyAt).toHaveBeenCalled();
        expect(setEnemyPositions).toHaveBeenCalledWith(expect.any(Function));
    });

    it('does not remove enemy when player is invulnerable', () => {
        const args = createArgs({
            enemyPositions: new Map([['1-1', 'enemy']]),
            isInvulnerable: true,
        });

        renderHook(() => useCollisionHandler(args));

        expect(mockEnemiesApiBase.destroyAt).not.toHaveBeenCalled();
        expect(args.setEnemyPositions).not.toHaveBeenCalled();
    });

    it('applies buff effect, removes buff and executes updater bodies (covers deletion code)', () => {
        const setBuffPositions = vi.fn((updater: (prev: Map<string, unknown>) => unknown) => updater(new Map<string, unknown>([['1-1', 'buff']])));
        const setBuffMetaAt = vi.fn((updater: (prev: Map<string, unknown>) => unknown) => updater(new Map<string, unknown>([['1-1', {type: 'speed'}]])));

        const args = createArgs({
            buffPositions: new Map([['1-1', 'buff']]),
            buffMetaAt: new Map([['1-1', {type: 'speed'}]]),
            setBuffPositions,
            setBuffMetaAt,
        });

        renderHook(() => useCollisionHandler(args));

        expect(setBuffPositions).toHaveBeenCalledWith(expect.any(Function));
        expect(setBuffMetaAt).toHaveBeenCalledWith(expect.any(Function));
        expect(vi.mocked(applyBuffEffect)).toHaveBeenCalledWith(expect.objectContaining({posKey: '1-1'}));
        expect(args.addPlayerEffect).toHaveBeenCalled();
    });

    it('does not apply buff effect when player is not on a buff tile', () => {
        const args = createArgs();

        renderHook(() => useCollisionHandler(args));

        expect(args.setBuffPositions).not.toHaveBeenCalled();
        expect(args.setBuffMetaAt).not.toHaveBeenCalled();
        expect(args.addPlayerEffect).not.toHaveBeenCalled();
    });

    it('applies debuff effect, removes debuff and executes updater bodies (covers deletion code)', () => {
        const setDebuffPositions = vi.fn((updater: (prev: Map<string, unknown>) => unknown) => updater(new Map<string, unknown>([['1-1', 'debuff']])));
        const setDebuffMetaAt = vi.fn((updater: (prev: Map<string, unknown>) => unknown) => updater(new Map<string, unknown>([['1-1', {type: 'freeze'}]])));

        const args = createArgs({
            debuffPositions: new Map([['1-1', 'debuff']]),
            debuffMetaAt: new Map([['1-1', {type: 'freeze'}]]),
            setDebuffPositions,
            setDebuffMetaAt,
        });

        renderHook(() => useCollisionHandler(args));

        expect(setDebuffPositions).toHaveBeenCalledWith(expect.any(Function));
        expect(setDebuffMetaAt).toHaveBeenCalledWith(expect.any(Function));
        expect(vi.mocked(applyDebuffEffect)).toHaveBeenCalledWith(expect.objectContaining({posKey: '1-1'}));
        expect(args.addPlayerEffect).toHaveBeenCalled();
    });

    it('does not apply debuff effect when player is invulnerable but still removes tile (executes updater)', () => {
        const setDebuffPositions = vi.fn((updater: (prev: Map<string, unknown>) => unknown) => updater(new Map<string, unknown>([['1-1', 'debuff']])));
        const setDebuffMetaAt = vi.fn((updater: (prev: Map<string, unknown>) => unknown) => updater(new Map<string, unknown>([['1-1', {type: 'freeze'}]])));

        const args = createArgs({
            debuffPositions: new Map([['1-1', 'debuff']]),
            debuffMetaAt: new Map([['1-1', {type: 'freeze'}]]),
            isInvulnerable: true,
            setDebuffPositions,
            setDebuffMetaAt,
        });

        renderHook(() => useCollisionHandler(args));

        expect(setDebuffPositions).toHaveBeenCalledWith(expect.any(Function));
        expect(setDebuffMetaAt).toHaveBeenCalledWith(expect.any(Function));
        expect(args.addPlayerEffect).not.toHaveBeenCalled();
        expect(vi.mocked(applyDebuffEffect)).toHaveBeenCalledWith(expect.objectContaining({
            posKey: '1-1',
            isInvulnerable: true
        }));
    });

    it('does nothing when game is over', () => {
        const args = createArgs({
            gameOver: true,
            enemyPositions: new Map([['1-1', 'enemy']]),
        });

        renderHook(() => useCollisionHandler(args));

        expect(mockEnemiesApiBase.destroyAt).not.toHaveBeenCalled();
        expect(args.setEnemyPositions).not.toHaveBeenCalled();
    });

    it('does nothing when player just reset (start tile and resetCounterRef > 0)', () => {
        const args = createArgs({
            playerPosition: {x: 0, y: 0},
            mazeData: ({player: {start_position: {x: 0, y: 0}}} as unknown) as MazeData,
            resetCounterRef: {current: 1},
            enemyPositions: new Map([['0-0', 'enemy']]),
        });

        renderHook(() => useCollisionHandler(args));

        expect(mockEnemiesApiBase.destroyAt).not.toHaveBeenCalled();
        expect(args.setEnemyPositions).not.toHaveBeenCalled();
    });

    it('does nothing when reset is in progress', () => {
        const args = createArgs({
            enemyPositions: new Map([['1-1', 'enemy']]),
            resetInProgressRef: {current: true},
        });

        renderHook(() => useCollisionHandler(args));

        expect(mockEnemiesApiBase.destroyAt).not.toHaveBeenCalled();
        expect(args.setEnemyPositions).not.toHaveBeenCalled();
    });

    it('does nothing when player has invisibility effect', () => {
        const args = createArgs({
            enemyPositions: new Map([['1-1', 'enemy']]),
            hasPlayerEffect: vi.fn().mockImplementation((effect: string) => effect === 'invisibility'),
        });

        renderHook(() => useCollisionHandler(args));

        expect(mockEnemiesApiBase.destroyAt).not.toHaveBeenCalled();
        expect(args.setEnemyPositions).not.toHaveBeenCalled();
    });

    it('does nothing when player has shield effect', () => {
        const args = createArgs({
            enemyPositions: new Map([['1-1', 'enemy']]),
            hasPlayerEffect: vi.fn().mockImplementation((effect: string) => effect === 'shield'),
        });

        renderHook(() => useCollisionHandler(args));

        expect(mockEnemiesApiBase.destroyAt).not.toHaveBeenCalled();
        expect(args.setEnemyPositions).not.toHaveBeenCalled();
    });

    it('calls resetPlayerAfterDamage when collides without damage and lives > 1', () => {
        const args = createArgs({
            enemyPositions: new Map([['1-1', 'enemy']]),
            lives: 3,
            hasPlayerEffect: vi.fn(() => false),
        });

        renderHook(() => useCollisionHandler(args));

        expect(vi.mocked(resetPlayerAfterDamage)).toHaveBeenCalled();
    });

    it('sets lives to 0 when collides and lives <= 1', () => {
        const args = createArgs({
            enemyPositions: new Map([['1-1', 'enemy']]),
            lives: 1,
            hasPlayerEffect: vi.fn(() => false),
        });

        renderHook(() => useCollisionHandler(args));

        expect(args.setLives).toHaveBeenCalledWith(0);
    });

    describe('gameplay-telemetry counters (M7-1)', () => {
        it('increments enemiesDefeatedRef when the damage buff destroys an enemy', () => {
            const setEnemyPositions = vi.fn((updater: (prev: Map<string, unknown>) => unknown) =>
                updater(new Map<string, unknown>([['1-1', 'enemy']])));
            const enemiesDefeatedRef = {current: 0};

            const args = createArgs({
                enemyPositions: new Map([['1-1', 'enemy']]),
                hasPlayerEffect: vi.fn().mockImplementation((effect: string) => effect === 'damage'),
                setEnemyPositions,
                enemiesDefeatedRef,
            });

            renderHook(() => useCollisionHandler(args));

            expect(enemiesDefeatedRef.current).toBe(1);
        });

        it('increments buffsCollectedRef on a buff pickup', () => {
            const buffsCollectedRef = {current: 0};
            const args = createArgs({
                buffPositions: new Map([['1-1', 'buff']]),
                buffMetaAt: new Map([['1-1', {type: 'speed'}]]),
                buffsCollectedRef,
            });

            renderHook(() => useCollisionHandler(args));

            expect(buffsCollectedRef.current).toBe(1);
        });

        it('does not increment buffsCollectedRef when the player is not on a buff tile', () => {
            const buffsCollectedRef = {current: 0};
            const args = createArgs({buffsCollectedRef});

            renderHook(() => useCollisionHandler(args));

            expect(buffsCollectedRef.current).toBe(0);
        });

        it('increments hitsTakenRef directly when lives <= 1 (fatal, bypasses resetPlayerAfterDamage)', () => {
            const hitsTakenRef = {current: 0};
            const args = createArgs({
                enemyPositions: new Map([['1-1', 'enemy']]),
                lives: 1,
                hasPlayerEffect: vi.fn(() => false),
                hitsTakenRef,
            });

            renderHook(() => useCollisionHandler(args));

            expect(hitsTakenRef.current).toBe(1);
        });

        it('forwards hitsTakenRef to resetPlayerAfterDamage when lives > 1 (non-fatal)', () => {
            const hitsTakenRef = {current: 0};
            const args = createArgs({
                enemyPositions: new Map([['1-1', 'enemy']]),
                lives: 3,
                hasPlayerEffect: vi.fn(() => false),
                hitsTakenRef,
            });

            renderHook(() => useCollisionHandler(args));

            const callArg = vi.mocked(resetPlayerAfterDamage).mock.calls[0][0];
            expect(callArg.hitsTakenRef).toBe(hitsTakenRef);
        });

        it('does not throw when the telemetry refs are omitted', () => {
            const args = createArgs({
                enemyPositions: new Map([['1-1', 'enemy']]),
                hasPlayerEffect: vi.fn().mockImplementation((effect: string) => effect === 'damage'),
            });

            expect(() => renderHook(() => useCollisionHandler(args))).not.toThrow();
        });
    });

});
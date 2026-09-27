import {beforeEach, describe, expect, it, vi} from 'vitest';
import {resetPlayerAfterDamage} from '../resetPlayerAfterDamage';
import {applyDebuffEffect} from '../applyDebuffEffect';
import type {MazeData} from '../../types/maze';

type DebuffParams = Parameters<typeof applyDebuffEffect>[0];

// mock must be declared before importing the tested module
vi.mock('../resetPlayerAfterDamage', () => ({resetPlayerAfterDamage: vi.fn()}));

describe('applyDebuffEffect', () => {
    const nowMs = () => Date.now();
    const mockAddPlayerEffect = vi.fn();
    const mockSetPlayerEffects = vi.fn();
    const mockSetGameOver = vi.fn();

    const mockSetLives = vi.fn();
    const mockSetFrozenUntil = vi.fn();
    const mockSetForcedPlayerPosition = vi.fn();
    const mockSetTeleportSignal = vi.fn();
    const mockSetIsInvulnerable = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
    });

    const createDefaultParams = (overrides: Record<string, unknown> = {}): DebuffParams => ({
        posKey: 'test-pos',
        debuffMetaAt: new Map(),
        debuffPositions: new Map(),
        mazeData: ({player: {start_position: {x: 1, y: 1}}} as unknown as MazeData),
        isInvulnerable: false,
        lives: 3,
        nowMs,
        hasPlayerEffect: vi.fn().mockReturnValue(false),
        addPlayerEffect: mockAddPlayerEffect,
        setLives: mockSetLives,
        setFrozenUntil: mockSetFrozenUntil,
        setPlayerEffects: mockSetPlayerEffects,
        setForcedPlayerPosition: mockSetForcedPlayerPosition,
        setTeleportSignal: mockSetTeleportSignal,
        setGameOver: mockSetGameOver,
        setIsInvulnerable: mockSetIsInvulnerable,
        resetCounterRef: {current: 0},
        resetInProgressRef: {current: false},
        resetClearTimeoutRef: {current: null},
        invulnTimeoutRef: {current: null},
        ...overrides,
    } as unknown as DebuffParams);

    it('applies poison effect when style matches poison', () => {
        const params = {
            ...createDefaultParams(),
            debuffPositions: new Map([['test-pos', 'poison']]),
        };
        applyDebuffEffect(params);
        expect(mockAddPlayerEffect).toHaveBeenCalledWith('poison', 6000);
    });

    it('does not apply any effect when no matching debuff is found', () => {
        const params = createDefaultParams();
        applyDebuffEffect(params);
        expect(mockAddPlayerEffect).not.toHaveBeenCalled();
    });

    it('reduces player effects duration by 40% for drain debuff', () => {
        const params = {
            ...createDefaultParams(),
            debuffPositions: new Map([['test-pos', 'drain']]),
            setPlayerEffects: mockSetPlayerEffects,
            nowMs: () => 1000,
        };
        const currentEffects = new Map([['effect1', 5000], ['effect2', 3000]]);
        mockSetPlayerEffects.mockImplementation((callback: (prev: Map<string, number>) => unknown) => callback(currentEffects));
        applyDebuffEffect(params);
        expect(mockSetPlayerEffects).toHaveBeenCalled();
        expect(mockSetPlayerEffects).toHaveBeenCalledWith(expect.any(Function));
    });

    it('resets player via resetPlayerAfterDamage when spike debuff and lives > 1', () => {
        const params = {
            ...createDefaultParams({
                debuffPositions: new Map([['test-pos', 'spike']]),
                lives: 2,
                hasPlayerEffect: vi.fn().mockReturnValue(false),
            }),
        };

        applyDebuffEffect(params);

        expect(resetPlayerAfterDamage).toHaveBeenCalled();

        const callArg = vi.mocked(resetPlayerAfterDamage).mock.calls[0][0];
        expect(callArg).toBeDefined();
        expect(callArg.setLives).toBe(mockSetLives);
        expect(callArg.setForcedPlayerPosition).toBe(mockSetForcedPlayerPosition);
        expect(callArg.setTeleportSignal).toBe(mockSetTeleportSignal);
    });

    it('forwards hitsTakenRef to resetPlayerAfterDamage for a non-fatal spike hit (M7-1 telemetry)', () => {
        const hitsTakenRef = {current: 0};
        const params = {
            ...createDefaultParams({
                debuffPositions: new Map([['test-pos', 'spike']]),
                lives: 2,
                hitsTakenRef,
            }),
        };

        applyDebuffEffect(params);

        const callArg = vi.mocked(resetPlayerAfterDamage).mock.calls[0][0];
        expect(callArg.hitsTakenRef).toBe(hitsTakenRef);
    });

    it('increments hitsTakenRef directly for a fatal spike hit (bypasses resetPlayerAfterDamage)', () => {
        const hitsTakenRef = {current: 0};
        const params = {
            ...createDefaultParams({
                debuffPositions: new Map([['test-pos', 'spike']]),
                lives: 1,
                hitsTakenRef,
            }),
        };

        applyDebuffEffect(params);

        expect(resetPlayerAfterDamage).not.toHaveBeenCalled();
        expect(hitsTakenRef.current).toBe(1);
    });

    it('ends the game when lives reach zero for spike debuff', () => {
        const params = {
            ...createDefaultParams(),
            debuffPositions: new Map([['test-pos', 'spike']]),
            lives: 1,
        };
        applyDebuffEffect(params);

        expect(mockSetLives).toHaveBeenCalled();
        const firstLivesArg = mockSetLives.mock.calls[0][0];
        if (typeof firstLivesArg === 'function') {
            expect(firstLivesArg(1)).toBe(0);
        } else {
            expect(firstLivesArg).toBe(0);
        }

        expect(mockSetGameOver).toHaveBeenCalledWith(true);
    });

    it('freezes the player for freeze debuff', () => {
        const params = {
            ...createDefaultParams(),
            debuffPositions: new Map([['test-pos', 'freeze']]),
        };
        applyDebuffEffect(params);
        expect(mockSetFrozenUntil).toHaveBeenCalledWith(expect.any(Number));
    });

    it('marks debuff metadata when applying poison', () => {
        const debuffMetaAt = new Map<string, unknown>();
        const params = {
            ...createDefaultParams({debuffMetaAt}),
            debuffPositions: new Map([['test-pos', 'poison']]),
        };
        applyDebuffEffect(params);
        expect(mockAddPlayerEffect).toHaveBeenCalled();
        expect(debuffMetaAt.has('test-pos')).toBe(true);
    });

    it('skips applying any debuff when player is invulnerable', () => {
        const params = {
            ...createDefaultParams({isInvulnerable: true}),
            debuffPositions: new Map([['test-pos', 'poison']]),
        };
        applyDebuffEffect(params);
        expect(mockAddPlayerEffect).not.toHaveBeenCalled();
        expect(mockSetLives).not.toHaveBeenCalled();
        expect(mockSetForcedPlayerPosition).not.toHaveBeenCalled();
        expect(mockSetTeleportSignal).not.toHaveBeenCalled();
    });

    it('sets teleport signal when teleport debuff is present', () => {
        const params = {
            ...createDefaultParams(),
            debuffPositions: new Map([['test-pos', 'teleport']]),
        };
        applyDebuffEffect(params);
        expect(mockSetTeleportSignal).toHaveBeenCalled();
    });

    it('uses meta.type as a fallback to detect debuff', () => {
        const debuffMetaAt = new Map<string, unknown>([['test-pos', {type: 'poison'}]]);
        const params = {
            ...createDefaultParams({debuffMetaAt}),
            debuffPositions: new Map(),
        };
        applyDebuffEffect(params);
        expect(mockAddPlayerEffect).toHaveBeenCalledWith('poison', 6000);
    });

    it('detects debuff when style contains substring like "debuff-1"', () => {
        const params = {
            ...createDefaultParams(),
            debuffPositions: new Map([['test-pos', 'tile debuff-1 extra']]),
        };
        applyDebuffEffect(params);
        expect(mockAddPlayerEffect).toHaveBeenCalledWith('poison', 6000);
    });

    it('drain handles plain object `prev` and computes reduced expirations', () => {
        const params = {
            ...createDefaultParams(),
            debuffPositions: new Map([['test-pos', 'drain']]),
            nowMs: () => 1000,
        };
        let result: Map<string, number> | null = null;
        mockSetPlayerEffects.mockImplementation((cb: (prev: Record<string, number>) => Map<string, number>) => {
            result = cb({effect1: 5000, effect2: 900});
            return result;
        });

        applyDebuffEffect(params);

        expect(mockSetPlayerEffects).toHaveBeenCalled();
        expect(result).toBeInstanceOf(Map);
        expect(result!.get('effect1')).toBe(1000 + Math.floor((5000 - 1000) * 0.6));
        expect(result!.get('effect2')).toBe(900);
    });

    it('continues when debuffMetaAt.set throws (no crash, effect still applied)', () => {
        const debuffMetaAt = {
            get: () => ({}),
            set: () => {
                throw new Error('boom');
            },
        };
        const params = {
            ...createDefaultParams({debuffMetaAt}),
            debuffPositions: new Map([['test-pos', 'poison']]),
        };

        applyDebuffEffect(params);
        expect(mockAddPlayerEffect).toHaveBeenCalledWith('poison', 6000);
    });

    it('spike is ignored when player has shield or damage effect', () => {
        const params = {
            ...createDefaultParams({
                debuffPositions: new Map([['test-pos', 'spike']]),
                hasPlayerEffect: vi.fn().mockImplementation((kind: string) => kind === 'shield'),
            }),
            lives: 3,
        };

        applyDebuffEffect(params);

        expect(mockSetLives).not.toHaveBeenCalled();
        expect(mockSetForcedPlayerPosition).not.toHaveBeenCalled();
        expect(mockSetTeleportSignal).not.toHaveBeenCalled();
    });

    it('calls resetPlayerAfterDamage for spike when lives > 1 and no shield/damage', () => {
        const params = createDefaultParams({
            debuffPositions: new Map([['test-pos', 'spike']]),
            lives: 2,
            hasPlayerEffect: vi.fn().mockReturnValue(false),
        });

        applyDebuffEffect(params);

        expect(resetPlayerAfterDamage).toHaveBeenCalled();
    });

    it('applies simple debuffs (blind, burn, confuse, rust, glitch, slow, poison)', () => {
        const simple = [
            {key: 'blind', expected: ['blind', 6000]},
            {key: 'burn', expected: ['burn', 3000]},
            {key: 'confuse', expected: ['confuse', 5000]},
            {key: 'rust', expected: ['slow', 2000]},
            {key: 'glitch', expected: ['glitch', 6000]},
            {key: 'slow', expected: ['slow', 6000]},
            {key: 'poison', expected: ['poison', 6000]},
        ];

        for (const item of simple) {
            vi.clearAllMocks();
            const params = createDefaultParams({
                debuffPositions: new Map([['test-pos', item.key]]),
            });
            applyDebuffEffect(params);
            expect(mockAddPlayerEffect).toHaveBeenCalledWith(item.expected[0], item.expected[1]);
        }
    });

    it('falls back to meta.style when debuffPositions is empty', () => {
        const debuffMetaAt = {
            get: () => ({style: 'burn'}),
        };

        const params = createDefaultParams({
            debuffMetaAt,
            debuffPositions: new Map(),
        });

        applyDebuffEffect(params);
        expect(mockAddPlayerEffect).toHaveBeenCalledWith('burn', 3000);
    });

    it('ignores non-string rawStyle values', () => {
        const params = createDefaultParams({
            debuffPositions: new Map([['test-pos', 123 as unknown as string]]),
        });

        applyDebuffEffect(params);

        expect(mockAddPlayerEffect).not.toHaveBeenCalled();
        expect(mockSetTeleportSignal).not.toHaveBeenCalled();
        expect(resetPlayerAfterDamage).not.toHaveBeenCalled();
    });
});
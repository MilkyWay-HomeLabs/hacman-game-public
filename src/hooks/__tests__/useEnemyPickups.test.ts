import {beforeEach, describe, expect, it, vi} from 'vitest';
import {renderHook} from '@testing-library/react';
import type {Dispatch, SetStateAction} from 'react';
import useEnemyPickups from '../useEnemyPickups';
import type {EnemiesAPI} from '../useEnemiesController';

type PickupProps = Parameters<typeof useEnemyPickups>[0];

// The tests feed deliberately partial pickup metadata (not full Buff/Debuff). Cast props once at
// the hook boundary so each test can stay focused on behavior rather than exhaustive object shapes.
const useEnemyPickupsLoose = (props: Record<string, unknown>) =>
    useEnemyPickups(props as unknown as PickupProps);

const mockEnemiesApi: EnemiesAPI = {
    freezeInRadius: vi.fn(),
    destroyAt: vi.fn(),
    freezeAt: vi.fn(),
    addRustAt: vi.fn(),
    addSpeedBuffAt: vi.fn(),
};

beforeEach(() => {
    vi.clearAllMocks();
});

/* Helpers to reduce duplicated setup/updater code */
const mkMap = <T = unknown>(pairs: [string, T][] = []) => new Map(pairs);

type CurrentMaps = {
    enemyPositions: Map<string, string>;
    debuffPositions: Map<string, string>;
    buffPositions: Map<string, string>;
    debuffMetaAt: Map<string, unknown>;
    buffMetaAt: Map<string, unknown>;
};

const statefulSetters = (currents: Partial<CurrentMaps> = {}) => {
    const current: CurrentMaps = {
        enemyPositions: mkMap([...(currents.enemyPositions || [])]),
        debuffPositions: mkMap([...(currents.debuffPositions || [])]),
        buffPositions: mkMap([...(currents.buffPositions || [])]),
        debuffMetaAt: mkMap([...(currents.debuffMetaAt || [])]),
        buffMetaAt: mkMap([...(currents.buffMetaAt || [])]),
    };

    const makeSetter = <T extends keyof CurrentMaps>(key: T) => {
        return (arg: SetStateAction<CurrentMaps[T]>) => {
            current[key] = typeof arg === 'function' ? arg(current[key]) : arg;
        };
    };

    return {
        current,
        setDebuffPositions: makeSetter('debuffPositions'),
        setDebuffMetaAt: makeSetter('debuffMetaAt'),
        setBuffPositions: makeSetter('buffPositions'),
        setBuffMetaAt: makeSetter('buffMetaAt'),
        setEnemyPositions: makeSetter('enemyPositions'),
    };
};

const renderWith = (overrides: Partial<CurrentMaps> & {
    enemiesApi?: EnemiesAPI;
    setters?: Partial<Record<string, Dispatch<SetStateAction<Map<string, unknown>>>>>
} = {}) => {
    const defaults: CurrentMaps = {
        enemyPositions: mkMap(),
        debuffPositions: mkMap(),
        buffPositions: mkMap(),
        debuffMetaAt: mkMap(),
        buffMetaAt: mkMap(),
    };

    const starting: CurrentMaps = {
        ...defaults,
        ...overrides,
    };

    const st = statefulSetters(starting);
    const props = {
        enemyPositions: starting.enemyPositions,
        debuffPositions: starting.debuffPositions,
        buffPositions: starting.buffPositions,
        debuffMetaAt: starting.debuffMetaAt,
        buffMetaAt: starting.buffMetaAt,
        enemiesApi: overrides.enemiesApi ?? mockEnemiesApi,
        setDebuffPositions: overrides.setters?.setDebuffPositions ?? st.setDebuffPositions,
        setDebuffMetaAt: overrides.setters?.setDebuffMetaAt ?? st.setDebuffMetaAt,
        setBuffPositions: overrides.setters?.setBuffPositions ?? st.setBuffPositions,
        setBuffMetaAt: overrides.setters?.setBuffMetaAt ?? st.setBuffMetaAt,
        setEnemyPositions: overrides.setters?.setEnemyPositions ?? st.setEnemyPositions,
    };

    renderHook(() => useEnemyPickupsLoose(props));
    return st;
};

describe('useEnemyPickups', () => {
    it('destroys enemy and removes pickup when enemy stands on a spike debuff', () => {
        const st = renderWith({
            enemyPositions: mkMap([['1-1', 'e1']]),
            debuffPositions: mkMap([['1-1', 'debuff-7']]),
            debuffMetaAt: mkMap([['1-1', {type: 'spike', rules: {pickupBy: ['enemy'], destroyOnTouch: true}}]]),
        });

        expect(mockEnemiesApi.destroyAt).toHaveBeenCalledWith(1, 1);
        expect(st.current.debuffPositions.has('1-1')).toBe(false);
        expect(st.current.debuffMetaAt.has('1-1')).toBe(false);
        expect(st.current.enemyPositions.has('1-1')).toBe(false);
    });

    it('freezes enemy without removing debuff when destroyOnTouch is false', () => {
        const st = renderWith({
            enemyPositions: mkMap([['1-1', 'e1']]),
            debuffPositions: mkMap([['1-1', 'debuff-8']]),
            debuffMetaAt: mkMap([['1-1', {
                type: 'freeze',
                effect: {durationMs: 3000},
                rules: {pickupBy: ['enemy'], destroyOnTouch: false}
            }]]),
        });

        expect(mockEnemiesApi.freezeAt).toHaveBeenCalledWith(1, 1, 3000);
        expect(st.current.debuffPositions.has('1-1')).toBe(true);
        expect(st.current.debuffMetaAt.has('1-1')).toBe(true);
    });

    it('adds rust stacks to enemy and removes debuff when destroyOnTouch is true', () => {
        const st = renderWith({
            enemyPositions: mkMap([['1-1', 'e1']]),
            debuffPositions: mkMap([['1-1', 'debuff-9']]),
            debuffMetaAt: mkMap([['1-1', {
                type: 'rust',
                effect: {enemy: {rustStack: 3}},
                rules: {pickupBy: ['enemy'], destroyOnTouch: true}
            }]]),
        });

        expect(mockEnemiesApi.addRustAt).toHaveBeenCalledWith(1, 1, 3);
        expect(st.current.debuffPositions.has('1-1')).toBe(false);
        expect(st.current.debuffMetaAt.has('1-1')).toBe(false);
    });

    it('applies speed buff to enemy with defaults and removes buff when destroyOnTouch is true', () => {
        const st = renderWith({
            enemyPositions: mkMap([['2-2', 'e2']]),
            buffPositions: mkMap([['2-2', 'buff-2']]),
            buffMetaAt: mkMap([['2-2', {type: 'speed', rules: {pickupBy: ['enemy'], destroyOnTouch: true}}]]),
        });

        expect(mockEnemiesApi.addSpeedBuffAt).toHaveBeenCalledWith(2, 2, 1.5, 8000);
        expect(st.current.buffPositions.has('2-2')).toBe(false);
        expect(st.current.buffMetaAt.has('2-2')).toBe(false);
    });

    it('freezes enemy and removes debuff when debuff meta has no rules (defaults applied)', () => {
        const st = renderWith({
            enemyPositions: mkMap([['1-1', 'e1']]),
            debuffPositions: mkMap([['1-1', 'debuff-8']]),
            debuffMetaAt: mkMap([['1-1', {type: 'freeze'}]]),
        });

        expect(mockEnemiesApi.freezeAt).toHaveBeenCalledWith(1, 1, 2000);
        expect(st.current.debuffPositions.has('1-1')).toBe(false);
        expect(st.current.debuffMetaAt.has('1-1')).toBe(false);
    });

    it('identifies spike by debuff tile style when meta lacks type and destroys enemy', () => {
        const st = renderWith({
            enemyPositions: mkMap([['3-3', 'e3']]),
            debuffPositions: mkMap([['3-3', 'debuff-7']]),
            debuffMetaAt: mkMap([['3-3', {rules: {pickupBy: ['enemy'], destroyOnTouch: true}}]]),
        });

        expect(mockEnemiesApi.destroyAt).toHaveBeenCalledWith(3, 3);
        expect(st.current.debuffPositions.has('3-3')).toBe(false);
        expect(st.current.debuffMetaAt.has('3-3')).toBe(false);
        expect(st.current.enemyPositions.has('3-3')).toBe(false);
    });

    it('applies damage buff behavior (small speed) and removes buff when destroyOnTouch is true', () => {
        const st = renderWith({
            enemyPositions: mkMap([['4-4', 'e4']]),
            buffPositions: mkMap([['4-4', 'buff-4']]),
            buffMetaAt: mkMap([['4-4', {
                type: 'damage',
                rules: {pickupBy: ['enemy'], destroyOnTouch: true},
                effect: {durationMs: 5000}
            }]]),
        });

        expect(mockEnemiesApi.addSpeedBuffAt).toHaveBeenCalledWith(4, 4, 1.2, 5000);
        expect(st.current.buffPositions.has('4-4')).toBe(false);
        expect(st.current.buffMetaAt.has('4-4')).toBe(false);
    });

    it('does nothing when debuff meta does not map to a known debuff kind', () => {
        const st = renderWith({
            enemyPositions: mkMap([['5-5', 'e5']]),
            debuffMetaAt: mkMap([['5-5', {rules: {pickupBy: ['enemy'], destroyOnTouch: true}}]]),
        });

        expect(mockEnemiesApi.destroyAt).not.toHaveBeenCalled();
        expect(mockEnemiesApi.freezeAt).not.toHaveBeenCalled();
        expect(mockEnemiesApi.addRustAt).not.toHaveBeenCalled();
        expect(st.current.debuffPositions.has('5-5')).toBe(false);
        expect(st.current.debuffMetaAt.has('5-5')).toBe(true); // unchanged since no debuff style matched and we used empty debuffPositions
    });

    it('does not apply speed buff when buff meta uses defaults that exclude enemy pickup', () => {
        const st = renderWith({
            enemyPositions: mkMap([['6-6', 'e6']]),
            buffPositions: mkMap([['6-6', 'buff-2']]),
            buffMetaAt: mkMap([['6-6', {type: 'speed'}]]),
        });

        expect(mockEnemiesApi.addSpeedBuffAt).not.toHaveBeenCalled();
        expect(st.current.buffPositions.has('6-6')).toBe(true);
        expect(st.current.buffMetaAt.has('6-6')).toBe(true);
    });

    it('continues and removes entries even if enemiesApi.destroyAt throws for a spike', () => {
        const throwingApi = {
            ...mockEnemiesApi, destroyAt: vi.fn(() => {
                throw new Error('boom');
            })
        };
        const st = renderWith({
            enemyPositions: mkMap([['7-7', 'e7']]),
            debuffPositions: mkMap([['7-7', 'debuff-7']]),
            debuffMetaAt: mkMap([['7-7', {type: 'spike', rules: {pickupBy: ['enemy'], destroyOnTouch: true}}]]),
            enemiesApi: throwingApi,
        });

        expect(throwingApi.destroyAt).toHaveBeenCalledWith(7, 7);
        expect(st.current.debuffPositions.has('7-7')).toBe(false);
        expect(st.current.debuffMetaAt.has('7-7')).toBe(false);
        expect(st.current.enemyPositions.has('7-7')).toBe(false);
    });

    it('identifies speed buff by tile style when meta lacks type and applies the buff', () => {
        const st = renderWith({
            enemyPositions: mkMap([['8-8', 'e8']]),
            buffPositions: mkMap([['8-8', 'buff-2']]),
            buffMetaAt: mkMap([['8-8', {rules: {pickupBy: ['enemy'], destroyOnTouch: true}}]]),
        });

        expect(mockEnemiesApi.addSpeedBuffAt).toHaveBeenCalledWith(8, 8, 1.5, 8000);
        expect(st.current.buffPositions.has('8-8')).toBe(false);
        expect(st.current.buffMetaAt.has('8-8')).toBe(false);
    });

    it('spike takes precedence and prevents buff application on the same tile', () => {
        const st = renderWith({
            enemyPositions: mkMap([['1-1', 'e1']]),
            debuffPositions: mkMap([['1-1', 'debuff-7']]),
            buffPositions: mkMap([['1-1', 'buff-2']]),
            debuffMetaAt: mkMap([['1-1', {type: 'spike', rules: {pickupBy: ['enemy'], destroyOnTouch: true}}]]),
            buffMetaAt: mkMap([['1-1', {type: 'speed', rules: {pickupBy: ['enemy'], destroyOnTouch: true}}]]),
        });

        expect(mockEnemiesApi.destroyAt).toHaveBeenCalledWith(1, 1);
        expect(mockEnemiesApi.addSpeedBuffAt).not.toHaveBeenCalled();
        expect(st.current.debuffPositions.has('1-1')).toBe(false);
        expect(st.current.debuffMetaAt.has('1-1')).toBe(false);
        expect(st.current.enemyPositions.has('1-1')).toBe(false);
    });

    it('adds rust with default stack of 1 when effect.enemy.rustStack is missing', () => {
        const st = renderWith({
            enemyPositions: mkMap([['9-9', 'e9']]),
            debuffPositions: mkMap([['9-9', 'debuff-9']]),
            debuffMetaAt: mkMap([['9-9', {type: 'rust', rules: {pickupBy: ['enemy'], destroyOnTouch: true}}]]),
        });

        expect(mockEnemiesApi.addRustAt).toHaveBeenCalledWith(9, 9, 1);
        expect(st.current.debuffPositions.has('9-9')).toBe(false);
        expect(st.current.debuffMetaAt.has('9-9')).toBe(false);
    });

    it('applies damage buff detected by tile style when meta has no type', () => {
        const st = renderWith({
            enemyPositions: mkMap([['10-10', 'e10']]),
            buffPositions: mkMap([['10-10', 'buff-4']]),
            buffMetaAt: mkMap([['10-10', {
                rules: {pickupBy: ['enemy'], destroyOnTouch: true},
                effect: {durationMs: 6000}
            }]]),
        });

        expect(mockEnemiesApi.addSpeedBuffAt).toHaveBeenCalledWith(10, 10, 1.2, 6000);
        expect(st.current.buffPositions.has('10-10')).toBe(false);
        expect(st.current.buffMetaAt.has('10-10')).toBe(false);
    });

    it('applies freeze and speed buff when both exist (freeze not spike) and both destroyOnTouch true', () => {
        const st = renderWith({
            enemyPositions: mkMap([['11-11', 'e11']]),
            debuffPositions: mkMap([['11-11', 'debuff-8']]),
            buffPositions: mkMap([['11-11', 'buff-2']]),
            debuffMetaAt: mkMap([['11-11', {
                type: 'freeze',
                effect: {durationMs: 2500},
                rules: {pickupBy: ['enemy'], destroyOnTouch: true}
            }]]),
            buffMetaAt: mkMap([['11-11', {
                type: 'speed',
                rules: {pickupBy: ['enemy'], destroyOnTouch: true},
                effect: {speedMultiplier: 2.0, durationMs: 4000}
            }]]),
        });

        expect(mockEnemiesApi.freezeAt).toHaveBeenCalledWith(11, 11, 2500);
        expect(mockEnemiesApi.addSpeedBuffAt).toHaveBeenCalledWith(11, 11, 2.0, 4000);
        expect(st.current.debuffPositions.has('11-11')).toBe(false);
        expect(st.current.debuffMetaAt.has('11-11')).toBe(false);
        expect(st.current.buffPositions.has('11-11')).toBe(false);
        expect(st.current.buffMetaAt.has('11-11')).toBe(false);
    });

    it('does not apply buff when rules.pickupBy is an empty array', () => {
        const st = renderWith({
            enemyPositions: mkMap([['12-12', 'e12']]),
            buffPositions: mkMap([['12-12', 'buff-2']]),
            buffMetaAt: mkMap([['12-12', {type: 'speed', rules: {pickupBy: [], destroyOnTouch: true}}]]),
        });

        expect(mockEnemiesApi.addSpeedBuffAt).not.toHaveBeenCalled();
        expect(st.current.buffPositions.has('12-12')).toBe(true);
        expect(st.current.buffMetaAt.has('12-12')).toBe(true);
    });

    it('applies freeze but keeps debuff when rules omit destroyOnTouch', () => {
        const enemyPositions = new Map([['13-13', 'e13']]);
        const debuffPositions = new Map([['13-13', 'debuff-8']]);
        const debuffMetaAt = new Map([['13-13', {
            type: 'freeze',
            effect: {durationMs: 1500},
            rules: {pickupBy: ['enemy']}
        }]]); // no destroyOnTouch
        const buffPositions = new Map();
        const buffMetaAt = new Map();

        const setDebuffPositions = vi.fn();
        const setDebuffMetaAt = vi.fn();

        renderHook(() =>
            useEnemyPickupsLoose({
                enemyPositions,
                debuffPositions,
                buffPositions,
                debuffMetaAt,
                buffMetaAt,
                enemiesApi: mockEnemiesApi,
                setDebuffPositions,
                setDebuffMetaAt,
                setBuffPositions: vi.fn(),
                setBuffMetaAt: vi.fn(),
                setEnemyPositions: vi.fn(),
            })
        );

        expect(mockEnemiesApi.freezeAt).toHaveBeenCalledWith(13, 13, 1500);
        expect(setDebuffPositions).not.toHaveBeenCalled();
        expect(setDebuffMetaAt).not.toHaveBeenCalled();
    });

    it('applies speed buff but does not remove it when rules omit destroyOnTouch', () => {
        const enemyPositions = new Map([['14-14', 'e14']]);
        const buffPositions = new Map([['14-14', 'buff-2']]);
        const buffMetaAt = new Map([['14-14', {
            type: 'speed',
            effect: {speedMultiplier: 1.8, durationMs: 3000},
            rules: {pickupBy: ['enemy']}
        }]]); // no destroyOnTouch
        const debuffPositions = new Map();
        const debuffMetaAt = new Map();

        const setBuffPositions = vi.fn();
        const setBuffMetaAt = vi.fn();

        renderHook(() =>
            useEnemyPickupsLoose({
                enemyPositions,
                debuffPositions,
                buffPositions,
                debuffMetaAt,
                buffMetaAt,
                enemiesApi: mockEnemiesApi,
                setDebuffPositions: vi.fn(),
                setDebuffMetaAt: vi.fn(),
                setBuffPositions,
                setBuffMetaAt,
                setEnemyPositions: vi.fn(),
            })
        );

        expect(mockEnemiesApi.addSpeedBuffAt).toHaveBeenCalledWith(14, 14, 1.8, 3000);
        expect(setBuffPositions).not.toHaveBeenCalled();
        expect(setBuffMetaAt).not.toHaveBeenCalled();
    });

    it('processes multiple enemy positions and handles different pickups on each', () => {
        const enemyPositions = new Map([
            ['15-15', 'e15'], // spike
            ['16-16', 'e16'], // speed
        ]);
        const debuffPositions = new Map([['15-15', 'debuff-7']]);
        const debuffMetaAt = new Map([['15-15', {type: 'spike', rules: {pickupBy: ['enemy'], destroyOnTouch: true}}]]);
        const buffPositions = new Map([['16-16', 'buff-2']]);
        const buffMetaAt = new Map([['16-16', {type: 'speed', rules: {pickupBy: ['enemy'], destroyOnTouch: true}}]]);

        const setDebuffPositions = vi.fn();
        const setDebuffMetaAt = vi.fn();
        const setEnemyPositions = vi.fn();
        const setBuffPositions = vi.fn();
        const setBuffMetaAt = vi.fn();

        renderHook(() =>
            useEnemyPickupsLoose({
                enemyPositions,
                debuffPositions,
                buffPositions,
                debuffMetaAt,
                buffMetaAt,
                enemiesApi: mockEnemiesApi,
                setDebuffPositions,
                setDebuffMetaAt,
                setBuffPositions,
                setBuffMetaAt,
                setEnemyPositions,
            })
        );

        expect(mockEnemiesApi.destroyAt).toHaveBeenCalledWith(15, 15);
        expect(mockEnemiesApi.addSpeedBuffAt).toHaveBeenCalledWith(16, 16, 1.5, 8000);
        expect(setDebuffPositions).toHaveBeenCalled();
        expect(setDebuffMetaAt).toHaveBeenCalled();
        expect(setEnemyPositions).toHaveBeenCalled();
        expect(setBuffPositions).toHaveBeenCalled();
        expect(setBuffMetaAt).toHaveBeenCalled();
    });

    it('applies damage buff using default duration when effect.durationMs is missing', () => {
        const enemyPositions = new Map([['17-17', 'e17']]);
        const buffPositions = new Map([['17-17', 'buff-4']]);
        const buffMetaAt = new Map([['17-17', {type: 'damage', rules: {pickupBy: ['enemy'], destroyOnTouch: true}}]]); // no effect.durationMs
        const debuffPositions = new Map();
        const debuffMetaAt = new Map();

        const setBuffPositions = vi.fn();
        const setBuffMetaAt = vi.fn();

        renderHook(() =>
            useEnemyPickupsLoose({
                enemyPositions,
                debuffPositions,
                buffPositions,
                debuffMetaAt,
                buffMetaAt,
                enemiesApi: mockEnemiesApi,
                setDebuffPositions: vi.fn(),
                setDebuffMetaAt: vi.fn(),
                setBuffPositions,
                setBuffMetaAt,
                setEnemyPositions: vi.fn(),
            })
        );

        expect(mockEnemiesApi.addSpeedBuffAt).toHaveBeenCalledWith(17, 17, 1.2, 7000);
        expect(setBuffPositions).toHaveBeenCalled();
        expect(setBuffMetaAt).toHaveBeenCalled();
    });


    it('invokes setter-updaters for spike removal (updater function executed)', () => {
        const enemyPositions = new Map([['20-20', 'e20']]);
        const debuffPositions = new Map([['20-20', 'debuff-7']]);
        const debuffMetaAt = new Map([['20-20', {type: 'spike', rules: {pickupBy: ['enemy'], destroyOnTouch: true}}]]);
        const buffPositions = new Map();
        const buffMetaAt = new Map();

        // state holders to observe updater results
        let currentDebuffPositions = new Map<string, unknown>(debuffPositions);
        let currentDebuffMetaAt = new Map<string, unknown>(debuffMetaAt);
        let currentEnemyPositions = new Map<string, unknown>(enemyPositions);

        const setDebuffPositions = (arg: SetStateAction<Map<string, unknown>>) => {
            // support setState(updater) or setState(value)
            currentDebuffPositions = typeof arg === 'function' ? arg(currentDebuffPositions) : arg;
        };
        const setDebuffMetaAt = (arg: SetStateAction<Map<string, unknown>>) => {
            currentDebuffMetaAt = typeof arg === 'function' ? arg(currentDebuffMetaAt) : arg;
        };
        const setEnemyPositions = (arg: SetStateAction<Map<string, unknown>>) => {
            currentEnemyPositions = typeof arg === 'function' ? arg(currentEnemyPositions) : arg;
        };

        renderHook(() =>
            useEnemyPickupsLoose({
                enemyPositions,
                debuffPositions,
                buffPositions,
                debuffMetaAt,
                buffMetaAt,
                enemiesApi: mockEnemiesApi,
                setDebuffPositions,
                setDebuffMetaAt,
                setBuffPositions: vi.fn(),
                setBuffMetaAt: vi.fn(),
                setEnemyPositions,
            })
        );

        // ensure API was called and the updater functions actually removed entries
        expect(mockEnemiesApi.destroyAt).toHaveBeenCalledWith(20, 20);
        expect(currentDebuffPositions.has('20-20')).toBe(false);
        expect(currentDebuffMetaAt.has('20-20')).toBe(false);
        expect(currentEnemyPositions.has('20-20')).toBe(false);
    });

    it('invokes setter-updaters for speed buff removal (updater function executed)', () => {
        const enemyPositions = new Map([['21-21', 'e21']]);
        const debuffPositions = new Map();
        const debuffMetaAt = new Map();
        const buffPositions = new Map([['21-21', 'buff-2']]);
        const buffMetaAt = new Map([['21-21', {type: 'speed', rules: {pickupBy: ['enemy'], destroyOnTouch: true}}]]);

        let currentBuffPositions = new Map<string, unknown>(buffPositions);
        let currentBuffMetaAt = new Map<string, unknown>(buffMetaAt);

        const setBuffPositions = (arg: SetStateAction<Map<string, unknown>>) => {
            currentBuffPositions = typeof arg === 'function' ? arg(currentBuffPositions) : arg;
        };
        const setBuffMetaAt = (arg: SetStateAction<Map<string, unknown>>) => {
            currentBuffMetaAt = typeof arg === 'function' ? arg(currentBuffMetaAt) : arg;
        };

        renderHook(() =>
            useEnemyPickupsLoose({
                enemyPositions,
                debuffPositions,
                buffPositions,
                debuffMetaAt,
                buffMetaAt,
                enemiesApi: mockEnemiesApi,
                setDebuffPositions: vi.fn(),
                setDebuffMetaAt: vi.fn(),
                setBuffPositions,
                setBuffMetaAt,
                setEnemyPositions: vi.fn(),
            })
        );

        expect(mockEnemiesApi.addSpeedBuffAt).toHaveBeenCalledWith(21, 21, 1.5, 8000);
        expect(currentBuffPositions.has('21-21')).toBe(false);
        expect(currentBuffMetaAt.has('21-21')).toBe(false);
    });

    it('invokes setter-updaters for freeze removal (updater function executed)', () => {
        const enemyPositions = new Map([['30-30', 'e30']]);
        const debuffPositions = new Map([['30-30', 'debuff-8']]);
        const debuffMetaAt = new Map([['30-30', {
            type: 'freeze',
            rules: {pickupBy: ['enemy'], destroyOnTouch: true},
            effect: {durationMs: 1200}
        }]]);
        const buffPositions = new Map();
        const buffMetaAt = new Map();

        let currentDebuffPositions = new Map<string, unknown>(debuffPositions);
        let currentDebuffMetaAt = new Map<string, unknown>(debuffMetaAt);

        const setDebuffPositions = (arg: SetStateAction<Map<string, unknown>>) => {
            currentDebuffPositions = typeof arg === 'function' ? arg(currentDebuffPositions) : arg;
        };
        const setDebuffMetaAt = (arg: SetStateAction<Map<string, unknown>>) => {
            currentDebuffMetaAt = typeof arg === 'function' ? arg(currentDebuffMetaAt) : arg;
        };

        renderHook(() =>
            useEnemyPickupsLoose({
                enemyPositions,
                debuffPositions,
                buffPositions,
                debuffMetaAt,
                buffMetaAt,
                enemiesApi: mockEnemiesApi,
                setDebuffPositions,
                setDebuffMetaAt,
                setBuffPositions: vi.fn(),
                setBuffMetaAt: vi.fn(),
                setEnemyPositions: vi.fn(),
            })
        );

        expect(mockEnemiesApi.freezeAt).toHaveBeenCalledWith(30, 30, 1200);
        expect(currentDebuffPositions.has('30-30')).toBe(false);
        expect(currentDebuffMetaAt.has('30-30')).toBe(false);
    });

    it('invokes setter-updaters for rust removal and uses provided stacks', () => {
        const enemyPositions = new Map([['31-31', 'e31']]);
        const debuffPositions = new Map([['31-31', 'debuff-9']]);
        const debuffMetaAt = new Map([['31-31', {
            type: 'rust',
            rules: {pickupBy: ['enemy'], destroyOnTouch: true},
            effect: {enemy: {rustStack: 2}}
        }]]);
        const buffPositions = new Map();
        const buffMetaAt = new Map();

        let currentDebuffPositions = new Map<string, unknown>(debuffPositions);
        let currentDebuffMetaAt = new Map<string, unknown>(debuffMetaAt);

        const setDebuffPositions = (arg: SetStateAction<Map<string, unknown>>) => {
            currentDebuffPositions = typeof arg === 'function' ? arg(currentDebuffPositions) : arg;
        };
        const setDebuffMetaAt = (arg: SetStateAction<Map<string, unknown>>) => {
            currentDebuffMetaAt = typeof arg === 'function' ? arg(currentDebuffMetaAt) : arg;
        };

        renderHook(() =>
            useEnemyPickupsLoose({
                enemyPositions,
                debuffPositions,
                buffPositions,
                debuffMetaAt,
                buffMetaAt,
                enemiesApi: mockEnemiesApi,
                setDebuffPositions,
                setDebuffMetaAt,
                setBuffPositions: vi.fn(),
                setBuffMetaAt: vi.fn(),
                setEnemyPositions: vi.fn(),
            })
        );

        expect(mockEnemiesApi.addRustAt).toHaveBeenCalledWith(31, 31, 2);
        expect(currentDebuffPositions.has('31-31')).toBe(false);
        expect(currentDebuffMetaAt.has('31-31')).toBe(false);
    });

    it('continues and removes entries even if enemiesApi.freezeAt throws', () => {
        const throwingApi = {
            ...mockEnemiesApi, freezeAt: vi.fn(() => {
                throw new Error('boom');
            })
        };

        const enemyPositions = new Map([['32-32', 'e32']]);
        const debuffPositions = new Map([['32-32', 'debuff-8']]);
        const debuffMetaAt = new Map([['32-32', {type: 'freeze', rules: {pickupBy: ['enemy'], destroyOnTouch: true}}]]);
        const buffPositions = new Map();
        const buffMetaAt = new Map();

        let currentDebuffPositions = new Map<string, unknown>(debuffPositions);
        let currentDebuffMetaAt = new Map<string, unknown>(debuffMetaAt);

        const setDebuffPositions = (arg: SetStateAction<Map<string, unknown>>) => {
            currentDebuffPositions = typeof arg === 'function' ? arg(currentDebuffPositions) : arg;
        };
        const setDebuffMetaAt = (arg: SetStateAction<Map<string, unknown>>) => {
            currentDebuffMetaAt = typeof arg === 'function' ? arg(currentDebuffMetaAt) : arg;
        };

        renderHook(() =>
            useEnemyPickupsLoose({
                enemyPositions,
                debuffPositions,
                buffPositions,
                debuffMetaAt,
                buffMetaAt,
                enemiesApi: throwingApi,
                setDebuffPositions,
                setDebuffMetaAt,
                setBuffPositions: vi.fn(),
                setBuffMetaAt: vi.fn(),
                setEnemyPositions: vi.fn(),
            })
        );

        expect(throwingApi.freezeAt).toHaveBeenCalledWith(32, 32, expect.any(Number));
        expect(currentDebuffPositions.has('32-32')).toBe(false);
        expect(currentDebuffMetaAt.has('32-32')).toBe(false);
    });

    it('continues and removes entries even if enemiesApi.addSpeedBuffAt throws for a speed buff', () => {
        const throwingApi = {
            ...mockEnemiesApi, addSpeedBuffAt: vi.fn(() => {
                throw new Error('boom');
            })
        };

        const enemyPositions = new Map([['33-33', 'e33']]);
        const buffPositions = new Map([['33-33', 'buff-2']]);
        const buffMetaAt = new Map([['33-33', {
            type: 'speed',
            rules: {pickupBy: ['enemy'], destroyOnTouch: true},
            effect: {speedMultiplier: 1.4, durationMs: 2200}
        }]]);
        const debuffPositions = new Map();
        const debuffMetaAt = new Map();

        let currentBuffPositions = new Map<string, unknown>(buffPositions);
        let currentBuffMetaAt = new Map<string, unknown>(buffMetaAt);

        const setBuffPositions = (arg: SetStateAction<Map<string, unknown>>) => {
            currentBuffPositions = typeof arg === 'function' ? arg(currentBuffPositions) : arg;
        };
        const setBuffMetaAt = (arg: SetStateAction<Map<string, unknown>>) => {
            currentBuffMetaAt = typeof arg === 'function' ? arg(currentBuffMetaAt) : arg;
        };

        renderHook(() =>
            useEnemyPickupsLoose({
                enemyPositions,
                debuffPositions,
                buffPositions,
                debuffMetaAt,
                buffMetaAt,
                enemiesApi: throwingApi,
                setDebuffPositions: vi.fn(),
                setDebuffMetaAt: vi.fn(),
                setBuffPositions,
                setBuffMetaAt,
                setEnemyPositions: vi.fn(),
            })
        );

        expect(throwingApi.addSpeedBuffAt).toHaveBeenCalledWith(33, 33, 1.4, 2200);
        expect(currentBuffPositions.has('33-33')).toBe(false);
        expect(currentBuffMetaAt.has('33-33')).toBe(false);
    });

    it('invokes setter-updaters for damage buff removal (updater function executed)', () => {
        const enemyPositions = new Map([['34-34', 'e34']]);
        const buffPositions = new Map([['34-34', 'buff-4']]);
        const buffMetaAt = new Map([['34-34', {
            type: 'damage',
            rules: {pickupBy: ['enemy'], destroyOnTouch: true},
            effect: {durationMs: 1400}
        }]]);
        const debuffPositions = new Map();
        const debuffMetaAt = new Map();

        let currentBuffPositions = new Map<string, unknown>(buffPositions);
        let currentBuffMetaAt = new Map<string, unknown>(buffMetaAt);

        const setBuffPositions = (arg: SetStateAction<Map<string, unknown>>) => {
            currentBuffPositions = typeof arg === 'function' ? arg(currentBuffPositions) : arg;
        };
        const setBuffMetaAt = (arg: SetStateAction<Map<string, unknown>>) => {
            currentBuffMetaAt = typeof arg === 'function' ? arg(currentBuffMetaAt) : arg;
        };

        renderHook(() =>
            useEnemyPickupsLoose({
                enemyPositions,
                debuffPositions,
                buffPositions,
                debuffMetaAt,
                buffMetaAt,
                enemiesApi: mockEnemiesApi,
                setDebuffPositions: vi.fn(),
                setDebuffMetaAt: vi.fn(),
                setBuffPositions,
                setBuffMetaAt,
                setEnemyPositions: vi.fn(),
            })
        );

        expect(mockEnemiesApi.addSpeedBuffAt).toHaveBeenCalledWith(34, 34, 1.2, 1400);
        expect(currentBuffPositions.has('34-34')).toBe(false);
        expect(currentBuffMetaAt.has('34-34')).toBe(false);
    });

});
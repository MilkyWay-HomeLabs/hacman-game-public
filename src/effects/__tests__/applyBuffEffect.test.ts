import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';
import {applyBuffEffect} from '../applyBuffEffect';
import type {MazeData} from '../../types/maze';

describe('applyBuffEffect', () => {
    const mockAddPlayerEffect = vi.fn();
    const mockSetLives = vi.fn();
    const mockSetTimerSeconds = vi.fn();
    const mockSetForcedPlayerPosition = vi.fn();
    const mockSetTeleportSignal = vi.fn();
    const mockSetDebuffPositions = vi.fn();
    const mockSetDebuffMetaAt = vi.fn();
    const mockFreezeInRadius = vi.fn();

    const createDefaultParams = (overrides = {}) => ({
        posKey: 'test-pos',
        buffMetaAt: new Map(),
        buffPositions: new Map(),
        playerPosition: {x: 1, y: 1},
        mazeData: ({cells: [[0, 1], [1, 0]]} as unknown as MazeData),
        addPlayerEffect: mockAddPlayerEffect,
        setLives: mockSetLives,
        setTimerSeconds: mockSetTimerSeconds,
        setForcedPlayerPosition: mockSetForcedPlayerPosition,
        setTeleportSignal: mockSetTeleportSignal,
        setDebuffPositions: mockSetDebuffPositions,
        setDebuffMetaAt: mockSetDebuffMetaAt,
        enemiesApi: {freezeInRadius: mockFreezeInRadius},
        ...overrides,
    });

    beforeEach(() => {
        vi.clearAllMocks();
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('increases lives when buff type is health', () => {
        const params = createDefaultParams({
            buffPositions: new Map([['test-pos', 'buff-1']]),
        });
        applyBuffEffect(params);
        expect(mockSetLives).toHaveBeenCalledWith(expect.any(Function));
        expect(mockSetLives.mock.calls[0][0](8)).toBe(9);
    });

    it('applies speed effect for 8000ms', () => {
        const params = createDefaultParams({
            buffPositions: new Map([['test-pos', 'buff-2']]),
        });
        applyBuffEffect(params);
        expect(mockAddPlayerEffect).toHaveBeenCalledWith('speed', 8000);
    });

    it('removes debuffs and freezes enemies in EMP range', () => {
        const params = createDefaultParams({
            buffPositions: new Map([['test-pos', 'buff-5']]),
            playerPosition: {x: 2, y: 2},
        });
        applyBuffEffect(params);
        expect(mockSetDebuffPositions).toHaveBeenCalled();
        expect(mockFreezeInRadius).toHaveBeenCalledWith(2, 2, 4, 2500);
    });

    it('teleports player to a random empty cell', () => {
        const params = createDefaultParams({
            buffPositions: new Map([['test-pos', 'buff-6']]),
            mazeData: {cells: [[0, 1], [1, 0]]} as unknown as MazeData,
        });
        applyBuffEffect(params);
        expect(mockSetForcedPlayerPosition).toHaveBeenCalledWith(expect.objectContaining({
            x: expect.any(Number),
            y: expect.any(Number)
        }));
        expect(mockSetTeleportSignal).toHaveBeenCalledWith(expect.any(Function));
    });

    it('adds 20 seconds to the timer for time buff', () => {
        const params = createDefaultParams({
            buffPositions: new Map([['test-pos', 'buff-7']]),
        });
        applyBuffEffect(params);
        expect(mockSetTimerSeconds).toHaveBeenCalledWith(expect.any(Function));
        expect(mockSetTimerSeconds.mock.calls[0][0](100)).toBe(120);
    });

    it('applies invisibility effect for 6000ms', () => {
        const params = createDefaultParams({
            buffPositions: new Map([['test-pos', 'buff-8']]),
        });
        applyBuffEffect(params);
        expect(mockAddPlayerEffect).toHaveBeenCalledWith('invisibility', 6000);
    });

    it('applies a random buff when buff type is random', () => {
        const params = createDefaultParams({
            buffPositions: new Map([['test-pos', 'buff-10']]),
        });
        const randSpy = vi.spyOn(Math, 'random').mockReturnValue(0);
        applyBuffEffect(params);
        const anyCalled = [
            mockAddPlayerEffect,
            mockSetLives,
            mockSetTimerSeconds,
            mockSetForcedPlayerPosition,
            mockSetDebuffPositions,
            mockFreezeInRadius
        ].some(fn => fn.mock.calls.length > 0);
        expect(anyCalled).toBe(true);
        randSpy.mockRestore();
    });

    it('does nothing when buff type is not recognized', () => {
        const params = createDefaultParams({
            buffPositions: new Map([['test-pos', 'unknown-buff']]),
        });
        applyBuffEffect(params);
        expect(mockAddPlayerEffect).not.toHaveBeenCalled();
        expect(mockSetLives).not.toHaveBeenCalled();
    });

    it('applies shield effect for 6000ms', () => {
        const params = createDefaultParams({
            buffPositions: new Map([['test-pos', 'buff-3']]),
        });
        applyBuffEffect(params);
        expect(mockAddPlayerEffect).toHaveBeenCalledWith('shield', 6000);
    });

    it('applies damage effect for 7000ms', () => {
        const params = createDefaultParams({
            buffPositions: new Map([['test-pos', 'buff-4']]),
        });
        applyBuffEffect(params);
        expect(mockAddPlayerEffect).toHaveBeenCalledWith('damage', 7000);
    });

    it('applies magnet effect for 8000ms', () => {
        const params = createDefaultParams({
            buffPositions: new Map([['test-pos', 'buff-9']]),
        });
        applyBuffEffect(params);
        expect(mockAddPlayerEffect).toHaveBeenCalledWith('magnet', 8000);
    });

    it('does not teleport when mazeData is null', () => {
        const params = createDefaultParams({
            buffPositions: new Map([['test-pos', 'buff-6']]),
            mazeData: null,
        });
        applyBuffEffect(params);
        expect(mockSetForcedPlayerPosition).not.toHaveBeenCalled();
        expect(mockSetTeleportSignal).not.toHaveBeenCalled();
    });

    it('does not teleport when there are no empty cells', () => {
        const params = createDefaultParams({
            buffPositions: new Map([['test-pos', 'buff-6']]),
            mazeData: ({ cells: [[1, 1], [1, 1]] } as unknown as MazeData),
        });
        applyBuffEffect(params);
        expect(mockSetForcedPlayerPosition).not.toHaveBeenCalled();
        expect(mockSetTeleportSignal).not.toHaveBeenCalled();
    });

    it('random buff selects health when Math.random picks last pool index', () => {
        // pool length is 8; return 7/8 to pick index 7 => 'health'
        vi.spyOn(Math, 'random').mockReturnValue(7 / 8);
        const params = createDefaultParams({
            buffPositions: new Map([['test-pos', 'buff-10']]),
        });
        applyBuffEffect(params);
        expect(mockSetLives).toHaveBeenCalledWith(expect.any(Function));
    });


    it('emp removes nearby debuffs and triggers setDebuffMetaAt updater', () => {
        const params = createDefaultParams({
            buffPositions: new Map([['test-pos', 'buff-5']]),
            playerPosition: {x: 1, y: 1},
        });

        applyBuffEffect(params);

        // ensure setDebuffPositions updater was passed
        expect(mockSetDebuffPositions).toHaveBeenCalled();
        const debuffUpdater = mockSetDebuffPositions.mock.calls[0][0];
        // prepare prev map with an in-range key and an out-of-range key
        const prevMap = new Map([
            ['1-1', 'd1'], // distance 0 => should be removed
            ['10-10', 'd2'] // far away => kept
        ]);
        const resultMap = debuffUpdater(prevMap);
        expect(resultMap.has('1-1')).toBe(false);
        expect(resultMap.has('10-10')).toBe(true);

        // ensure setDebuffMetaAt was called with an updater and that updater removes meta for the same key
        expect(mockSetDebuffMetaAt).toHaveBeenCalled();
        const dmUpdater = mockSetDebuffMetaAt.mock.calls[0][0];
        const dmPrev = new Map([
            ['1-1', {foo: 'bar'}],
            ['10-10', {baz: 'qux'}]
        ]);
        const dmResult = dmUpdater(dmPrev);
        expect(dmResult.has('1-1')).toBe(false);
        expect(dmResult.has('10-10')).toBe(true);

        // enemies freeze should be invoked
        expect(mockFreezeInRadius).toHaveBeenCalledWith(1, 1, 4, 2500);
    });

    it('random buff recurses and applies speed when Math.random picks index 0', () => {
        const randSpy = vi.spyOn(Math, 'random').mockReturnValue(0); // pick 'speed'
        const params = createDefaultParams({
            buffPositions: new Map([['test-pos', 'buff-10']]),
        });
        applyBuffEffect(params);
        expect(mockAddPlayerEffect).toHaveBeenCalledWith('speed', 8000);
        randSpy.mockRestore();
    });

    it('random buff picks teleport but does not teleport when mazeData is null', () => {
        // pool index 3 is 'teleport' -> return 3/8 to select it
        const randSpy = vi.spyOn(Math, 'random').mockReturnValue(3 / 8);
        const params = createDefaultParams({
            buffPositions: new Map([['test-pos', 'buff-10']]),
            mazeData: null,
        });
        applyBuffEffect(params);
        // teleport action should not call setters because mazeData is null
        expect(mockSetForcedPlayerPosition).not.toHaveBeenCalled();
        expect(mockSetTeleportSignal).not.toHaveBeenCalled();
        randSpy.mockRestore();
    });

    it('detects buff type from buffMetaAt.type when buffPositions is empty', () => {
        const params = createDefaultParams({
            buffMetaAt: new Map([['test-pos', {type: 'speed'}]]),
            buffPositions: new Map(),
        });
        applyBuffEffect(params);
        expect(mockAddPlayerEffect).toHaveBeenCalledWith('speed', 8000);
    });

});
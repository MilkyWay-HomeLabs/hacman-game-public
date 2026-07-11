import React from 'react';
import {act, fireEvent, render} from '@testing-library/react';
import {afterEach, describe, expect, it, vi} from 'vitest';
import {
    type Direction,
    PLAYER_SPEED_CELLS_PER_SEC,
    swipeToDirection,
    usePlayerMovement,
} from '../usePlayerMovement';

interface Position {
    x: number;
    y: number;
}

interface HookProps {
    initialPosition: Position;
    maze: number[][];
    onDirectionChange?: (dir: Direction) => void;
    disabled?: boolean;
    invertControls?: boolean;
    teleportSignal?: number;
    teleportTo?: Position;
    speedMultiplier?: number;
    baseSpeedCellsPerSec?: number;
}

function HookWrapper(props: HookProps) {
    const {position: pos, move} = usePlayerMovement(props);
    const dirs: Direction[] = ['up', 'down', 'left', 'right'];
    return React.createElement(
        'div',
        null,
        React.createElement('div', {'data-testid': 'pos'}, `${pos.x},${pos.y}`),
        ...dirs.map((d) =>
            React.createElement('button', {key: d, 'data-testid': `move-${d}`, onClick: () => move(d)}),
        ),
    );
}

describe('usePlayerMovement (no JSX)', () => {
    it('initializes with the correct position', () => {
        const {getByTestId} = render(
            React.createElement(HookWrapper, {initialPosition: {x: 0, y: 0}, maze: [[0]]})
        );
        expect(getByTestId('pos').textContent).toEqual('0,0');
    });

    it('moves the player up when ArrowUp is pressed', () => {
        const {getByTestId} = render(
            React.createElement(HookWrapper, {
                initialPosition: {x: 1, y: 1},
                maze: [
                    [0, 0, 0],
                    [0, 0, 0],
                    [0, 0, 0],
                ],
            })
        );

        act(() => {
            window.dispatchEvent(new KeyboardEvent('keydown', {key: 'ArrowUp'}));
        });

        expect(getByTestId('pos').textContent).toEqual('1,0');
    });

    it('does not move the player into a wall', () => {
        const {getByTestId} = render(
            React.createElement(HookWrapper, {
                initialPosition: {x: 1, y: 1},
                maze: [
                    [0, 1, 0],
                    [0, 0, 0],
                    [0, 0, 0],
                ],
            })
        );

        act(() => {
            window.dispatchEvent(new KeyboardEvent('keydown', {key: 'ArrowUp'}));
        });

        expect(getByTestId('pos').textContent).toEqual('1,1');
    });

    it('respects inverted controls', () => {
        const {getByTestId} = render(
            React.createElement(HookWrapper, {
                initialPosition: {x: 1, y: 1},
                maze: [
                    [0, 0, 0],
                    [0, 0, 0],
                    [0, 0, 0],
                ],
                invertControls: true,
            })
        );

        act(() => {
            window.dispatchEvent(new KeyboardEvent('keydown', {key: 'ArrowUp'}));
        });

        expect(getByTestId('pos').textContent).toEqual('1,2');
    });

    it('teleports the player when teleportSignal is triggered', () => {
        const {getByTestId, rerender} = render(
            React.createElement(HookWrapper, {
                initialPosition: {x: 0, y: 0},
                maze: [[0]],
                teleportSignal: 0,
                teleportTo: {x: 2, y: 2},
            })
        );

        rerender(
            React.createElement(HookWrapper, {
                initialPosition: {x: 0, y: 0},
                maze: [[0]],
                teleportSignal: 1,
                teleportTo: {x: 2, y: 2},
            })
        );

        expect(getByTestId('pos').textContent).toEqual('2,2');
    });

    it('does not move the player when disabled', () => {
        const {getByTestId} = render(
            React.createElement(HookWrapper, {
                initialPosition: {x: 1, y: 1},
                maze: [
                    [0, 0, 0],
                    [0, 0, 0],
                    [0, 0, 0],
                ],
                disabled: true,
            })
        );

        act(() => {
            window.dispatchEvent(new KeyboardEvent('keydown', {key: 'ArrowUp'}));
        });

        expect(getByTestId('pos').textContent).toEqual('1,1');
    });

    it('calls onDirectionChange when the player moves', () => {
        const onDirectionChange = vi.fn();
        const {getByTestId} = render(
            React.createElement(HookWrapper, {
                initialPosition: {x: 1, y: 1},
                maze: [
                    [0, 0, 0],
                    [0, 0, 0],
                    [0, 0, 0],
                ],
                onDirectionChange,
            })
        );

        act(() => {
            window.dispatchEvent(new KeyboardEvent('keydown', {key: 'ArrowUp'}));
        });

        expect(onDirectionChange).toHaveBeenCalledWith('up');
        expect(getByTestId('pos').textContent).toEqual('1,0');
    });
});

describe('usePlayerMovement — move() command (D-pad path)', () => {
    const openMaze = [
        [0, 0, 0],
        [0, 0, 0],
        [0, 0, 0],
    ];

    it('moves the player in the requested direction', () => {
        const {getByTestId} = render(
            React.createElement(HookWrapper, {initialPosition: {x: 1, y: 1}, maze: openMaze}),
        );
        act(() => fireEvent.click(getByTestId('move-right')));
        expect(getByTestId('pos').textContent).toEqual('2,1');
    });

    it('inverts the direction when controls are inverted', () => {
        const {getByTestId} = render(
            React.createElement(HookWrapper, {
                initialPosition: {x: 1, y: 1},
                maze: openMaze,
                invertControls: true,
            }),
        );
        act(() => fireEvent.click(getByTestId('move-up')));
        expect(getByTestId('pos').textContent).toEqual('1,2');
    });

    it('does not move into a wall', () => {
        const wallMaze = [
            [0, 1, 0],
            [0, 0, 0],
            [0, 0, 0],
        ];
        const {getByTestId} = render(
            React.createElement(HookWrapper, {initialPosition: {x: 1, y: 1}, maze: wallMaze}),
        );
        act(() => fireEvent.click(getByTestId('move-up')));
        expect(getByTestId('pos').textContent).toEqual('1,1');
    });

    it('does not move when disabled', () => {
        const {getByTestId} = render(
            React.createElement(HookWrapper, {
                initialPosition: {x: 1, y: 1},
                maze: openMaze,
                disabled: true,
            }),
        );
        act(() => fireEvent.click(getByTestId('move-right')));
        expect(getByTestId('pos').textContent).toEqual('1,1');
    });

    it('wraps through an open maze edge to the opposite side', () => {
        // A horizontal tunnel: both ends of row 1 are open edges.
        const tunnel = [
            [1, 1, 1],
            [0, 0, 0],
            [1, 1, 1],
        ];
        const {getByTestId} = render(
            React.createElement(HookWrapper, {initialPosition: {x: 0, y: 1}, maze: tunnel}),
        );
        act(() => fireEvent.click(getByTestId('move-left')));
        expect(getByTestId('pos').textContent).toEqual('2,1');
    });

    it('does not wrap when the opposite edge cell is a wall', () => {
        const deadEnd = [
            [0, 0, 1],
        ];
        const {getByTestId} = render(
            React.createElement(HookWrapper, {initialPosition: {x: 0, y: 0}, maze: deadEnd}),
        );
        act(() => fireEvent.click(getByTestId('move-left')));
        expect(getByTestId('pos').textContent).toEqual('0,0');
    });
});

describe('usePlayerMovement — continuous movement (hold / glide)', () => {
    const TICK = Math.ceil(1000 / PLAYER_SPEED_CELLS_PER_SEC);

    afterEach(() => {
        vi.useRealTimers();
    });

    function pressKey(key: string, repeat = false) {
        act(() => {
            window.dispatchEvent(new KeyboardEvent('keydown', {key, repeat}));
        });
    }

    function releaseKey(key: string) {
        act(() => {
            window.dispatchEvent(new KeyboardEvent('keyup', {key}));
        });
    }

    function advance(ms: number) {
        act(() => {
            vi.advanceTimersByTime(ms);
        });
    }

    const corridor = [
        [0, 0, 0, 0, 0, 0],
    ];

    it('keeps gliding while the key is held: one cell per tick', () => {
        vi.useFakeTimers();
        const {getByTestId} = render(
            React.createElement(HookWrapper, {initialPosition: {x: 0, y: 0}, maze: corridor}),
        );

        pressKey('ArrowRight'); // immediate step
        expect(getByTestId('pos').textContent).toEqual('1,0');

        advance(TICK);
        expect(getByTestId('pos').textContent).toEqual('2,0');
        advance(TICK * 2);
        expect(getByTestId('pos').textContent).toEqual('4,0');
    });

    it('paces the glide from baseSpeedCellsPerSec (faster base => shorter tick)', () => {
        vi.useFakeTimers();
        // 6 cells/sec => one step per ~167ms, independent of the default constant.
        const FAST_TICK = Math.ceil(1000 / 6);
        const {getByTestId} = render(
            React.createElement(HookWrapper, {
                initialPosition: {x: 0, y: 0},
                maze: corridor,
                baseSpeedCellsPerSec: 6,
            }),
        );

        pressKey('ArrowRight'); // immediate step -> (1,0)
        expect(getByTestId('pos').textContent).toEqual('1,0');

        // The default TICK (1000/3) must not have advanced a 6 cells/sec glide twice.
        advance(FAST_TICK);
        expect(getByTestId('pos').textContent).toEqual('2,0');
        advance(FAST_TICK * 2);
        expect(getByTestId('pos').textContent).toEqual('4,0');
    });

    it('stops at the next cell after the key is released', () => {
        vi.useFakeTimers();
        const {getByTestId} = render(
            React.createElement(HookWrapper, {initialPosition: {x: 0, y: 0}, maze: corridor}),
        );

        pressKey('ArrowRight');
        releaseKey('ArrowRight');
        advance(TICK * 5);
        // Only the immediate step happened; the ticker stopped on release.
        expect(getByTestId('pos').textContent).toEqual('1,0');
    });

    it('ignores OS key-repeat: cadence is owned by the ticker', () => {
        vi.useFakeTimers();
        const {getByTestId} = render(
            React.createElement(HookWrapper, {initialPosition: {x: 0, y: 0}, maze: corridor}),
        );

        pressKey('ArrowRight');
        pressKey('ArrowRight', true);
        pressKey('ArrowRight', true);
        expect(getByTestId('pos').textContent).toEqual('1,0');
    });

    it('takes a queued perpendicular turn at the first open junction', () => {
        vi.useFakeTimers();
        // Row 0 is a corridor; the only way down is at x=2.
        const maze = [
            [0, 0, 0, 0],
            [1, 1, 0, 1],
            [1, 1, 0, 1],
        ];
        const {getByTestId} = render(
            React.createElement(HookWrapper, {initialPosition: {x: 0, y: 0}, maze}),
        );

        pressKey('ArrowRight'); // -> (1,0)
        pressKey('ArrowDown'); // queued; wall below (1,0)
        expect(getByTestId('pos').textContent).toEqual('1,0');

        advance(TICK); // down still walled -> continues right to (2,0)
        expect(getByTestId('pos').textContent).toEqual('2,0');
        advance(TICK); // junction open -> turns down to (2,1)
        expect(getByTestId('pos').textContent).toEqual('2,1');
        releaseKey('ArrowRight');
        advance(TICK); // still holding down -> (2,2)
        expect(getByTestId('pos').textContent).toEqual('2,2');
    });

    it('a swipe glides until the wall, without any key held', () => {
        vi.useFakeTimers();
        // A wall terminates the corridor (an open edge would wrap around).
        const walledCorridor = [
            [0, 0, 0, 0, 0, 1],
        ];
        const {getByTestId} = render(
            React.createElement(HookWrapper, {initialPosition: {x: 0, y: 0}, maze: walledCorridor}),
        );

        act(() => {
            window.dispatchEvent(new TouchEvent('touchstart', {
                changedTouches: [{clientX: 10, clientY: 10} as unknown as Touch],
            }));
            window.dispatchEvent(new TouchEvent('touchend', {
                changedTouches: [{clientX: 80, clientY: 12} as unknown as Touch],
            }));
        });
        expect(getByTestId('pos').textContent).toEqual('1,0');

        advance(TICK * 10);
        // Glided to the last open cell and stopped at the wall.
        expect(getByTestId('pos').textContent).toEqual('4,0');
    });

    it('a teleport cancels the ongoing glide', () => {
        vi.useFakeTimers();
        const props = {
            initialPosition: {x: 0, y: 0},
            maze: corridor,
            teleportSignal: 0,
            teleportTo: {x: 3, y: 0},
        };
        const {getByTestId, rerender} = render(React.createElement(HookWrapper, props));

        pressKey('ArrowRight');
        expect(getByTestId('pos').textContent).toEqual('1,0');

        rerender(React.createElement(HookWrapper, {...props, teleportSignal: 1}));
        expect(getByTestId('pos').textContent).toEqual('3,0');

        advance(TICK * 3);
        // Held state was cleared by the teleport; no further movement.
        expect(getByTestId('pos').textContent).toEqual('3,0');
    });

    it('moves faster with a speed multiplier', () => {
        vi.useFakeTimers();
        const {getByTestId} = render(
            React.createElement(HookWrapper, {
                initialPosition: {x: 0, y: 0},
                maze: corridor,
                speedMultiplier: 2,
            }),
        );

        pressKey('ArrowRight'); // immediate step -> 1,0
        advance(TICK); // two accelerated ticks fit into one base tick
        expect(getByTestId('pos').textContent).toEqual('3,0');
    });

    it('buffers a quick tap that lands while the ticker is mid-interval', () => {
        vi.useFakeTimers();
        const {getByTestId} = render(
            React.createElement(HookWrapper, {initialPosition: {x: 0, y: 0}, maze: corridor}),
        );

        // Glide one cell, release, and tap again before the next tick fires.
        pressKey('ArrowRight');
        releaseKey('ArrowRight');
        advance(Math.floor(TICK / 2));
        pressKey('ArrowRight');
        releaseKey('ArrowRight');
        expect(getByTestId('pos').textContent).toEqual('1,0');

        // The buffered tap is consumed by the next tick, then the ticker stops.
        advance(TICK);
        expect(getByTestId('pos').textContent).toEqual('2,0');
        advance(TICK * 4);
        expect(getByTestId('pos').textContent).toEqual('2,0');
    });

    it('release falls back to another still-held direction', () => {
        vi.useFakeTimers();
        const maze = [
            [0, 0, 0],
            [0, 0, 0],
        ];
        const {getByTestId} = render(
            React.createElement(HookWrapper, {initialPosition: {x: 0, y: 0}, maze}),
        );

        pressKey('ArrowRight'); // -> (1,0)
        pressKey('ArrowDown'); // queued -> next tick turns down
        advance(TICK); // -> (1,1)
        expect(getByTestId('pos').textContent).toEqual('1,1');
        releaseKey('ArrowDown'); // right is still held -> becomes queued again
        advance(TICK); // -> (2,1)
        expect(getByTestId('pos').textContent).toEqual('2,1');
    });
});

describe('swipeToDirection', () => {
    it('ignores gestures below the threshold', () => {
        expect(swipeToDirection(5, -3)).toBeNull();
        expect(swipeToDirection(0, 0)).toBeNull();
    });

    it('maps the dominant axis to a direction', () => {
        expect(swipeToDirection(40, 5)).toBe('right');
        expect(swipeToDirection(-40, 5)).toBe('left');
        expect(swipeToDirection(5, 40)).toBe('down');
        expect(swipeToDirection(5, -40)).toBe('up');
    });

    it('resolves a diagonal swipe by its larger component', () => {
        expect(swipeToDirection(50, -30)).toBe('right');
        expect(swipeToDirection(-30, 50)).toBe('down');
    });
});
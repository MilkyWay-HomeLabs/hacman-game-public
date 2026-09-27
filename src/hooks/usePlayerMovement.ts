import {useCallback, useEffect, useRef, useState} from 'react';
import type {Position} from '../types/maze';
import {wrapStep} from '../domain/grid';

export type Direction = 'up' | 'down' | 'left' | 'right';

const OPPOSITE: Record<Direction, Direction> = {
    up: 'down',
    down: 'up',
    left: 'right',
    right: 'left',
};

/** Keyboard bindings → logical direction (inversion is applied later, in `move`). */
const KEY_TO_DIRECTION: Record<string, Direction> = {
    ArrowUp: 'up', w: 'up',
    ArrowDown: 'down', s: 'down',
    ArrowLeft: 'left', a: 'left',
    ArrowRight: 'right', d: 'right',
};

/** A swipe shorter than this (px, on the dominant axis) is ignored. */
export const SWIPE_THRESHOLD = 24;

/**
 * Default base player speed while a direction is held (cells per second), used
 * when no per-difficulty `baseSpeedCellsPerSec` is supplied. App wiring passes a
 * difficulty-scaled value (see `playerSpeedForDifficulty`); this constant is the
 * fallback for callers/tests that do not.
 */
export const PLAYER_SPEED_CELLS_PER_SEC = 3;

/**
 * Map a swipe delta to a logical direction, or `null` when the gesture is too small.
 * The dominant axis wins; ties resolve to the horizontal axis.
 */
export function swipeToDirection(dx: number, dy: number, threshold = SWIPE_THRESHOLD): Direction | null {
    if (Math.abs(dx) < threshold && Math.abs(dy) < threshold) return null;
    return Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up');
}

interface UsePlayerMovementProps {
    initialPosition: Position;
    maze: number[][];
    onDirectionChange?: (direction: Direction) => void;
    disabled?: boolean;
    invertControls?: boolean;
    teleportSignal?: number;
    teleportTo?: Position;
    /** Movement speed factor (the speed buff); 1 = base speed. */
    speedMultiplier?: number;
    /** Base glide speed in cells/sec (difficulty-scaled). Defaults to {@link PLAYER_SPEED_CELLS_PER_SEC}. */
    baseSpeedCellsPerSec?: number;
}

export interface PlayerMovementApi {
    /** Current player position in the maze. */
    position: Position;
    /**
     * Issue a movement command in a logical (gesture) direction. Used by the keyboard,
     * swipe gestures and the on-screen D-pad alike, so they all share one code path.
     * Moves one cell immediately, then keeps gliding while the direction stays held
     * (see {@link PlayerMovementApi.release}); a queued perpendicular command is taken
     * at the first cell where it becomes walkable (Pac-Man style buffered turns).
     */
    move: (direction: Direction) => void;
    /** Signal that a held direction was let go (keyup / D-pad pointer-up). */
    release: (direction: Direction) => void;
}

/**
 * Hook to manage player movement within a maze. Supports keyboard, swipe and an
 * on-screen D-pad (via the returned `move`/`release`). Control inversion (the
 * confuse debuff) is applied uniformly to every input source.
 *
 * Movement model: a command steps one cell immediately and marks its direction as
 * held. A fixed-rate ticker then keeps stepping while any direction is held
 * (keyboard/D-pad) or a swipe glide is active (a swipe glides until a wall or the
 * next command). The most recent command is the queued direction: each tick tries
 * the queued turn first, then falls back to the current direction.
 */
export const usePlayerMovement = ({
                                      initialPosition,
                                      maze,
                                      onDirectionChange,
                                      disabled,
                                      invertControls,
                                      teleportSignal,
                                      teleportTo,
                                      speedMultiplier = 1,
                                      baseSpeedCellsPerSec = PLAYER_SPEED_CELLS_PER_SEC,
                                  }: UsePlayerMovementProps): PlayerMovementApi => {
    const [position, setPosition] = useState(initialPosition);

    // Mirror the changing props/state into refs so the ticker never runs on a
    // stale closure without needing to restart on every render.
    const positionRef = useRef(position);
    const mazeRef = useRef(maze);
    mazeRef.current = maze;
    const disabledRef = useRef(!!disabled);
    disabledRef.current = !!disabled;
    const invertRef = useRef(!!invertControls);
    invertRef.current = !!invertControls;
    const onDirectionChangeRef = useRef(onDirectionChange);
    onDirectionChangeRef.current = onDirectionChange;
    const speedRef = useRef(speedMultiplier);
    const baseSpeedRef = useRef(baseSpeedCellsPerSec);

    // Motion state: which logical directions are physically held (key identity),
    // the effective direction we want to turn into, the effective direction we
    // are moving in, and whether a swipe glide is active. `pending` buffers a
    // tap that arrived while the ticker was mid-interval, so a quick press is
    // never swallowed even if its keyup lands before the next tick.
    const heldRef = useRef<Set<Direction>>(new Set());
    const queuedRef = useRef<Direction | null>(null);
    const currentRef = useRef<Direction | null>(null);
    const glideRef = useRef(false);
    const pendingRef = useRef(false);
    const tickerRef = useRef<number | null>(null);

    const stopTicker = useCallback(() => {
        if (tickerRef.current !== null) {
            window.clearInterval(tickerRef.current);
            tickerRef.current = null;
        }
    }, []);

    const clearMotion = useCallback(() => {
        heldRef.current.clear();
        queuedRef.current = null;
        currentRef.current = null;
        glideRef.current = false;
        pendingRef.current = false;
        stopTicker();
    }, [stopTicker]);

    // Reset the position to the initial position when it changes (syncing to an
    // external prop, e.g. the respawn after losing a life). Any ongoing motion is
    // cancelled so the player does not sprint out of the respawn cell.
    useEffect(() => {
         
        setPosition(initialPosition);
        positionRef.current = initialPosition;
        clearMotion();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [initialPosition.x, initialPosition.y]);

    // Teleport the player to the specified position when the teleport signal changes.
    useEffect(() => {
        if (teleportSignal && teleportTo) {
             
            setPosition(teleportTo);
            positionRef.current = teleportTo;
            clearMotion();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [teleportSignal, teleportTo]);

    /** Walkable neighbor in `direction`, or null (walls block; edges wrap around). */
    const cellAfterStep = useCallback((from: Position, direction: Direction): Position | null => {
        return wrapStep(mazeRef.current, from.x, from.y, direction);
    }, []);

    /**
     * Try the queued turn first, then continue in the current direction.
     * Returns true when the player stepped.
     */
    const tryStep = useCallback((): boolean => {
        const from = positionRef.current;
        const queued = queuedRef.current;
        if (queued) {
            const next = cellAfterStep(from, queued);
            if (next) {
                currentRef.current = queued;
                positionRef.current = next;
                setPosition(next);
                onDirectionChangeRef.current?.(queued);
                return true;
            }
        }
        const current = currentRef.current;
        if (current && current !== queued) {
            const next = cellAfterStep(from, current);
            if (next) {
                positionRef.current = next;
                setPosition(next);
                onDirectionChangeRef.current?.(current);
                return true;
            }
        }
        return false;
    }, [cellAfterStep]);

    const tickIntervalMs = useCallback(
        () => 1000 / (Math.max(0.1, baseSpeedRef.current) * Math.max(0.1, speedRef.current)),
        [],
    );

    const tick = useCallback(() => {
        if (disabledRef.current) {
            // Frozen or game over: halt; a new command (or the disabled flag
            // clearing while a direction is still held) restarts the glide.
            stopTicker();
            return;
        }
        if (!glideRef.current && heldRef.current.size === 0 && !pendingRef.current) {
            stopTicker();
            return;
        }
        const stepped = tryStep();
        if (stepped) {
            pendingRef.current = false;
        } else {
            // A glide ends at the wall; a buffered tap against a wall is dropped;
            // held keys keep retrying (a queued turn can still open up while the
            // player pushes against the wall).
            glideRef.current = false;
            pendingRef.current = false;
            if (heldRef.current.size === 0) stopTicker();
        }
    }, [stopTicker, tryStep]);

    const startTicker = useCallback(() => {
        stopTicker();
        tickerRef.current = window.setInterval(tick, tickIntervalMs());
    }, [stopTicker, tick, tickIntervalMs]);

    // Speed changes (the speed buff, or a difficulty-scaled base speed) re-pace an
    // already-running glide.
    useEffect(() => {
        speedRef.current = speedMultiplier;
        baseSpeedRef.current = baseSpeedCellsPerSec;
        if (tickerRef.current !== null) startTicker();
    }, [speedMultiplier, baseSpeedCellsPerSec, startTicker]);

    // When the freeze window ends while a direction is still held, resume the glide.
    useEffect(() => {
        if (
            !disabled &&
            tickerRef.current === null &&
            (glideRef.current || heldRef.current.size > 0 || pendingRef.current)
        ) {
            startTicker();
        }
    }, [disabled, startTicker]);

    /** Shared command path: apply inversion, step once, and keep the glide going. */
    const command = useCallback((direction: Direction, source: 'hold' | 'swipe') => {
        if (disabledRef.current) return;
        const effective = invertRef.current ? OPPOSITE[direction] : direction;
        queuedRef.current = effective;
        pendingRef.current = true;
        if (source === 'hold') {
            heldRef.current.add(direction);
            glideRef.current = false;
        } else {
            glideRef.current = true;
        }
        if (tickerRef.current === null) {
            // First command: step immediately for responsiveness, then glide on
            // the fixed tick. While the ticker runs, extra presses are buffered
            // (`pending`) — mashing keys can no longer outrun the tick rate, but
            // a quick tap is never lost.
            if (tryStep()) pendingRef.current = false;
            startTicker();
        }
    }, [startTicker, tryStep]);

    const move = useCallback((direction: Direction) => command(direction, 'hold'), [command]);

    const release = useCallback((direction: Direction) => {
        heldRef.current.delete(direction);
        // Fall back to the most recent still-held direction so releasing the
        // queued key resumes the other held one.
        const rest = [...heldRef.current];
        if (rest.length > 0) {
            const logical = rest[rest.length - 1];
            queuedRef.current = invertRef.current ? OPPOSITE[logical] : logical;
        }
        // The ticker stops itself once nothing is held and no glide is active.
    }, []);

    // Keyboard input: keydown holds a direction, keyup releases it. OS key-repeat
    // is ignored — the ticker owns the cadence.
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            const direction = KEY_TO_DIRECTION[e.key];
            if (!direction || e.repeat) return;
            move(direction);
        };
        const handleKeyUp = (e: KeyboardEvent) => {
            const direction = KEY_TO_DIRECTION[e.key];
            if (direction) release(direction);
        };
        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
        };
    }, [move, release]);

    // Swipe input (touch): a swipe starts a glide that lasts until a wall or the
    // next command (standard mobile Pac-Man feel).
    useEffect(() => {
        let startX = 0;
        let startY = 0;
        let tracking = false;

        const onTouchStart = (e: TouchEvent) => {
            const touch = e.changedTouches[0];
            if (!touch) return;
            startX = touch.clientX;
            startY = touch.clientY;
            tracking = true;
        };

        const onTouchEnd = (e: TouchEvent) => {
            if (!tracking) return;
            tracking = false;
            const touch = e.changedTouches[0];
            if (!touch) return;
            const direction = swipeToDirection(touch.clientX - startX, touch.clientY - startY);
            if (direction) command(direction, 'swipe');
        };

        window.addEventListener('touchstart', onTouchStart, {passive: true});
        window.addEventListener('touchend', onTouchEnd, {passive: true});
        return () => {
            window.removeEventListener('touchstart', onTouchStart);
            window.removeEventListener('touchend', onTouchEnd);
        };
    }, [command]);

    // Never leave the interval running after unmount.
    useEffect(() => stopTicker, [stopTicker]);

    return {position, move, release};
};

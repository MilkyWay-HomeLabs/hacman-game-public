/**
 * Hook: useGameInitializer
 * Initializes the game state based on the provided maze data.
 * Supports both production and test environments by allowing test data injection.
 *
 * @param {MazeData | null} [injectedMaze] Optional maze to initialize from (e.g. an
 *   API-sourced level chosen in the difficulty dialog). When omitted, falls back to
 *   test-injected data or the static dev testMaze.
 *
 * @returns {Object} An object containing:
 * - `mazeData`: The maze data used for initialization.
 * - `activeDots`: A set of positions for active dots.
 * - `enemyPositions`: A map of enemy positions to their styles.
 * - `buffPositions`: A map of buff positions to their styles.
 * - `debuffPositions`: A map of debuff positions to their styles.
 * - `buffMetaAt`: Metadata for buffs at specific positions.
 * - `debuffMetaAt`: Metadata for debuffs at specific positions.
 * - `initialTotalDots`: The total number of dots at the start.
 * - `difficulty`: The difficulty level of the maze.
 * - `timerDuration`: The timer duration based on difficulty.
 */
import {useMemo} from 'react';
import type {Buff, Debuff, MazeData} from '../types/maze.ts';
import {testMaze as staticTestMaze} from '../test/testMaze';
import {timerDurationForDifficulty} from '../domain/score';

declare global {
    // Optional test hook: lets tests inject a maze module in place of the static dev maze.
    var __TEST_MAZE_MODULE: { testMaze: MazeData } | undefined;
}

/** The static/injected maze may carry a dev-only fixed-seed flag not present on MazeData. */
type SourceMaze = MazeData & { use_fixed_seed?: boolean };

export const useGameInitializer = (injectedMaze?: MazeData | null) =>
    useMemo(() => {
        // Source precedence: an explicitly provided maze (API-sourced) wins; otherwise
        // fall back to test-injected data (__TEST_MAZE_MODULE) and finally the static
        // dev testMaze. This lets the difficulty dialog feed a selected level in.
        const maybeModule = globalThis.__TEST_MAZE_MODULE ?? {testMaze: staticTestMaze};
        const fallbackMaze = maybeModule.testMaze ?? staticTestMaze;
        const testMaze = (injectedMaze ?? fallbackMaze) as SourceMaze;
        const data: MazeData = testMaze;

        // Utility function to generate a unique hash for a position
        const hash = (x: number, y: number) => `${x}-${y}`;

        // Seed setup for random number generation
        const fixedSeed = testMaze.random_seed;
        const useFixed = Boolean(testMaze.use_fixed_seed);
        const seed: number =
            useFixed && typeof fixedSeed === 'number'
                ? fixedSeed
                // eslint-disable-next-line react-hooks/purity -- a one-time PRNG seed inside useMemo
                : Date.now() ^ Math.floor(Math.random() * 0x7fffffff);

        // Mulberry32 PRNG implementation
        const mulberry32 = (s: number) => {
            return function () {
                let t = (s += 0x6d2b79f5);
                t = Math.imul(t ^ (t >>> 15), t | 1);
                t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
                return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
            };
        };
        const rng = mulberry32(seed ^ 0xe11);

        // Placement rules
        const placementAllowedOn: 'road' | 'wall' =
            testMaze.placement_rules?.allowed_on ?? 'road';
        const avoidAdjacentWalls: boolean = Boolean(
            testMaze.placement_rules?.avoid_adjacent_walls
        );

        /**
         * Builds a list of candidate positions for placing objects.
         *
         * @param {Set<string>} occupied - A set of already occupied positions.
         * @returns {Array<{x: number, y: number}>} List of candidate positions.
         */
        const buildCandidates = (occupied: Set<string>): Array<{ x: number; y: number; }> => {
            const candidates: { x: number; y: number }[] = [];
            const rows = data.cells.length;
            for (let y = 0; y < rows; y++) {
                const row = data.cells[y];
                if (!row) continue; // Skip undefined rows
                const cols = row.length;
                for (let x = 0; x < cols; x++) {
                    const cell = row[x];
                    const isRoad = cell === 0;
                    if (placementAllowedOn === 'road' && !isRoad) continue;
                    if (placementAllowedOn === 'wall' && isRoad) continue;
                    const key = hash(x, y);
                    if (occupied.has(key)) continue;
                    if (avoidAdjacentWalls) {
                        const n = data.cells[y - 1]?.[x];
                        const s = data.cells[y + 1]?.[x];
                        const w = data.cells[y]?.[x - 1];
                        const e = data.cells[y]?.[x + 1];
                        if ([n, s, w, e].some(v => v === 1)) continue;
                    }
                    candidates.push({x, y});
                }
            }
            return candidates;
        };

        // Initialize occupied positions
        const occupied = new Set<string>();
        const startPos = data.player?.start_position || {x: 0, y: 0};
        occupied.add(hash(startPos.x, startPos.y));
        (data.enemies || []).forEach(e =>
            e.static_positions?.forEach(p => occupied.add(hash(p.x, p.y)))
        );
        (data.buffs || []).forEach(b =>
            b.static_positions?.forEach(p => occupied.add(hash(p.x, p.y)))
        );
        (data.debuffs || []).forEach(d =>
            d.static_positions?.forEach(p => occupied.add(hash(p.x, p.y)))
        );
        (data.dots?.static_positions || []).forEach(p => occupied.add(hash(p.x, p.y)));

        /**
         * Returns the default style for a given enemy type.
         *
         * @param {string} type - The type of the enemy.
         * @returns {string} The default style class.
         */
        const defaultStyleForType = (type: string): string => {
            switch (type) {
                case 'ghost':
                    return 'enemy-1';
                case 'scorpion':
                    return 'enemy-6';
                case 'patroller':
                    return 'enemy-7';
                default:
                    return 'enemy-3';
            }
        };

        // Map enemy positions to their styles
        const enemyMap = new Map<string, string>();
        (data.enemies || []).forEach(e => {
            const styleClass = e.style || defaultStyleForType(e.type);
            e.static_positions?.forEach(p => enemyMap.set(hash(p.x, p.y), styleClass));
        });

        // Place random enemies
        for (const enemy of (data.enemies || [])) {
            let toPlace = Math.max(0, enemy.random_count | 0);
            if (toPlace <= 0) continue;
            const candidates = buildCandidates(occupied);
            while (toPlace > 0 && candidates.length > 0) {
                const idx = Math.floor(rng() * candidates.length);
                const {x, y} = candidates[idx];
                const key = hash(x, y);
                const styleClass = enemy.style || defaultStyleForType(enemy.type);
                enemyMap.set(key, styleClass);
                occupied.add(key);
                candidates[idx] = candidates[candidates.length - 1];
                candidates.pop();
                toPlace--;
            }
        }

        /**
         * Returns the default style for a given buff type.
         *
         * @param {string} type - The type of the buff.
         * @returns {string} The default style class.
         */
        const defaultBuffStyleForType = (type: string): string => {
            switch (type) {
                case 'teleport':
                    return 'buff-6';
                case 'shield':
                    return 'buff-3';
                case 'speed':
                    return 'buff-2';
                case 'time':
                    return 'buff-7';
                default:
                    return 'buff-5';
            }
        };

        // Map buff positions to their styles and metadata
        const buffMap = new Map<string, string>();
        const buffMeta = new Map<string, Buff>();
        (data.buffs || []).forEach(b => {
            const styleClass = b.style || defaultBuffStyleForType(b.type);
            b.static_positions?.forEach(p => {
                const key = hash(p.x, p.y);
                buffMap.set(key, styleClass);
                buffMeta.set(key, b);
            });
        });

        // Place random buffs
        for (const buff of (data.buffs || [])) {
            let toPlace = Math.max(0, buff.random_count | 0);
            if (toPlace <= 0) continue;
            const candidates = buildCandidates(occupied);
            while (toPlace > 0 && candidates.length > 0) {
                const idx = Math.floor(rng() * candidates.length);
                const {x, y} = candidates[idx];
                const key = hash(x, y);
                const styleClass = buff.style || defaultBuffStyleForType(buff.type);
                buffMap.set(key, styleClass);
                buffMeta.set(key, buff);
                occupied.add(key);
                candidates[idx] = candidates[candidates.length - 1];
                candidates.pop();
                toPlace--;
            }
        }

        /**
         * Returns the default style for a given debuff type, mirroring the
         * style→effect mapping in applyDebuffEffect. Unknown types fall back to
         * the mild "slow" variant (never the lethal spike) so an unstyled
         * debuff stays visible without becoming a death trap.
         *
         * @param {string} type - The type of the debuff.
         * @returns {string} The default style class.
         */
        const defaultDebuffStyleForType = (type?: string): string => {
            switch (type) {
                case 'poison':
                    return 'debuff-1';
                case 'slow':
                    return 'debuff-2';
                case 'blind':
                    return 'debuff-3';
                case 'burn':
                    return 'debuff-4';
                case 'drain':
                    return 'debuff-5';
                case 'confuse':
                    return 'debuff-6';
                case 'spike':
                    return 'debuff-7';
                case 'freeze':
                    return 'debuff-8';
                case 'rust':
                    return 'debuff-9';
                case 'glitch':
                    return 'debuff-10';
                default:
                    return 'debuff-2';
            }
        };

        // Map debuff positions to their styles and metadata
        const debuffMap = new Map<string, string>();
        const debuffMeta = new Map<string, Debuff>();
        (data.debuffs || []).forEach(d => {
            const styleClass = d.style || defaultDebuffStyleForType(d.type);
            d.static_positions?.forEach(p => {
                const key = hash(p.x, p.y);
                debuffMap.set(key, styleClass);
                debuffMeta.set(key, d);
            });
        });

        // Place random debuffs
        for (const debuff of (data.debuffs || [])) {
            let toPlace = Math.max(0, debuff.random_count | 0);
            if (toPlace <= 0) continue;
            const candidates = buildCandidates(occupied);
            while (toPlace > 0 && candidates.length > 0) {
                const idx = Math.floor(rng() * candidates.length);
                const {x, y} = candidates[idx];
                const key = hash(x, y);
                const styleClass = debuff.style || defaultDebuffStyleForType(debuff.type);
                debuffMap.set(key, styleClass);
                debuffMeta.set(key, debuff);
                occupied.add(key);
                candidates[idx] = candidates[candidates.length - 1];
                candidates.pop();
                toPlace--;
            }
        }

        // Initialize dots
        const dotsSet = new Set<string>();
        (data.dots?.static_positions || []).forEach(dot => dotsSet.add(hash(dot.x, dot.y)));

        // Place random dots
        const randomCount: number = testMaze.dots?.random_count ?? 0;
        const candidates = buildCandidates(occupied);
        let toPlace = Math.max(0, Math.min(randomCount, candidates.length));
        while (toPlace > 0 && candidates.length > 0) {
            const idx = Math.floor(rng() * candidates.length);
            const {x, y} = candidates[idx];
            const key = hash(x, y);
            dotsSet.add(key);
            occupied.add(key);
            candidates[idx] = candidates[candidates.length - 1];
            candidates.pop();
            toPlace--;
        }

        // Determine difficulty and timer duration
        const difficulty = testMaze.difficulty || 'easy';
        const timerDuration = timerDurationForDifficulty(difficulty);

        // Return the initialized game state
        return {
            mazeData: data,
            activeDots: dotsSet,
            enemyPositions: enemyMap,
            buffPositions: buffMap,
            debuffPositions: debuffMap,
            buffMetaAt: buffMeta,
            debuffMetaAt: debuffMeta,
            initialTotalDots: dotsSet.size,
            difficulty,
            timerDuration,
        };
    }, [injectedMaze]);
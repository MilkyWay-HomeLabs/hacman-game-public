import type {MazeConfig, MazeData, Position} from '../types/maze';

/**
 * MazeGenerator
 *
 * Generates a maze using recursive backtracking and places items deterministically
 * when given a seed. All randomness is driven by an internal seeded PRNG.
 */
export class MazeGenerator {
    private static readonly ROAD_CELL = 0;
    private static readonly WALL_CELL = 1;

    private readonly width: number;
    private readonly height: number;
    private readonly cells: number[][];
    private readonly rng: () => number;
    private readonly seedValue: number;

    /**
     * Create a new MazeGenerator.
     * @param width - maze width in cells
     * @param height - maze height in cells
     * @param seed - optional numeric seed for deterministic generation (defaults to Date.now())
     */
    constructor(width: number, height: number, seed?: number) {
        this.width = width;
        this.height = height;
        this.cells = Array.from({length: height}, () =>
            Array.from({length: width}, () => MazeGenerator.WALL_CELL)
        );
        this.seedValue = typeof seed === 'number' ? seed >>> 0 : (Date.now() >>> 0);
        this.rng = this.createSeededRng(this.seedValue);
    }

    /**
     * Create a seeded pseudorandom number generator.
     * Uses a Mulberry32-like function to produce uniform numbers in [0,1).
     */
    private createSeededRng(seed: number): () => number {
        // Keep seed as 32-bit unsigned
        let s = seed >>> 0;
        return () => {
            s |= 0;
            s = (s + 0x6d2b79f5) | 0;
            let t = Math.imul(s ^ (s >>> 15), 1 | s);
            t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
            return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
        };
    }

    /**
     * Generate the maze using recursive backtracking.
     * Returns a 2D array of cells where 0 = road and 1 = wall.
     */
    generate(): number[][] {
        const stack: Position[] = [];
        const startX = 1;
        const startY = 1;

        if (startY >= this.height || startX >= this.width) {
            // nothing to do for too-small mazes
            return this.cells;
        }

        this.cells[startY][startX] = MazeGenerator.ROAD_CELL;
        stack.push({x: startX, y: startY});

        const directions = [
            {dx: 0, dy: -2}, // up
            {dx: 2, dy: 0}, // right
            {dx: 0, dy: 2}, // down
            {dx: -2, dy: 0}, // left
        ];

        while (stack.length > 0) {
            const current = stack[stack.length - 1];
            const neighbors: Array<{ pos: Position; wall: Position }> = [];

            for (const dir of directions) {
                const nx = current.x + dir.dx;
                const ny = current.y + dir.dy;
                const wx = current.x + dir.dx / 2;
                const wy = current.y + dir.dy / 2;

                if (nx > 0 && nx < this.width - 1 && ny > 0 && ny < this.height - 1) {
                    if (this.cells[ny][nx] === MazeGenerator.WALL_CELL) {
                        neighbors.push({
                            pos: {x: nx, y: ny},
                            wall: {x: wx, y: wy},
                        });
                    }
                }
            }

            if (neighbors.length > 0) {
                const idx = Math.floor(this.rng() * neighbors.length);
                const chosen = neighbors[idx];
                if (chosen && chosen.pos && chosen.wall) {
                    this.cells[chosen.pos.y][chosen.pos.x] = MazeGenerator.ROAD_CELL;
                    this.cells[chosen.wall.y][chosen.wall.x] = MazeGenerator.ROAD_CELL;
                    stack.push(chosen.pos);
                } else {
                    stack.pop();
                }
            } else {
                stack.pop();
            }
        }

        return this.cells;
    }

    /**
     * Return all free road cells as Position[].
     */
    getFreeRoadCells(): Position[] {
        const freeCells: Position[] = [];
        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                if (this.cells[y][x] === MazeGenerator.ROAD_CELL) {
                    freeCells.push({x, y});
                }
            }
        }
        return freeCells;
    }

    /**
     * Place `count` objects randomly on free road cells, avoiding occupiedPositions.
     * Uses the instance RNG for deterministic placement.
     * @param count - number of positions to place
     * @param occupiedPositions - Set of "x,y" strings to avoid
     */
    placeRandomObjects(count: number, occupiedPositions: Set<string>): Position[] {
        const available = this.getFreeRoadCells().filter(
            (p) => !occupiedPositions.has(`${p.x},${p.y}`)
        );

        // Shuffle available cells using Fisher-Yates with instance RNG
        for (let i = available.length - 1; i > 0; i--) {
            const j = Math.floor(this.rng() * (i + 1));
            const tmp = available[i];
            available[i] = available[j];
            available[j] = tmp;
        }

        const placed: Position[] = [];
        for (let i = 0; i < count && i < available.length; i++) {
            const pos = available[i];
            placed.push(pos);
            occupiedPositions.add(`${pos.x},${pos.y}`);
        }
        return placed;
    }

    /**
     * Build a MazeData object from a MazeConfig.
     * This uses the current `cells` layout and places dots deterministically when requested.
     */
    buildMazeData(config: MazeConfig): MazeData {
        const mazeData: MazeData = {
            width: this.width,
            height: this.height,
            cells: this.cells,
            player: {
                start_position: config.player.start_position,
                direction: config.player.direction as 'up' | 'down' | 'left' | 'right',
            },
            enemies: [],
            buffs: [],
            debuffs: [],
            dots: {
                static_positions: [],
                random_count: 0,
            },
            random_seed: this.seedValue,
            placement_rules: {
                allowed_on: 'road',
                avoid_adjacent_walls: false,
            },
        };

        const cfgDots = config.dots ?? {static_positions: [], random_count: 0};

        if (cfgDots.random_count > 0) {
            const pathCells = this.getFreeRoadCells();

            // Shuffle deterministically using instance RNG
            for (let i = pathCells.length - 1; i > 0; i--) {
                const j = Math.floor(this.rng() * (i + 1));
                const tmp = pathCells[i];
                pathCells[i] = pathCells[j];
                pathCells[j] = tmp;
            }

            const selected = pathCells.slice(0, Math.min(cfgDots.random_count, pathCells.length));
            mazeData.dots.static_positions = [...(cfgDots.static_positions || []), ...selected];
            mazeData.dots.random_count = cfgDots.random_count;
        } else {
            mazeData.dots.static_positions = cfgDots.static_positions || [];
            mazeData.dots.random_count = 0;
        }

        // The rest of object placement for enemies, buffs, debuffs can be added here
        return mazeData;
    }
}
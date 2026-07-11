// Co-located type declaration for the static dev maze (`testMaze.js`).
import type { MazeData } from '../types/maze';

export const testMaze: MazeData & {
    random_seed?: number;
    use_fixed_seed?: boolean;
    placement_rules?: { allowed_on?: 'road' | 'wall'; avoid_adjacent_walls?: boolean };
    difficulty?: 'easy' | 'medium' | 'hard';
};

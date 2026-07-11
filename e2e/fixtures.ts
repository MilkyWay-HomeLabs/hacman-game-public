// Network-level fixtures for the E2E suite. Kept deliberately standalone (plain data,
// no imports from `src`) so the tests exercise the app exactly as the browser sees it.

export const GALLERY_ID = '5250215a-521f-4a8b-aba9-c8325cf47615';

/** API base the built app calls (VITE_API_BASE_URL); routes are matched under it. */
export const API_GLOB = '**/hacman/api/v1';

// A 5x3 corridor (1 = wall, 0 = road). The player starts at (1,1) with two dots one and
// two cells to the right, and no enemies — so two ArrowRight presses collect every dot
// and win the level deterministically.
const GRID = [
  [1, 1, 1, 1, 1],
  [1, 0, 0, 0, 1],
  [1, 1, 1, 1, 1],
];

function level(difficulty: 'EASY' | 'MEDIUM' | 'HARD', id: number) {
  return {
    id,
    galleryId: GALLERY_ID,
    difficulty,
    width: 5,
    height: 3,
    randomSeed: id,
    placementAllowedOn: 'road',
    placementAvoidAdjWalls: false,
    cells: GRID,
    playerStartX: 1,
    playerStartY: 1,
    playerDirection: 'right',
    dots: { static: [[2, 1], [3, 1]], random_count: 0 },
    enemies: [],
    buffs: [],
    debuffs: [],
    notes: 'e2e winnable fixture',
  };
}

/** The three difficulty levels the maze endpoint is contracted to return. */
export const winnableLevels = [level('EASY', 1), level('MEDIUM', 2), level('HARD', 3)];

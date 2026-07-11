// Derives a maze cell size (px) that fits the current viewport, replacing the old
// fixed 16px. The board is `cols × rows` cells; we shrink cells so the whole board fits
// within the space left after the app chrome (title, panels, paddings, frame), keeping the
// result an integer for crisp rendering and clamped to a sensible range.

import { useEffect, useState } from 'react';

export const MAX_CELL_SIZE = 16;
export const MIN_CELL_SIZE = 6;

/** Below this viewport width the status panel stacks under the board (see App.css). */
export const STACK_BREAKPOINT = 900;

// Approximate non-board chrome (px) reserved around the maze in each layout, derived from
// the App.css spacing: app padding, game-area padding, the ~260px side panel + gap (row
// layout only), the title, and the maze-frame padding/border.
const ROW_HORIZONTAL_CHROME = 382; // paddings + panel(260) + gap + frame
const ROW_VERTICAL_CHROME = 162; // app padding + title + frame
const STACK_HORIZONTAL_CHROME = 102; // paddings + frame (panel is below)
const STACK_VERTICAL_CHROME = 382; // app padding + title + stacked panel + gap + frame

export interface CellSizeInput {
  cols: number;
  rows: number;
  viewportWidth: number;
  viewportHeight: number;
}

/** Pure: the largest integer cell size (clamped) that fits the board in the viewport. */
export function computeCellSize({ cols, rows, viewportWidth, viewportHeight }: CellSizeInput): number {
  if (cols <= 0 || rows <= 0) return MAX_CELL_SIZE;

  const stacked = viewportWidth <= STACK_BREAKPOINT;
  const horizontalChrome = stacked ? STACK_HORIZONTAL_CHROME : ROW_HORIZONTAL_CHROME;
  const verticalChrome = stacked ? STACK_VERTICAL_CHROME : ROW_VERTICAL_CHROME;

  const availableWidth = Math.max(0, viewportWidth - horizontalChrome);
  const availableHeight = Math.max(0, viewportHeight - verticalChrome);

  const fit = Math.floor(Math.min(availableWidth / cols, availableHeight / rows));
  return Math.max(MIN_CELL_SIZE, Math.min(MAX_CELL_SIZE, fit));
}

function currentViewport(): { viewportWidth: number; viewportHeight: number } {
  return { viewportWidth: window.innerWidth, viewportHeight: window.innerHeight };
}

/**
 * Reactive cell size for the current viewport. Recomputes on resize and whenever the
 * board dimensions change. Falls back to {@link MAX_CELL_SIZE} until a board is known.
 */
export function useResponsiveCellSize(cols?: number, rows?: number): number {
  const [cellSize, setCellSize] = useState(() =>
    computeCellSize({ cols: cols ?? 0, rows: rows ?? 0, ...currentViewport() }),
  );

  useEffect(() => {
    if (!cols || !rows) return;
    const update = () => setCellSize(computeCellSize({ cols, rows, ...currentViewport() }));
    // Sync once for the current board/viewport, then track resizes (external system).
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, [cols, rows]);

  return cellSize;
}

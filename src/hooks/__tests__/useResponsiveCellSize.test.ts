import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import {
  MAX_CELL_SIZE,
  MIN_CELL_SIZE,
  computeCellSize,
  useResponsiveCellSize,
} from '../useResponsiveCellSize';

function setViewport(width: number, height: number) {
  Object.defineProperty(window, 'innerWidth', { value: width, configurable: true });
  Object.defineProperty(window, 'innerHeight', { value: height, configurable: true });
}

describe('computeCellSize', () => {
  it('falls back to the max size when the board is unknown', () => {
    expect(computeCellSize({ cols: 0, rows: 0, viewportWidth: 1920, viewportHeight: 1080 })).toBe(
      MAX_CELL_SIZE,
    );
  });

  it('caps at the max size on a large desktop viewport', () => {
    expect(
      computeCellSize({ cols: 25, rows: 27, viewportWidth: 1920, viewportHeight: 1080 }),
    ).toBe(MAX_CELL_SIZE);
  });

  it('clamps to the min size on a small phone with the largest board', () => {
    const size = computeCellSize({ cols: 39, rows: 35, viewportWidth: 360, viewportHeight: 640 });
    expect(size).toBe(MIN_CELL_SIZE);
    // The board must fit within the viewport width (no horizontal scroll).
    expect(39 * size).toBeLessThanOrEqual(360);
  });

  it('returns an integer intermediate size when height-constrained', () => {
    // Row layout (wide), but a short viewport limits by height: 350/35 = 10.
    expect(
      computeCellSize({ cols: 39, rows: 35, viewportWidth: 1600, viewportHeight: 512 }),
    ).toBe(10);
  });

  it('never exceeds the width budget across the 360–1920px range', () => {
    for (let vw = 360; vw <= 1920; vw += 20) {
      const size = computeCellSize({ cols: 39, rows: 35, viewportWidth: vw, viewportHeight: 900 });
      expect(Number.isInteger(size)).toBe(true);
      expect(size).toBeGreaterThanOrEqual(MIN_CELL_SIZE);
      expect(size).toBeLessThanOrEqual(MAX_CELL_SIZE);
    }
  });
});

describe('useResponsiveCellSize', () => {
  afterEach(() => {
    setViewport(1024, 768);
  });

  it('returns the max size for a small board on a roomy viewport', () => {
    setViewport(1600, 1000);
    const { result } = renderHook(() => useResponsiveCellSize(25, 27));
    expect(result.current).toBe(MAX_CELL_SIZE);
  });

  it('recomputes on window resize', () => {
    setViewport(1600, 1000);
    const { result } = renderHook(() => useResponsiveCellSize(39, 35));
    expect(result.current).toBe(MAX_CELL_SIZE);

    act(() => {
      setViewport(360, 640);
      window.dispatchEvent(new Event('resize'));
    });
    expect(result.current).toBe(MIN_CELL_SIZE);
  });
});

import { describe, expect, it, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useScoreSubmission, type UseScoreSubmissionParams } from '../useScoreSubmission';

const base: UseScoreSubmissionParams = {
  won: false,
  galleryId: 'g-1',
  difficulty: 'medium',
  timeMs: 12000,
};

describe('useScoreSubmission', () => {
  it('stays idle and does not submit while not won', () => {
    const submit = vi.fn().mockResolvedValue({ newlyUnlockedAchievements: [] });
    const { result } = renderHook((p: UseScoreSubmissionParams) => useScoreSubmission(p), {
      initialProps: { ...base, submit },
    });

    expect(result.current.status).toBe('idle');
    expect(submit).not.toHaveBeenCalled();
  });

  it('submits once when won becomes true and reaches success', async () => {
    const submit = vi.fn().mockResolvedValue({ newlyUnlockedAchievements: [] });
    const { result, rerender } = renderHook((p: UseScoreSubmissionParams) => useScoreSubmission(p), {
      initialProps: { ...base, submit },
    });

    rerender({ ...base, won: true, submit });

    await waitFor(() => expect(result.current.status).toBe('success'));
    expect(submit).toHaveBeenCalledTimes(1);
    expect(submit).toHaveBeenCalledWith({
      galleryId: 'g-1',
      difficulty: 'medium',
      timeMs: 12000,
      enemiesDefeated: 0,
      buffsCollected: 0,
      hitsTaken: 0,
    });
  });

  it('does not submit twice across re-renders while won stays true', async () => {
    const submit = vi.fn().mockResolvedValue({ newlyUnlockedAchievements: [] });
    const { result, rerender } = renderHook((p: UseScoreSubmissionParams) => useScoreSubmission(p), {
      initialProps: { ...base, won: true, submit },
    });

    await waitFor(() => expect(result.current.status).toBe('success'));
    rerender({ ...base, won: true, submit });
    rerender({ ...base, won: true, timeMs: 99999, submit });

    expect(submit).toHaveBeenCalledTimes(1);
  });

  it('captures the elapsed time at the moment of winning', async () => {
    const submit = vi.fn().mockResolvedValue({ newlyUnlockedAchievements: [] });
    const { result, rerender } = renderHook((p: UseScoreSubmissionParams) => useScoreSubmission(p), {
      initialProps: { ...base, timeMs: 5000, submit },
    });

    // Time advances, then the win happens at 8000ms.
    rerender({ ...base, timeMs: 8000, submit });
    rerender({ ...base, won: true, timeMs: 8000, submit });

    await waitFor(() => expect(result.current.status).toBe('success'));
    expect(submit).toHaveBeenCalledWith(expect.objectContaining({ timeMs: 8000 }));
  });

  it('captures the gameplay-telemetry counters at the moment of winning', async () => {
    const submit = vi.fn().mockResolvedValue({ newlyUnlockedAchievements: [] });
    const { rerender, result } = renderHook((p: UseScoreSubmissionParams) => useScoreSubmission(p), {
      initialProps: { ...base, enemiesDefeated: 1, buffsCollected: 2, hitsTaken: 0, submit },
    });

    // Counters keep changing after the win render but must not affect the already-captured
    // submission, mirroring how timeMs is frozen at the win instant.
    rerender({ ...base, won: true, enemiesDefeated: 1, buffsCollected: 2, hitsTaken: 0, submit });
    rerender({ ...base, won: true, enemiesDefeated: 5, buffsCollected: 9, hitsTaken: 3, submit });

    await waitFor(() => expect(result.current.status).toBe('success'));
    expect(submit).toHaveBeenCalledTimes(1);
    expect(submit).toHaveBeenCalledWith(
      expect.objectContaining({ enemiesDefeated: 1, buffsCollected: 2, hitsTaken: 0 }),
    );
  });

  it('defaults omitted gameplay-telemetry counters to zero', async () => {
    const submit = vi.fn().mockResolvedValue({ newlyUnlockedAchievements: [] });
    const { result } = renderHook((p: UseScoreSubmissionParams) => useScoreSubmission(p), {
      initialProps: { ...base, won: true, submit },
    });

    await waitFor(() => expect(result.current.status).toBe('success'));
    expect(submit).toHaveBeenCalledWith(
      expect.objectContaining({ enemiesDefeated: 0, buffsCollected: 0, hitsTaken: 0 }),
    );
  });

  it('surfaces an error and retry re-submits successfully', async () => {
    const submit = vi
      .fn()
      .mockRejectedValueOnce(new Error('network down'))
      .mockResolvedValueOnce({ newlyUnlockedAchievements: [] });
    const { result, rerender } = renderHook((p: UseScoreSubmissionParams) => useScoreSubmission(p), {
      initialProps: { ...base, won: true, submit },
    });

    await waitFor(() => expect(result.current.status).toBe('error'));
    expect(result.current.error).toBe('network down');

    result.current.retry();
    rerender({ ...base, won: true, submit });

    await waitFor(() => expect(result.current.status).toBe('success'));
    expect(submit).toHaveBeenCalledTimes(2);
  });

  it('does not submit when galleryId is missing', async () => {
    const submit = vi.fn().mockResolvedValue({ newlyUnlockedAchievements: [] });
    const { result } = renderHook((p: UseScoreSubmissionParams) => useScoreSubmission(p), {
      initialProps: { ...base, won: true, galleryId: null, submit },
    });

    // Give any (unwanted) async submission a chance to run.
    await Promise.resolve();
    expect(submit).not.toHaveBeenCalled();
    expect(result.current.status).toBe('idle');
  });
});

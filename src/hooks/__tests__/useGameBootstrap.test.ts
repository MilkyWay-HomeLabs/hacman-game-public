import { describe, expect, it, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useGameBootstrap } from '../useGameBootstrap';
import { mapMazeLevel } from '../../api/mappers/maze';
import { mazeLevelsDto } from '../../api/__tests__/fixtures/mazeLevels';
import { ApiError } from '../../api/types';
import type { GalleryInfo } from '../../api/mappers/gallery';

const VALID_ID = '5250215a-521f-4a8b-aba9-c8325cf47615';
const LEVELS = mazeLevelsDto.map(mapMazeLevel);
const GALLERY: GalleryInfo = { id: 1, title: 'Gallery 1', imageCount: 10 };

describe('useGameBootstrap', () => {
  it('loads then reaches ready with the fetched levels and gallery info', async () => {
    const fetchLevels = vi.fn().mockResolvedValue(LEVELS);
    const fetchGallery = vi.fn().mockResolvedValue(GALLERY);

    const { result } = renderHook(() =>
      useGameBootstrap({
        search: `?galleryId=${VALID_ID}&title=Gallery%201`,
        fetchLevels,
        fetchGallery,
      }),
    );

    expect(result.current.status).toBe('loading');

    await waitFor(() => expect(result.current.status).toBe('ready'));

    expect(fetchLevels).toHaveBeenCalledWith(VALID_ID);
    expect(fetchGallery).toHaveBeenCalledWith(VALID_ID);
    if (result.current.status === 'ready') {
      expect(result.current.galleryId).toBe(VALID_ID);
      expect(result.current.title).toBe('Gallery 1');
      expect(result.current.levels).toHaveLength(3);
      expect(result.current.gallery).toEqual(GALLERY);
    }
  });

  it('still reaches ready with gallery null when the gallery lookup fails (fail-soft)', async () => {
    const fetchLevels = vi.fn().mockResolvedValue(LEVELS);
    const fetchGallery = vi
      .fn()
      .mockRejectedValue(new ApiError({ status: 500, message: 'gallery boom' }));

    const { result } = renderHook(() =>
      useGameBootstrap({ search: `?galleryId=${VALID_ID}`, fetchLevels, fetchGallery }),
    );

    await waitFor(() => expect(result.current.status).toBe('ready'));
    if (result.current.status === 'ready') {
      expect(result.current.gallery).toBeNull();
      expect(result.current.levels).toHaveLength(3);
    }
  });

  it('errors with kind "params" and never fetches when galleryId is missing', async () => {
    const fetchLevels = vi.fn();
    const fetchGallery = vi.fn();

    const { result } = renderHook(() =>
      useGameBootstrap({ search: '?title=Whatever', fetchLevels, fetchGallery }),
    );

    await waitFor(() => expect(result.current.status).toBe('error'));
    if (result.current.status === 'error') {
      expect(result.current.kind).toBe('params');
    }
    expect(fetchLevels).not.toHaveBeenCalled();
    expect(fetchGallery).not.toHaveBeenCalled();
  });

  it('errors with kind "params" for an invalid galleryId', async () => {
    const fetchLevels = vi.fn();

    const { result } = renderHook(() =>
      useGameBootstrap({ search: '?galleryId=not-a-uuid', fetchLevels, fetchGallery: vi.fn() }),
    );

    await waitFor(() => expect(result.current.status).toBe('error'));
    if (result.current.status === 'error') {
      expect(result.current.kind).toBe('params');
    }
    expect(fetchLevels).not.toHaveBeenCalled();
  });

  it('errors with kind "api" when the levels fetch rejects', async () => {
    const fetchLevels = vi.fn().mockRejectedValue(new ApiError({ status: 500, message: 'boom' }));
    const fetchGallery = vi.fn().mockResolvedValue(GALLERY);

    const { result } = renderHook(() =>
      useGameBootstrap({ search: `?galleryId=${VALID_ID}`, fetchLevels, fetchGallery }),
    );

    await waitFor(() => expect(result.current.status).toBe('error'));
    if (result.current.status === 'error') {
      expect(result.current.kind).toBe('api');
      expect(result.current.message).toBe('boom');
    }
  });
});

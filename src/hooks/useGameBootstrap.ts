// Entry bootstrap: parse the game entry URL, then fetch the maze levels for the gallery.
// Drives the `loading → ready | error` state the entry screens render.

import { useEffect, useState } from 'react';
import type { MazeData } from '../types/maze';
import type { GalleryInfo } from '../api/mappers/gallery';
import { getMazeLevels } from '../api/mazeApi';
import { getUserGallery } from '../api/galleriesApi';
import { parseGameEntryParams } from '../utils/queryParams';

export type BootstrapErrorKind = 'params' | 'api';

export type BootstrapState =
  | { status: 'loading' }
  | {
      status: 'ready';
      galleryId: string;
      title: string;
      levels: MazeData[];
      /** Gallery presentation data (numeric image-folder id, title, image count).
       *  Cosmetic: `null` when the lookup failed — the game still starts. */
      gallery: GalleryInfo | null;
    }
  | { status: 'error'; kind: BootstrapErrorKind; message: string };

export interface UseGameBootstrapOptions {
  /** Query string to parse; defaults to the live `window.location.search`. */
  search?: string;
  /** Levels fetcher; injectable for testing. Defaults to the real API client. */
  fetchLevels?: (galleryId: string) => Promise<MazeData[]>;
  /** Gallery-info fetcher; injectable for testing. Defaults to the real API client. */
  fetchGallery?: (galleryId: string) => Promise<GalleryInfo>;
}

function initialState(search: string | undefined): BootstrapState {
  const parsed = parseGameEntryParams(search);
  return parsed.ok
    ? { status: 'loading' }
    : { status: 'error', kind: 'params', message: parsed.message };
}

/**
 * Parse entry params and load the gallery's maze levels plus its presentation info.
 * Invalid/missing `galleryId` yields an `error/params` state without any request;
 * a levels API/transport failure yields `error/api`. The gallery-info lookup is
 * fail-soft: its failure only leaves `gallery: null` on the ready state.
 */
export function useGameBootstrap(options: UseGameBootstrapOptions = {}): BootstrapState {
  const { search, fetchLevels = getMazeLevels, fetchGallery = getUserGallery } = options;
  const [state, setState] = useState<BootstrapState>(() => initialState(search));

  useEffect(() => {
    const parsed = parseGameEntryParams(search);
    // Params errors and the initial loading state are set by the lazy initializer,
    // so the effect only owns the asynchronous fetch.
    if (!parsed.ok) return;

    let cancelled = false;

    Promise.all([
      fetchLevels(parsed.params.galleryId),
      fetchGallery(parsed.params.galleryId).catch(() => null),
    ])
      .then(([levels, gallery]) => {
        if (cancelled) return;
        setState({
          status: 'ready',
          galleryId: parsed.params.galleryId,
          title: parsed.params.title,
          levels,
          gallery,
        });
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        const message = error instanceof Error ? error.message : 'Failed to load maze levels.';
        setState({ status: 'error', kind: 'api', message });
      });

    return () => {
      cancelled = true;
    };
  }, [search, fetchLevels, fetchGallery]);

  return state;
}

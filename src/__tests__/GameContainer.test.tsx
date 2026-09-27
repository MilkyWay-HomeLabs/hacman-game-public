import '@testing-library/jest-dom';
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { mapMazeLevel } from '../api/mappers/maze';
import { mazeLevelsDto } from '../api/__tests__/fixtures/mazeLevels';
import { ApiError } from '../api/types';

// Stand in for the heavy game so tests focus on the bootstrap → difficulty → play wiring.
vi.mock('../App', () => ({
  default: (props: { mazeData?: { difficulty?: string }; galleryId?: string }) => (
    <div
      data-testid="game"
      data-difficulty={props.mazeData?.difficulty ?? ''}
      data-gallery={props.galleryId ?? ''}
    />
  ),
}));

import { GameContainer } from '../GameContainer';

const VALID_ID = '5250215a-521f-4a8b-aba9-c8325cf47615';
const GALLERY = { id: 1, title: 'Gallery 1', imageCount: 10 };
const fetchGallery = vi.fn().mockResolvedValue(GALLERY);
const LEVELS = mazeLevelsDto.map(mapMazeLevel);

describe('GameContainer', () => {
  it('shows the loading screen while the levels are being fetched', () => {
    const fetchLevels = () => new Promise<typeof LEVELS>(() => {}); // never resolves
    render(<GameContainer search={`?galleryId=${VALID_ID}`} fetchLevels={fetchLevels} fetchGallery={fetchGallery} />);

    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('shows an "Invalid game link" error without retry for a params error', async () => {
    render(<GameContainer search="?galleryId=nope" fetchLevels={vi.fn()} fetchGallery={fetchGallery} />);

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent('Invalid game link');
    expect(screen.queryByRole('button')).toBeNull();
  });

  it('shows a retryable error for an API failure', async () => {
    const fetchLevels = vi.fn().mockRejectedValue(new ApiError({ status: 500, message: 'down' }));
    render(<GameContainer search={`?galleryId=${VALID_ID}`} fetchLevels={fetchLevels} fetchGallery={fetchGallery} />);

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent('Could not load the game');
    expect(screen.getByRole('button', { name: 'Try again' })).toBeInTheDocument();
  });

  it('shows the difficulty dialog when ready, then starts the game with the chosen maze', async () => {
    const fetchLevels = vi.fn().mockResolvedValue(LEVELS);
    render(
      <GameContainer search={`?galleryId=${VALID_ID}&title=Gallery%201`} fetchLevels={fetchLevels} fetchGallery={fetchGallery} />,
    );

    const dialog = await screen.findByRole('dialog');
    expect(dialog).toHaveTextContent('Gallery 1');

    fireEvent.click(screen.getByRole('button', { name: /^Hard/ }));

    const game = await screen.findByTestId('game');
    expect(game).toHaveAttribute('data-difficulty', 'hard');
    // galleryId is threaded through to the game for score submission (Phase 4.1).
    expect(game).toHaveAttribute('data-gallery', VALID_ID);
  });
});

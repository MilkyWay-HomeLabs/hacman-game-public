// Integration tests for the player flow, wired through MSW rather than injected fakes:
//   bootstrap (GET maze levels) → difficulty selection → score submit (POST).
// The heavy game (App) is stubbed so these focus on the network-backed wiring; App's
// own rendering is covered by its unit tests.

import '@testing-library/jest-dom';
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { API_BASE } from '../../test-utils/msw/handlers';
import { server, startMockServer } from '../../test-utils/msw/server';
import { useScoreSubmission } from '../../hooks/useScoreSubmission';

// Stand in for the real game so the flow test exercises bootstrap/selection wiring only.
vi.mock('../../App', () => ({
  default: (props: { mazeData?: { difficulty?: string }; galleryId?: string }) => (
    <div
      data-testid="game"
      data-difficulty={props.mazeData?.difficulty ?? ''}
      data-gallery={props.galleryId ?? ''}
    />
  ),
}));

import { GameContainer } from '../../GameContainer';

startMockServer();

const GALLERY_ID = '5250215a-521f-4a8b-aba9-c8325cf47615';
const SEARCH = `?galleryId=${GALLERY_ID}&title=Gallery%201`;

describe('bootstrap → selection (integration)', () => {
  it('loads levels from the API, then starts the chosen difficulty', async () => {
    render(<GameContainer search={SEARCH} />);

    // Loading state first (levels are being fetched over the network).
    expect(screen.getByRole('status')).toBeInTheDocument();

    // Difficulty dialog appears once the mocked API responds, carrying the title.
    const dialog = await screen.findByRole('dialog');
    expect(dialog).toHaveTextContent('Gallery 1');

    fireEvent.click(screen.getByRole('button', { name: /^Hard/ }));

    const game = await screen.findByTestId('game');
    expect(game).toHaveAttribute('data-difficulty', 'hard');
    expect(game).toHaveAttribute('data-gallery', GALLERY_ID);
  });

  it('shows a retryable error when the levels request fails (500)', async () => {
    server.use(
      http.get(`${API_BASE}/v1/maze/levels/:galleryId`, () =>
        HttpResponse.json({ message: 'down' }, { status: 500 }),
      ),
    );

    render(<GameContainer search={SEARCH} />);

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent('Could not load the game');
    expect(screen.getByRole('button', { name: 'Try again' })).toBeInTheDocument();
  });

  it('rejects an unauthorized (401) levels request as an API error', async () => {
    server.use(
      http.get(`${API_BASE}/v1/maze/levels/:galleryId`, () =>
        HttpResponse.json({ message: 'Unauthorized' }, { status: 401 }),
      ),
    );

    render(<GameContainer search={SEARCH} />);

    expect(await screen.findByRole('alert')).toHaveTextContent('Could not load the game');
  });
});

// Minimal probe that drives the real score-submission hook (default = real API client).
function SubmitProbe() {
  const { status, retry } = useScoreSubmission({
    won: true,
    galleryId: GALLERY_ID,
    difficulty: 'hard',
    timeMs: 5000,
  });
  return (
    <div>
      <span data-testid="score-status">{status}</span>
      <button type="button" onClick={retry}>
        retry
      </button>
    </div>
  );
}

describe('score submission (integration)', () => {
  it('submits the score to the API on win and reaches success', async () => {
    render(<SubmitProbe />);
    await waitFor(() =>
      expect(screen.getByTestId('score-status')).toHaveTextContent('success'),
    );
  });

  it('surfaces a failed submission, then succeeds on retry', async () => {
    // Fail the first POST only; the default 204 handler answers the retry.
    server.use(
      http.post(
        `${API_BASE}/v1/level-scores`,
        () => HttpResponse.json({ message: 'nope' }, { status: 500 }),
        { once: true },
      ),
    );

    render(<SubmitProbe />);
    await waitFor(() => expect(screen.getByTestId('score-status')).toHaveTextContent('error'));

    fireEvent.click(screen.getByRole('button', { name: 'retry' }));
    await waitFor(() => expect(screen.getByTestId('score-status')).toHaveTextContent('success'));
  });
});

// Top-level orchestrator for the entry → play flow:
//   loading → difficulty → playing   (errors short-circuit to an error screen)
// It bootstraps the gallery's levels, lets the player pick a difficulty, then hands
// the chosen maze to the game (App).

import { useState } from 'react';
import type { MazeData } from './types/maze';
import App from './App';
import { useGameBootstrap, type UseGameBootstrapOptions } from './hooks/useGameBootstrap';
import { DifficultyDialog } from './component/DifficultyDialog';
import { LoadingScreen } from './screens/LoadingScreen';
import { ErrorScreen } from './screens/ErrorScreen';
import { AppFooter } from './component/AppFooter';

export type GameContainerProps = UseGameBootstrapOptions;

export function GameContainer(props: GameContainerProps = {}) {
  const state = useGameBootstrap(props);
  const [selectedMaze, setSelectedMaze] = useState<MazeData | null>(null);

  const content = (() => {
    if (state.status === 'loading') {
      return <LoadingScreen />;
    }

    if (state.status === 'error') {
      // A bad link (params) can't be fixed by reloading, so only offer retry for API errors.
      const isParams = state.kind === 'params';
      return (
        <ErrorScreen
          title={isParams ? 'Invalid game link' : 'Could not load the game'}
          message={state.message}
          onRetry={isParams ? undefined : () => window.location.reload()}
        />
      );
    }

    if (!selectedMaze) {
      return (
        <DifficultyDialog
          levels={state.levels}
          title={state.title || undefined}
          gallery={state.gallery}
          onSelect={setSelectedMaze}
        />
      );
    }

    return <App mazeData={selectedMaze} galleryId={state.galleryId} gallery={state.gallery} />;
  })();

  // The version footer is global chrome: fixed-positioned, so it overlays every
  // state (loading / error / difficulty / play) without disturbing layout.
  return (
    <>
      {content}
      <AppFooter />
    </>
  );
}

export default GameContainer;

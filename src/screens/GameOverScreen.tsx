export interface GameOverScreenProps {
  /** Restart the game (typically a full reload to reset all state). */
  onRetry: () => void;
}

/** Overlay shown when the player runs out of lives or time. */
export function GameOverScreen({ onRetry }: GameOverScreenProps) {
  return (
    <div className="game-over-overlay" role="dialog" aria-modal="true">
      <div className="game-over-panel">
        <div className="game-over-title">Game Over</div>
        <button className="retry-button" onClick={onRetry} autoFocus>
          Retry
        </button>
      </div>
    </div>
  );
}

export default GameOverScreen;

import type { MazeData } from '../types/maze';
import type { GalleryInfo } from '../api/mappers/gallery';
import MazeGrid from '../component/MazeGrid';
import RightPanel from '../component/RightPanel';

type Pos = { x: number; y: number };

export interface PlayScreenProps {
  mazeData: MazeData;
  playerPosition: Pos;
  playerDirection: 'right' | 'left' | 'up' | 'down';
  isInvulnerable: boolean;
  enemyPositions: Map<string, string>;
  buffPositions: Map<string, string>;
  debuffPositions: Map<string, string>;
  activeDots: Set<string>;
  cellSize: number;
  /** Right-panel status */
  timeLeft: number | null;
  totalTime: number;
  lives: number;
  imageIndex: number;
  initialTotalDots: number;
  collectedDots: number;
  gameWon: boolean;
  onDeploy: () => void;
  formatTime: (s: number) => string;
  /** Gallery presentation data; null/absent hides the progress image. */
  gallery?: GalleryInfo | null;
}

/** The in-game screen: the maze grid alongside the status panel. */
export function PlayScreen({
  mazeData,
  playerPosition,
  playerDirection,
  isInvulnerable,
  enemyPositions,
  buffPositions,
  debuffPositions,
  activeDots,
  cellSize,
  timeLeft,
  totalTime,
  lives,
  imageIndex,
  initialTotalDots,
  collectedDots,
  gameWon,
  onDeploy,
  formatTime,
  gallery,
}: PlayScreenProps) {
  return (
    <div className="game-area">
      <div className="maze-frame">
        <MazeGrid
          mazeData={mazeData}
          playerPosition={playerPosition}
          playerDirection={playerDirection}
          isInvulnerable={isInvulnerable}
          enemyPositions={enemyPositions}
          buffPositions={buffPositions}
          debuffPositions={debuffPositions}
          activeDots={activeDots}
          cellSize={cellSize}
        />
      </div>
      <RightPanel
        timeLeft={timeLeft}
        totalTime={totalTime}
        lives={lives}
        imageIndex={imageIndex}
        initialTotalDots={initialTotalDots}
        collectedDots={collectedDots}
        cellSize={cellSize}
        onDeploy={onDeploy}
        gameWon={gameWon}
        formatTime={formatTime}
        gallery={gallery}
      />
    </div>
  );
}

export default PlayScreen;

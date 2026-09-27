import type {MazeData} from '../types/maze';
import {BuffSprite, DebuffSprite, EnemySprite, PlayerSprite} from './sprites/EntitySprite';

type Pos = { x: number; y: number };

type Props = {
    mazeData: MazeData;
    playerPosition: Pos;
    playerDirection: 'right' | 'left' | 'up' | 'down';
    isInvulnerable: boolean;
    enemyPositions: Map<string, string>;
    buffPositions: Map<string, string>;
    debuffPositions: Map<string, string>;
    activeDots: Set<string>;
    cellSize?: number;
};

export default function MazeGrid({
                                     mazeData,
                                     playerPosition,
                                     playerDirection,
                                     isInvulnerable,
                                     enemyPositions,
                                     buffPositions,
                                     debuffPositions,
                                     activeDots,
                                     cellSize = 16,
                                 }: Props) {
    return (
        <div
            className="maze-grid"
            style={{
                gridTemplateColumns: `repeat(${mazeData.width}, ${cellSize}px)`,
                gridAutoRows: `${cellSize}px`,
            }}
        >
            {mazeData.cells.flatMap((row, y) =>
                row.map((cell, x) => {
                    const key = `${x}-${y}`;
                    const isPlayer = playerPosition.x === x && playerPosition.y === y;
                    const enemyStyle = enemyPositions.get(key);
                    const buffStyle = buffPositions.get(key);
                    const debuffStyle = debuffPositions.get(key);
                    // The cell div keeps only the tile classes; entities render as
                    // absolutely-positioned overlay spans so the path background
                    // stays visible around each sprite.
                    const className = [
                        cell === 1 ? 'cell wall' : 'cell path',
                        activeDots.has(key) && 'dot',
                    ]
                        .filter(Boolean)
                        .join(' ');

                    return (
                        <div key={key} className={className}>
                            {isPlayer && (
                                <span className={`player ${playerDirection}${isInvulnerable ? ' invulnerable' : ''}`}>
                                    <PlayerSprite/>
                                </span>
                            )}
                            {enemyStyle && <span className={`enemy ${enemyStyle}`}><EnemySprite/></span>}
                            {buffStyle && <span className={`buff ${buffStyle}`}><BuffSprite/></span>}
                            {debuffStyle && <span className={`debuff ${debuffStyle}`}><DebuffSprite/></span>}
                        </div>
                    );
                })
            )}
        </div>
    );
}
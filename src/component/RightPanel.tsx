import SidePanel from './SidePanel';
import type { GalleryInfo } from '../api/mappers/gallery';

type Props = {
    timeLeft: number | null;
    totalTime?: number;
    lives: number;
    imageIndex: number;
    initialTotalDots: number;
    collectedDots: number;
    cellSize: number;
    onDeploy: () => void;
    gameWon: boolean;
    formatTime: (s: number) => string;
    /** Gallery presentation data; null/absent hides the progress image. */
    gallery?: GalleryInfo | null;
};

export default function RightPanel({
                                       timeLeft,
                                       totalTime = 60,
                                       lives,
                                       imageIndex,
                                       initialTotalDots,
                                       collectedDots,
                                       cellSize,
                                       onDeploy,
                                       gameWon,
                                       formatTime,
                                       gallery,
                                   }: Props) {
    const pct = timeLeft !== null ? Math.max(0, Math.min(100, (timeLeft / Math.max(1, totalTime)) * 100)) : 0;

    return (
        <aside className="right-panel" aria-label="Game status panel">
            {timeLeft !== null ? (
                <section className="panel-section timer" aria-live="polite">
                    <div className="timer-row">
                        <div className="timer-label">Time</div>
                        <div className="timer-value">{formatTime(timeLeft)}</div>
                    </div>
                    <div className="timer-bar" aria-hidden="true">
                        <div className="timer-bar-fill" style={{ width: `${pct}%` }} />
                    </div>
                </section>
            ) : null}

            <section className="panel-section">
                <div className="lives-panel" role="status" aria-label="Lives remaining">
                    <div className="lives-label">Lives</div>
                    <div className="lives-hearts" aria-hidden="true">
                        {Array.from({length: lives}).map((_, i) => (
                            <span key={i} className="heart">❤</span>
                        ))}
                    </div>
                </div>
            </section>

            <section className="panel-section">
                <SidePanel
                    imageIndex={imageIndex}
                    initialTotalDots={initialTotalDots}
                    collectedDots={collectedDots}
                    cellSize={cellSize}
                    onDeploy={onDeploy}
                    gameWon={gameWon}
                    gallery={gallery}
                />
            </section>
        </aside>
    );
}
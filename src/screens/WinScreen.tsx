import type { ScoreSubmissionStatus } from '../hooks/useScoreSubmission';
import type { UnlockedAchievement } from '../api/scoresApi';
import type { GalleryInfo } from '../api/mappers/gallery';
import { galleryImageUrl, imageIndexToPercent } from '../domain/galleryImages';

export interface WinScreenProps {
  /** Drives which "hacked progress" image is shown (0–10 → 0–100). */
  imageIndex: number;
  /** Gallery presentation data; null/absent hides the progress image. */
  gallery?: GalleryInfo | null;
  /** Automatic score submission status, surfaced to the player. */
  scoreStatus: ScoreSubmissionStatus;
  /** Retry a failed score submission. */
  onRetryScore: () => void;
  /** Return to the Nebula gallery. */
  onDeploy: () => void;
  /** Achievements this submission unlocked (M7-3). Empty renders nothing extra. */
  newlyUnlockedAchievements?: UnlockedAchievement[];
}

/** Overlay shown when the player wins; also reports the score submission. */
export function WinScreen({
  imageIndex,
  gallery,
  scoreStatus,
  onRetryScore,
  onDeploy,
  newlyUnlockedAchievements = [],
}: WinScreenProps) {
  const imageSrc = gallery ? galleryImageUrl(gallery.id, imageIndexToPercent(imageIndex)) : null;

  return (
    <div className="hacked-overlay" role="dialog" aria-modal="true">
      <div className="hacked-panel">
        <div className="hacked-title">Hacked</div>
        <div className="hacked-subtitle">System compromised</div>
        {imageSrc && (
          <div className="hacked-progress">
            <img
              className="hacked-progress__img"
              alt="Hacked progress"
              src={imageSrc}
              onError={(e) => {
                // Fall back to the full image once; never loop if it 404s too.
                const img = e.currentTarget as HTMLImageElement;
                const fallback = galleryImageUrl(gallery!.id, 100);
                if (img.src !== fallback) img.src = fallback;
              }}
            />
          </div>
        )}
        {scoreStatus === 'submitting' && (
          <div className="score-status score-status--muted" role="status">
            Submitting score…
          </div>
        )}
        {scoreStatus === 'success' && (
          <div className="score-status score-status--success" role="status">
            Score submitted
          </div>
        )}
        {scoreStatus === 'error' && (
          <div className="score-status score-status--error" role="alert">
            Score submission failed.{' '}
            <button type="button" className="score-retry" onClick={onRetryScore}>
              Retry
            </button>
          </div>
        )}
        {newlyUnlockedAchievements.length > 0 && (
          <ul className="achievement-unlocked-list" role="status">
            {newlyUnlockedAchievements.map((achievement) => (
              <li key={achievement.code} className="achievement-unlocked">
                <span className="achievement-unlocked__label">Achievement Unlocked</span>
                <span className="achievement-unlocked__name">{achievement.name}</span>
              </li>
            ))}
          </ul>
        )}
        <button className="deploy-button" onClick={onDeploy} autoFocus>
          Deploy
        </button>
      </div>
    </div>
  );
}

export default WinScreen;

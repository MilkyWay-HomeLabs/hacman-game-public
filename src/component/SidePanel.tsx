import type { GalleryInfo } from '../api/mappers/gallery';
import { galleryImageUrl, imageIndexToPercent } from '../domain/galleryImages';

type Props = {
    imageIndex: number;
    initialTotalDots: number;
    collectedDots: number;
    cellSize: number;
    onDeploy: () => void;
    gameWon: boolean;
    /** Gallery presentation data; null/absent hides the progress image. */
    gallery?: GalleryInfo | null;
};

export default function SidePanel({
                                      imageIndex,
                                      initialTotalDots,
                                      collectedDots,
                                      cellSize,
                                      gameWon,
                                      gallery,
                                  }: Props) {
    const total = Math.max(0, initialTotalDots);
    const rawPercent = total === 0 ? 0 : Math.round((collectedDots / total) * 100);
    const percent = Math.min(100, Math.max(0, rawPercent));

    // Progress image from the resources host; needs the numeric gallery id
    // resolved by the user-galleries API, so no gallery info → no image.
    const imageSrc = gallery ? galleryImageUrl(gallery.id, imageIndexToPercent(imageIndex)) : null;

    // Use cellSize so it's not unused; scale to produce the similar default size (20 -> 192)
    const imageSize = Math.max(0, cellSize) * 9.6;

    return (
        <div className="side-image-panel">
            <div className="progress-heading">Progress</div>

            <div className="progress-card" style={{ width: imageSize, height: imageSize }}>
                {imageSrc && (
                    <img
                        alt=""
                        src={imageSrc}
                        className="progress-image"
                        onError={(e) => {
                            // Fall back to the base image once; never loop if it 404s too.
                            const img = e.currentTarget as HTMLImageElement;
                            const fallback = galleryImageUrl(gallery!.id, 0);
                            if (img.src !== fallback) img.src = fallback;
                        }}
                    />
                )}
            </div>

            <div className="progress-percent">{percent}%</div>

            <div className="progress-meta">
                Collected: {collectedDots} / {initialTotalDots}
            </div>

            <div className="progress-hint">
                {gameWon ? 'Level completed! Check the Hacked window.' : 'Complete the level to deploy'}
            </div>
        </div>
    );
}

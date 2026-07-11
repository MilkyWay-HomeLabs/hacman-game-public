// Gallery progress-image URLs. Images live on the static resources host under
// `hacman/img/galleries/{numericGalleryId}/0_{percent}.jpg`, where the numeric
// id comes from the user-galleries API (GalleryInfo.id), not the gallery UUID.

/**
 * Progress percentage (steps of 10, clamped to [0, 100]) for an image index.
 * Shared by the side panel and the win screen.
 */
export function imageIndexToPercent(imageIndex: number): number {
  return Math.min(100, Math.max(0, imageIndex * 10));
}

/**
 * Absolute URL of a gallery progress image.
 *
 * @param numericGalleryId - Image-folder id from the user-galleries API.
 * @param percent - Progress step (use {@link imageIndexToPercent}).
 * @param base - Resources host; defaults to `VITE_RESOURCES_URL`.
 */
export function galleryImageUrl(
  numericGalleryId: number,
  percent: number,
  base: string = import.meta.env.VITE_RESOURCES_URL,
): string {
  const cleanBase = (base ?? '').replace(/\/+$/, '');
  return `${cleanBase}/hacman/img/galleries/${numericGalleryId}/0_${percent}.jpg`;
}

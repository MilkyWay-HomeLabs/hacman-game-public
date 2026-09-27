// Mapping from the Hacman API user-gallery DTO to the internal `GalleryInfo`
// the UI consumes. The interesting part is the nested gallery's numeric
// `galleryId`: it names the image folder on the resources server
// (`.../hacman/img/galleries/{id}/...`), unlike the UUID id used everywhere else.

/** Nested gallery record inside a user-gallery response. */
export interface GalleryDto {
  /** Gallery UUID (same identity as the entry-URL galleryId). */
  id: string;
  title: string;
  description?: string | null;
  /** Number of progress images available for this gallery. */
  imageCount: number;
  /** Numeric folder id on the resources server. */
  galleryId: number;
}

/** `GET /v1/user-galleries?galleryId={uuid}` response item. */
export interface UserGalleryDto {
  id: string;
  userId: string;
  /** Gallery UUID. */
  galleryId: string;
  /** Populated on read (joined with galleries). */
  gallery: GalleryDto | null;
  isUnlocked: boolean;
}

/** Internal gallery presentation data. */
export interface GalleryInfo {
  /** Numeric image-folder id on the resources server. */
  id: number;
  title: string;
  description?: string;
  imageCount: number;
}

/** Map a user-gallery DTO (with a populated nested gallery) to `GalleryInfo`. */
export function mapUserGallery(dto: UserGalleryDto): GalleryInfo {
  const gallery = dto.gallery!;
  return {
    id: gallery.galleryId,
    title: gallery.title,
    description: gallery.description ?? undefined,
    imageCount: gallery.imageCount,
  };
}

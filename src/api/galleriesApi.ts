// User-galleries client: resolves the numeric image-folder id (and title/count)
// for a gallery UUID. The result is cosmetic — callers are expected to treat a
// failure as "no gallery info" rather than blocking the game.

import { httpGet } from './http';
import {
  type GalleryInfo,
  mapUserGallery,
  type UserGalleryDto,
} from './mappers/gallery';

/** Thrown when the user-galleries payload does not carry a usable gallery record. */
export class UserGalleryResponseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'UserGalleryResponseError';
    Object.setPrototypeOf(this, UserGalleryResponseError.prototype);
  }
}

function assertValidUserGallery(payload: unknown): asserts payload is UserGalleryDto {
  if (payload === null || typeof payload !== 'object' || Array.isArray(payload)) {
    throw new UserGalleryResponseError('Expected a user-gallery object.');
  }
  const gallery = (payload as { gallery?: unknown }).gallery;
  if (gallery === null || typeof gallery !== 'object') {
    throw new UserGalleryResponseError('The user-gallery record has no populated gallery.');
  }
  const record = gallery as Record<string, unknown>;
  if (typeof record.galleryId !== 'number' || !Number.isFinite(record.galleryId)) {
    throw new UserGalleryResponseError('The gallery record is missing its numeric galleryId.');
  }
  if (typeof record.title !== 'string') {
    throw new UserGalleryResponseError('The gallery record is missing its title.');
  }
}

/**
 * Fetch the user-gallery record for a gallery UUID and map it to `GalleryInfo`.
 * Auth is via httpOnly cookies (handled by the HTTP client).
 *
 * @throws {ApiError} on HTTP/transport failures.
 * @throws {UserGalleryResponseError} when the payload has no usable gallery record.
 */
export async function getUserGallery(galleryId: string): Promise<GalleryInfo> {
  const payload = await httpGet<unknown>(
    `/v1/user-galleries?galleryId=${encodeURIComponent(galleryId)}`,
  );
  assertValidUserGallery(payload);
  return mapUserGallery(payload);
}

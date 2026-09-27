import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { getUserGallery, UserGalleryResponseError } from '../galleriesApi';
import { mapUserGallery, type UserGalleryDto } from '../mappers/gallery';
import { ApiError } from '../types';

const BASE = 'https://api.example.test/hacman/api';

const userGalleryDto: UserGalleryDto = {
  id: 'e2f1a6de-8f43-4b1c-9a2f-4dc6a1b0c111',
  userId: '3f8f5f60-1111-4222-8333-944445555666',
  galleryId: '5250215a-521f-4a8b-aba9-c8325cf47615',
  gallery: {
    id: '5250215a-521f-4a8b-aba9-c8325cf47615',
    title: 'Gallery 1',
    description: 'A test gallery',
    imageCount: 10,
    galleryId: 1,
  },
  isUnlocked: true,
};

function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

function fetchMock() {
  const mock = vi.fn<typeof fetch>();
  vi.stubGlobal('fetch', mock);
  return mock;
}

beforeEach(() => {
  vi.stubEnv('VITE_API_BASE_URL', BASE);
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('getUserGallery', () => {
  it('requests the user-galleries endpoint with an encoded galleryId', async () => {
    const mock = fetchMock();
    mock.mockResolvedValue(jsonResponse(userGalleryDto));

    await getUserGallery('a/b c');

    expect(mock.mock.calls[0][0]).toBe(`${BASE}/v1/user-galleries?galleryId=a%2Fb%20c`);
  });

  it('maps the nested gallery to GalleryInfo', async () => {
    const mock = fetchMock();
    mock.mockResolvedValue(jsonResponse(userGalleryDto));

    const info = await getUserGallery('g-1');

    expect(info).toEqual({
      id: 1,
      title: 'Gallery 1',
      description: 'A test gallery',
      imageCount: 10,
    });
  });

  it('rejects with UserGalleryResponseError when the payload is not an object', async () => {
    const mock = fetchMock();
    mock.mockResolvedValue(jsonResponse([userGalleryDto]));

    await expect(getUserGallery('g-1')).rejects.toBeInstanceOf(UserGalleryResponseError);
  });

  it('rejects with UserGalleryResponseError when the nested gallery is missing', async () => {
    const mock = fetchMock();
    mock.mockResolvedValue(jsonResponse({ ...userGalleryDto, gallery: null }));

    await expect(getUserGallery('g-1')).rejects.toBeInstanceOf(UserGalleryResponseError);
  });

  it('rejects with UserGalleryResponseError when the numeric galleryId is missing', async () => {
    const mock = fetchMock();
    mock.mockResolvedValue(
      jsonResponse({ ...userGalleryDto, gallery: { ...userGalleryDto.gallery, galleryId: '1' } }),
    );

    await expect(getUserGallery('g-1')).rejects.toBeInstanceOf(UserGalleryResponseError);
  });

  it('rejects with UserGalleryResponseError when the title is missing', async () => {
    const mock = fetchMock();
    mock.mockResolvedValue(
      jsonResponse({ ...userGalleryDto, gallery: { ...userGalleryDto.gallery, title: 5 } }),
    );

    await expect(getUserGallery('g-1')).rejects.toBeInstanceOf(UserGalleryResponseError);
  });

  it('propagates ApiError on HTTP failures', async () => {
    const mock = fetchMock();
    mock.mockResolvedValue(jsonResponse({ message: 'nope' }, 401));

    await expect(getUserGallery('g-1')).rejects.toBeInstanceOf(ApiError);
  });
});

describe('mapUserGallery', () => {
  it('omits a null description', () => {
    const info = mapUserGallery({
      ...userGalleryDto,
      gallery: { ...userGalleryDto.gallery!, description: null },
    });
    expect(info.description).toBeUndefined();
  });
});

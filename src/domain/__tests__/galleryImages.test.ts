import { afterEach, describe, expect, it, vi } from 'vitest';
import { galleryImageUrl, imageIndexToPercent } from '../galleryImages';

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('imageIndexToPercent', () => {
  it('maps indexes to percentage steps of 10', () => {
    expect(imageIndexToPercent(0)).toBe(0);
    expect(imageIndexToPercent(3)).toBe(30);
    expect(imageIndexToPercent(10)).toBe(100);
  });

  it('clamps to [0, 100]', () => {
    expect(imageIndexToPercent(-5)).toBe(0);
    expect(imageIndexToPercent(20)).toBe(100);
  });
});

describe('galleryImageUrl', () => {
  it('builds the resources URL from the numeric gallery id and percent', () => {
    expect(galleryImageUrl(1, 30, 'https://res.example.test/resources')).toBe(
      'https://res.example.test/resources/hacman/img/galleries/1/0_30.jpg',
    );
  });

  it('strips trailing slashes from the base', () => {
    expect(galleryImageUrl(7, 0, 'https://res.example.test/resources///')).toBe(
      'https://res.example.test/resources/hacman/img/galleries/7/0_0.jpg',
    );
  });

  it('defaults the base to VITE_RESOURCES_URL', () => {
    vi.stubEnv('VITE_RESOURCES_URL', 'https://stubbed.example.test/resources');
    expect(galleryImageUrl(2, 100)).toBe(
      'https://stubbed.example.test/resources/hacman/img/galleries/2/0_100.jpg',
    );
  });
});

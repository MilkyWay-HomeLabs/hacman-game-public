import '@testing-library/jest-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { WinScreen } from '../WinScreen';
import type { GalleryInfo } from '../../api/mappers/gallery';

const RES_BASE = 'https://res.example.test/resources';
const IMG_BASE = `${RES_BASE}/hacman/img/galleries/1`;
const GALLERY: GalleryInfo = { id: 1, title: 'Gallery 1', imageCount: 10 };

beforeEach(() => {
  vi.stubEnv('VITE_RESOURCES_URL', RES_BASE);
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('WinScreen', () => {
  const baseProps = {
    imageIndex: 3,
    gallery: GALLERY,
    scoreStatus: 'idle' as const,
    onRetryScore: vi.fn(),
    onDeploy: vi.fn(),
  };

  it('renders the win dialog and the progress image for the given index', () => {
    render(<WinScreen {...baseProps} imageIndex={3} />);
    expect(screen.getByRole('dialog')).toHaveAttribute('aria-modal', 'true');
    expect(screen.getByText('Hacked')).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'Hacked progress' })).toHaveAttribute(
      'src',
      `${IMG_BASE}/0_30.jpg`,
    );
  });

  it('clamps the progress image to 100', () => {
    render(<WinScreen {...baseProps} imageIndex={99} />);
    expect(screen.getByRole('img', { name: 'Hacked progress' })).toHaveAttribute(
      'src',
      `${IMG_BASE}/0_100.jpg`,
    );
  });

  it('renders no image when gallery info is unavailable', () => {
    render(<WinScreen {...baseProps} gallery={null} />);
    expect(screen.queryByRole('img', { name: 'Hacked progress' })).not.toBeInTheDocument();
    expect(screen.getByText('Hacked')).toBeInTheDocument();
  });

  it('falls back to the full image on load error without looping', () => {
    render(<WinScreen {...baseProps} imageIndex={3} />);
    const img = screen.getByRole('img', { name: 'Hacked progress' }) as HTMLImageElement;
    fireEvent.error(img);
    expect(img).toHaveAttribute('src', `${IMG_BASE}/0_100.jpg`);
    fireEvent.error(img);
    expect(img).toHaveAttribute('src', `${IMG_BASE}/0_100.jpg`);
  });

  it('shows the submitting status', () => {
    render(<WinScreen {...baseProps} scoreStatus="submitting" />);
    expect(screen.getByText('Submitting score…')).toBeInTheDocument();
  });

  it('shows the success status', () => {
    render(<WinScreen {...baseProps} scoreStatus="success" />);
    expect(screen.getByText('Score submitted')).toBeInTheDocument();
  });

  it('shows an error status with a retry that calls onRetryScore', () => {
    const onRetryScore = vi.fn();
    render(<WinScreen {...baseProps} scoreStatus="error" onRetryScore={onRetryScore} />);
    expect(screen.getByRole('alert')).toHaveTextContent('Score submission failed.');
    fireEvent.click(screen.getByRole('button', { name: 'Retry' }));
    expect(onRetryScore).toHaveBeenCalledTimes(1);
  });

  it('calls onDeploy when Deploy is clicked', () => {
    const onDeploy = vi.fn();
    render(<WinScreen {...baseProps} onDeploy={onDeploy} />);
    fireEvent.click(screen.getByRole('button', { name: 'Deploy' }));
    expect(onDeploy).toHaveBeenCalledTimes(1);
  });
});

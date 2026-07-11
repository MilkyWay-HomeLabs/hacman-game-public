import '@testing-library/jest-dom';
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';
import {fireEvent, render, screen} from '@testing-library/react';
import SidePanel from '../SidePanel';
import type {GalleryInfo} from '../../api/mappers/gallery';

const RES_BASE = 'https://res.example.test/resources';
const IMG_BASE = `${RES_BASE}/hacman/img/galleries/1`;
const GALLERY: GalleryInfo = {id: 1, title: 'Gallery 1', imageCount: 10};

beforeEach(() => {
    vi.stubEnv('VITE_RESOURCES_URL', RES_BASE);
});

afterEach(() => {
    vi.unstubAllEnvs();
});

describe('SidePanel component', () => {
    it('renders progress and collected dots correctly', () => {
        render(
            <SidePanel
                imageIndex={5}
                initialTotalDots={100}
                collectedDots={50}
                cellSize={20}
                onDeploy={() => {
                }}
                gameWon={false}
                gallery={GALLERY}
            />
        );
        expect(screen.getByText('Progress')).toBeInTheDocument();
        expect(screen.getByText('50%')).toBeInTheDocument();
        expect(screen.getByText('Collected: 50 / 100')).toBeInTheDocument();
    });

    it('renders the correct resources-host image based on imageIndex', () => {
        render(
            <SidePanel
                imageIndex={3}
                initialTotalDots={100}
                collectedDots={50}
                cellSize={20}
                onDeploy={() => {}}
                gameWon={false}
                gallery={GALLERY}
            />
        );
        const img = screen.getByAltText('') as HTMLImageElement;
        expect(img).toHaveAttribute('src', `${IMG_BASE}/0_30.jpg`);
    });

    it('renders no image when gallery info is unavailable', () => {
        render(
            <SidePanel
                imageIndex={3}
                initialTotalDots={100}
                collectedDots={50}
                cellSize={20}
                onDeploy={() => {}}
                gameWon={false}
                gallery={null}
            />
        );
        expect(screen.queryByAltText('')).not.toBeInTheDocument();
        // The rest of the panel still renders.
        expect(screen.getByText('Progress')).toBeInTheDocument();
    });

    it('does not render the deploy button in side panel when game is won (shown in overlay instead)', () => {
        render(
            <SidePanel
                imageIndex={0}
                initialTotalDots={100}
                collectedDots={100}
                cellSize={20}
                onDeploy={() => {
                }}
                gameWon={true}
                gallery={GALLERY}
            />
        );
        expect(screen.queryByRole('button', {name: 'Deploy'})).not.toBeInTheDocument();
        expect(screen.getByText('Level completed! Check the Hacked window.')).toBeInTheDocument();
    });

    it('renders a message when game is not won', () => {
        render(
            <SidePanel
                imageIndex={0}
                initialTotalDots={100}
                collectedDots={50}
                cellSize={20}
                onDeploy={() => {
                }}
                gameWon={false}
                gallery={GALLERY}
            />
        );
        expect(screen.getByText('Complete the level to deploy')).toBeInTheDocument();
    });

    it('keeps informative message when not won and hides button when won', () => {
        const onDeployMock = vi.fn();
        const { rerender } = render(
            <SidePanel
                imageIndex={0}
                initialTotalDots={100}
                collectedDots={50}
                cellSize={20}
                onDeploy={onDeployMock}
                gameWon={false}
                gallery={GALLERY}
            />
        );
        expect(screen.getByText('Complete the level to deploy')).toBeInTheDocument();
        rerender(
            <SidePanel
                imageIndex={0}
                initialTotalDots={100}
                collectedDots={100}
                cellSize={20}
                onDeploy={onDeployMock}
                gameWon={true}
                gallery={GALLERY}
            />
        );
        expect(screen.queryByRole('button', { name: 'Deploy' })).not.toBeInTheDocument();
        expect(screen.getByText('Level completed! Check the Hacked window.')).toBeInTheDocument();
    });

    it('renders a fallback image if the current image fails to load', () => {
        render(
            <SidePanel
                imageIndex={10}
                initialTotalDots={100}
                collectedDots={50}
                cellSize={20}
                onDeploy={() => {}}
                gameWon={false}
                gallery={GALLERY}
            />
        );
        const img = screen.getByAltText('') as HTMLImageElement;
        fireEvent.error(img);
        expect(img).toHaveAttribute('src', `${IMG_BASE}/0_0.jpg`);
    });
});

describe('SidePanel - branch coverage tests', () => {
    it('caps imageIndex above max to 100%', () => {
        render(
            <SidePanel
                imageIndex={20}
                initialTotalDots={100}
                collectedDots={50}
                cellSize={20}
                onDeploy={() => {}}
                gameWon={false}
                gallery={GALLERY}
            />
        );
        const img = screen.getByAltText('') as HTMLImageElement;
        expect(img).toHaveAttribute('src', `${IMG_BASE}/0_100.jpg`);
    });

    it('floors negative imageIndex to 0%', () => {
        render(
            <SidePanel
                imageIndex={-5}
                initialTotalDots={100}
                collectedDots={50}
                cellSize={20}
                onDeploy={() => {}}
                gameWon={false}
                gallery={GALLERY}
            />
        );
        const img = screen.getByAltText('') as HTMLImageElement;
        expect(img).toHaveAttribute('src', `${IMG_BASE}/0_0.jpg`);
    });

    it('handles initialTotalDots = 0 without throwing and shows 0%', () => {
        render(
            <SidePanel
                imageIndex={0}
                initialTotalDots={0}
                collectedDots={0}
                cellSize={20}
                onDeploy={() => {}}
                gameWon={false}
                gallery={GALLERY}
            />
        );
        expect(screen.getByText('0%')).toBeInTheDocument();
        expect(screen.getByText('Collected: 0 / 0')).toBeInTheDocument();
    });

    it('shows 100% when collectedDots exceed initialTotalDots', () => {
        render(
            <SidePanel
                imageIndex={5}
                initialTotalDots={50}
                collectedDots={100}
                cellSize={20}
                onDeploy={() => {}}
                gameWon={false}
                gallery={GALLERY}
            />
        );
        expect(screen.getByText('100%')).toBeInTheDocument();
        expect(screen.getByText('Collected: 100 / 50')).toBeInTheDocument();
    });

    it('does not loop when the fallback image also fails to load', () => {
        render(
            <SidePanel
                imageIndex={3}
                initialTotalDots={100}
                collectedDots={50}
                cellSize={20}
                onDeploy={() => {}}
                gameWon={false}
                gallery={GALLERY}
            />
        );
        const img = screen.getByAltText('') as HTMLImageElement;
        expect(img).toHaveAttribute('src', `${IMG_BASE}/0_30.jpg`);
        fireEvent.error(img);
        expect(img).toHaveAttribute('src', `${IMG_BASE}/0_0.jpg`);
        // A second failure on the fallback itself leaves the src unchanged.
        fireEvent.error(img);
        expect(img).toHaveAttribute('src', `${IMG_BASE}/0_0.jpg`);
    });
});

import {describe, expect, it, vi} from 'vitest';
import {render, screen} from '@testing-library/react';
import RightPanel from '../RightPanel';

const mockFormatTime = (s: number) => `${s}s`;
const mockOnDeploy = vi.fn();

describe('RightPanel', () => {
    it('renders the timer when timeLeft is not null', () => {
        const {container} = render(
            <RightPanel
                timeLeft={30}
                totalTime={60}
                lives={3}
                imageIndex={1}
                initialTotalDots={100}
                collectedDots={50}
                cellSize={10}
                onDeploy={mockOnDeploy}
                gameWon={false}
                formatTime={mockFormatTime}
            />
        );

        expect(screen.getByText('Time')).toBeDefined();
        expect(screen.getByText('30s')).toBeDefined();

        const barFill = container.querySelector('.timer-bar-fill') as HTMLElement | null;
        expect(barFill).not.toBeNull();
        expect(barFill!.style.width).toBe('50%');
    });

    it('does not render the timer when timeLeft is null', () => {
        render(
            <RightPanel
                timeLeft={null}
                totalTime={60}
                lives={3}
                imageIndex={1}
                initialTotalDots={100}
                collectedDots={50}
                cellSize={10}
                onDeploy={mockOnDeploy}
                gameWon={false}
                formatTime={mockFormatTime}
            />
        );

        expect(screen.queryByText('Time')).toBeNull();
    });

    it('renders the correct number of lives', () => {
        render(
            <RightPanel
                timeLeft={30}
                totalTime={60}
                lives={5}
                imageIndex={1}
                initialTotalDots={100}
                collectedDots={50}
                cellSize={10}
                onDeploy={mockOnDeploy}
                gameWon={false}
                formatTime={mockFormatTime}
            />
        );

        expect(screen.getAllByText('❤')).toHaveLength(5);
    });

    it('renders without crashing when gameWon is true and shows hearts', () => {
        render(
            <RightPanel
                timeLeft={30}
                totalTime={60}
                lives={3}
                imageIndex={2}
                initialTotalDots={100}
                collectedDots={75}
                cellSize={15}
                onDeploy={mockOnDeploy}
                gameWon={true}
                formatTime={mockFormatTime}
            />
        );

        expect(screen.getByText('Lives')).toBeDefined();
        expect(screen.getAllByText('❤').length).toBeGreaterThan(0);
    });

    it('handles edge case where totalTime is 0 by clamping progress to 100%', () => {
        const {container} = render(
            <RightPanel
                timeLeft={30}
                totalTime={0}
                lives={3}
                imageIndex={1}
                initialTotalDots={100}
                collectedDots={50}
                cellSize={10}
                onDeploy={mockOnDeploy}
                gameWon={false}
                formatTime={mockFormatTime}
            />
        );

        const barFill = container.querySelector('.timer-bar-fill') as HTMLElement | null;
        expect(barFill).not.toBeNull();
        expect(barFill!.style.width).toBe('100%');
    });
});
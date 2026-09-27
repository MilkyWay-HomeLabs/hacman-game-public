import '@testing-library/jest-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { DifficultyDialog } from '../DifficultyDialog';
import { mapMazeLevel } from '../../api/mappers/maze';
import { easyLevelDto, hardLevelDto, mazeLevelsDto } from '../../api/__tests__/fixtures/mazeLevels';
import type { GalleryInfo } from '../../api/mappers/gallery';

const LEVELS = mazeLevelsDto.map(mapMazeLevel);

const GALLERY: GalleryInfo = { id: 7, title: 'Gallery 1', imageCount: 11 };

/** Difficulty label of each option button (buttons also carry detail rows). */
function optionLabels(): (string | null | undefined)[] {
  return screen
    .getAllByRole('button')
    .map((b) => b.querySelector('.difficulty-dialog__option-label')?.textContent);
}

describe('DifficultyDialog', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('renders a modal dialog with the three difficulties in order', () => {
    render(<DifficultyDialog levels={LEVELS} onSelect={vi.fn()} title="Gallery 1" />);

    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(dialog).toHaveTextContent('Gallery 1');

    expect(optionLabels()).toEqual(['Easy', 'Medium', 'Hard']);
  });

  it('moves focus to the first option on mount', () => {
    render(<DifficultyDialog levels={LEVELS} onSelect={vi.fn()} />);
    expect(screen.getByRole('button', { name: /^Easy/ })).toHaveFocus();
  });

  it('calls onSelect with the maze matching the chosen difficulty', () => {
    const onSelect = vi.fn();
    render(<DifficultyDialog levels={LEVELS} onSelect={onSelect} />);

    fireEvent.click(screen.getByRole('button', { name: /^Medium/ }));

    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(onSelect.mock.calls[0][0].difficulty).toBe('medium');
  });

  it('calls onCancel on Escape', () => {
    const onCancel = vi.fn();
    render(<DifficultyDialog levels={LEVELS} onSelect={vi.fn()} onCancel={onCancel} />);

    fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' });

    expect(onCancel).toHaveBeenCalledOnce();
  });

  it('traps focus: Tab from the last option wraps to the first and vice versa', () => {
    render(<DifficultyDialog levels={LEVELS} onSelect={vi.fn()} />);
    const easy = screen.getByRole('button', { name: /^Easy/ });
    const hard = screen.getByRole('button', { name: /^Hard/ });

    hard.focus();
    fireEvent.keyDown(hard, { key: 'Tab' });
    expect(easy).toHaveFocus();

    easy.focus();
    fireEvent.keyDown(easy, { key: 'Tab', shiftKey: true });
    expect(hard).toHaveFocus();
  });

  it('renders only the difficulties present in levels, in canonical order', () => {
    const partial = [hardLevelDto, easyLevelDto].map(mapMazeLevel); // out of order, no medium
    render(<DifficultyDialog levels={partial} onSelect={vi.fn()} />);

    expect(optionLabels()).toEqual(['Easy', 'Hard']);
  });

  it('shows board size, entity counts and the time limit per option', () => {
    render(<DifficultyDialog levels={LEVELS} onSelect={vi.fn()} />);

    // Easy fixture: 5x5 board, 1 enemy / 1 buff / 1 debuff, 10-minute timer.
    const easy = screen.getByRole('button', { name: /^Easy/ });
    expect(easy).toHaveTextContent('5×5 · 1 enemies · 1 buffs · 1 debuffs');
    expect(easy).toHaveTextContent('10:00');

    // Medium fixture is empty: all counts zero, 5-minute timer.
    const medium = screen.getByRole('button', { name: /^Medium/ });
    expect(medium).toHaveTextContent('5×5 · 0 enemies · 0 buffs · 0 debuffs');
    expect(medium).toHaveTextContent('5:00');

    // Hard timer is 6 minutes.
    expect(screen.getByRole('button', { name: /^Hard/ })).toHaveTextContent('6:00');
  });

  it('previews the gallery prize image when gallery info is provided', () => {
    vi.stubEnv('VITE_RESOURCES_URL', 'https://res.example.test/resources');
    render(<DifficultyDialog levels={LEVELS} onSelect={vi.fn()} gallery={GALLERY} />);

    const img = screen.getByAltText('Gallery 1 preview');
    expect(img).toHaveAttribute(
      'src',
      'https://res.example.test/resources/hacman/img/galleries/7/0_0.jpg',
    );
  });

  it('hides the preview image when it fails to load', () => {
    render(<DifficultyDialog levels={LEVELS} onSelect={vi.fn()} gallery={GALLERY} />);

    const img = screen.getByAltText('Gallery 1 preview');
    fireEvent.error(img);
    expect(img).toHaveStyle({ display: 'none' });
  });

  it('renders without a preview image when gallery info is missing', () => {
    render(<DifficultyDialog levels={LEVELS} onSelect={vi.fn()} gallery={null} />);
    expect(document.querySelector('.difficulty-dialog__preview')).toBeNull();
  });
});

import { useEffect, useRef, type KeyboardEvent } from 'react';
import type { Difficulty, MazeData } from '../types/maze';
import type { GalleryInfo } from '../api/mappers/gallery';
import { galleryImageUrl } from '../domain/galleryImages';
import { mazeStats } from '../domain/mazeStats';
import { formatTime, timerDurationForDifficulty } from '../domain/score';
import './difficultyDialog.css';

const DIFFICULTY_ORDER: Difficulty[] = ['easy', 'medium', 'hard'];
const DIFFICULTY_LABELS: Record<Difficulty, string> = {
  easy: 'Easy',
  medium: 'Medium',
  hard: 'Hard',
};

export interface DifficultyDialogProps {
  /** Fetched levels; each carries its `difficulty`. Options render in easy→hard order. */
  levels: MazeData[];
  /** Called with the maze matching the chosen difficulty. */
  onSelect: (maze: MazeData) => void;
  /** Optional cancel (ESC). Selection is normally required, so this may be omitted. */
  onCancel?: () => void;
  /** Optional gallery title shown as a subtitle. */
  title?: string;
  /** Optional gallery info; when present, a preview of the prize image is shown. */
  gallery?: GalleryInfo | null;
}

/**
 * Accessible difficulty picker shown after the maze levels are fetched.
 * Modal semantics: `role=dialog` + `aria-modal`, focus moves to the first option on
 * mount, focus is trapped within the dialog, and ESC triggers `onCancel` when provided.
 * Each option summarizes its level (board size, time limit, entity counts); with a
 * gallery, the 0% prize image is previewed above the options.
 */
export function DifficultyDialog({ levels, onSelect, onCancel, title, gallery }: DifficultyDialogProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const firstOptionRef = useRef<HTMLButtonElement>(null);

  const options = DIFFICULTY_ORDER.flatMap((difficulty) => {
    const maze = levels.find((level) => level.difficulty === difficulty);
    return maze ? [{ difficulty, maze, stats: mazeStats(maze) }] : [];
  });

  useEffect(() => {
    firstOptionRef.current?.focus();
  }, []);

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Escape') {
      event.stopPropagation();
      onCancel?.();
      return;
    }
    if (event.key !== 'Tab') return;

    const focusable = dialogRef.current?.querySelectorAll<HTMLElement>('button');
    if (!focusable || focusable.length === 0) return;

    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  };

  return (
    <div className="dialog-backdrop" onKeyDown={handleKeyDown}>
      <div
        ref={dialogRef}
        className="difficulty-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="difficulty-dialog-title"
      >
        <h2 id="difficulty-dialog-title" className="difficulty-dialog__title">
          Choose difficulty
        </h2>
        {title && <p className="difficulty-dialog__subtitle">{title}</p>}
        {gallery && (
          <img
            className="difficulty-dialog__preview"
            src={galleryImageUrl(gallery.id, 0)}
            alt={`${gallery.title} preview`}
            onError={(e) => {
              // The preview is decorative; a missing image should not leave a broken icon.
              e.currentTarget.style.display = 'none';
            }}
          />
        )}
        <div className="difficulty-dialog__options">
          {options.map((option, index) => (
            <button
              key={option.difficulty}
              ref={index === 0 ? firstOptionRef : undefined}
              type="button"
              className={`difficulty-dialog__option difficulty-dialog__option--${option.difficulty}`}
              onClick={() => onSelect(option.maze)}
            >
              <span className="difficulty-dialog__option-header">
                <span className="difficulty-dialog__option-label">
                  {DIFFICULTY_LABELS[option.difficulty]}
                </span>
                <span className="difficulty-dialog__option-time">
                  {formatTime(timerDurationForDifficulty(option.difficulty))}
                </span>
              </span>
              <span className="difficulty-dialog__option-details">
                {option.stats.width}×{option.stats.height} · {option.stats.enemyCount}{' '}
                enemies · {option.stats.buffCount} buffs · {option.stats.debuffCount} debuffs
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export default DifficultyDialog;

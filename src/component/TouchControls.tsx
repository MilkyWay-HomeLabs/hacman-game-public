import './touchControls.css';
import type { Direction } from '../hooks/usePlayerMovement';

export interface TouchControlsProps {
  /** Start moving in a direction (same handler the keyboard/swipe use). */
  onMove: (direction: Direction) => void;
  /** Stop holding a direction (pointer released/left the button). */
  onRelease: (direction: Direction) => void;
}

const BUTTONS: { direction: Direction; label: string; glyph: string; className: string }[] = [
  { direction: 'up', label: 'Move up', glyph: '▲', className: 'touch-dpad__btn--up' },
  { direction: 'left', label: 'Move left', glyph: '◀', className: 'touch-dpad__btn--left' },
  { direction: 'right', label: 'Move right', glyph: '▶', className: 'touch-dpad__btn--right' },
  { direction: 'down', label: 'Move down', glyph: '▼', className: 'touch-dpad__btn--down' },
];

/**
 * On-screen directional pad for touch devices. Hidden on non-touch pointers via CSS.
 * Buttons feed the same `move`/`release` commands as the keyboard, so control
 * inversion, walkability and hold-to-move are handled uniformly.
 */
export function TouchControls({ onMove, onRelease }: TouchControlsProps) {
  return (
    <div className="touch-dpad" role="group" aria-label="Touch movement controls">
      {BUTTONS.map(({ direction, label, glyph, className }) => (
        <button
          key={direction}
          type="button"
          className={`touch-dpad__btn ${className}`}
          aria-label={label}
          // Move on pointer-down for a snappier feel; prevent the click/zoom that follows.
          onPointerDown={(e) => {
            e.preventDefault();
            onMove(direction);
          }}
          onPointerUp={() => onRelease(direction)}
          onPointerLeave={() => onRelease(direction)}
          onPointerCancel={() => onRelease(direction)}
        >
          <span aria-hidden="true">{glyph}</span>
        </button>
      ))}
    </div>
  );
}

export default TouchControls;

// Inline SVG sprites for the maze entities. They are rendered inside an
// absolutely-positioned overlay span, so the cell's own path background stays
// visible around the sprite (previously clip-path on the cell div cut the
// background away and entities read as wall cells).
//
// All fills come from CSS custom properties (--enemy-color, --buff-color,
// --debuff-color, --debuff-mark, player tokens), so the per-variant classes in
// style/*.css remain the single source of colors. Geometry is chunky on
// purpose: cells are 6-16 px, thin details would disappear.

/** Pac-Man: two mouth frames toggled by CSS (`.pac-open` / `.pac-closed`). */
export function PlayerSprite() {
    return (
        <svg viewBox="0 0 16 16" aria-hidden="true" focusable="false">
            <path className="pac-body pac-open" d="M8 8 L13.7 3.2 A7.5 7.5 0 1 0 13.7 12.8 Z"/>
            <path className="pac-body pac-closed" d="M8 8 L15.4 6.7 A7.5 7.5 0 1 0 15.4 9.3 Z"/>
            <circle className="pac-eye" cx="8.6" cy="3.9" r="1.05"/>
        </svg>
    );
}

/** Classic ghost: dome, scalloped skirt and two eyes. */
export function EnemySprite() {
    return (
        <svg viewBox="0 0 16 16" aria-hidden="true" focusable="false">
            <path
                className="enemy-body"
                d="M8 1 C4.4 1 1.8 3.9 1.8 7.5 V14.6 L3.9 12.9 L5.9 14.6 L8 12.9 L10.1 14.6 L12.1 12.9 L14.2 14.6 V7.5 C14.2 3.9 11.6 1 8 1 Z"
            />
            <circle className="enemy-eye" cx="5.6" cy="7" r="1.7"/>
            <circle className="enemy-eye" cx="10.4" cy="7" r="1.7"/>
            <circle className="enemy-pupil" cx="6" cy="7.3" r="0.85"/>
            <circle className="enemy-pupil" cx="10.8" cy="7.3" r="0.85"/>
        </svg>
    );
}

/** Five-point star pickup. */
export function BuffSprite() {
    return (
        <svg viewBox="0 0 16 16" aria-hidden="true" focusable="false">
            <path
                className="buff-body"
                d="M8 0.8 L9.9 5.7 L15.2 5.7 L11 8.9 L12.6 14 L8 11 L3.4 14 L5 8.9 L0.8 5.7 L6.1 5.7 Z"
            />
        </svg>
    );
}

/** Warning triangle with an exclamation mark. */
export function DebuffSprite() {
    return (
        <svg viewBox="0 0 16 16" aria-hidden="true" focusable="false">
            <path className="debuff-body" d="M8 1.2 L15.2 14.2 H0.8 Z"/>
            <rect className="debuff-mark" x="7.2" y="5.2" width="1.6" height="4.6" rx="0.8"/>
            <circle className="debuff-mark" cx="8" cy="12" r="1"/>
        </svg>
    );
}

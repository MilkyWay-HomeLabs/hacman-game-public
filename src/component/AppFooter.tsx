import { useAppVersion } from '../hooks/useAppVersion';
import './appFooter.css';

/** Normalize to a single leading "v" so `1.0.1` and `v1.0.1` both render as `v1.0.1`. */
function formatVersion(version: string): string {
  return `v${version.replace(/^v/i, '')}`;
}

/**
 * Global footer chrome: shows the running application version in every screen.
 * Fixed to the bottom so it overlays the game view without affecting its layout,
 * and sits below overlays (game over / win) in the stacking order.
 */
export function AppFooter() {
  const version = useAppVersion();

  return (
    <footer className="app-footer" aria-label="Application version">
      <span className="app-footer__brand">MAZE&nbsp;MATRIX</span>
      <span className="app-footer__version">{formatVersion(version)}</span>
    </footer>
  );
}

export default AppFooter;

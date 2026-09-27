import './screens.css';

export interface LoadingScreenProps {
  message?: string;
}

/** Full-screen loading state shown while the maze levels are being fetched. */
export function LoadingScreen({ message = 'Loading maze…' }: LoadingScreenProps) {
  return (
    <div className="screen screen--loading" role="status" aria-live="polite">
      <div className="screen__panel">
        <div className="screen__spinner" aria-hidden="true" />
        <p className="screen__message">{message}</p>
      </div>
    </div>
  );
}

export default LoadingScreen;

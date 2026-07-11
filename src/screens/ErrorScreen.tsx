import './screens.css';

export interface ErrorScreenProps {
  title?: string;
  message: string;
  /** When provided, renders a retry button. */
  onRetry?: () => void;
  retryLabel?: string;
}

/** Full-screen error state for entry failures (bad params, API errors). */
export function ErrorScreen({
  title = 'Something went wrong',
  message,
  onRetry,
  retryLabel = 'Try again',
}: ErrorScreenProps) {
  return (
    <div className="screen screen--error" role="alert">
      <div className="screen__panel">
        <h2 className="screen__title">{title}</h2>
        <p className="screen__message">{message}</p>
        {onRetry && (
          <button className="screen__retry" type="button" onClick={onRetry}>
            {retryLabel}
          </button>
        )}
      </div>
    </div>
  );
}

export default ErrorScreen;

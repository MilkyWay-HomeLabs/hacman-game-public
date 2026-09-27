import '@testing-library/jest-dom';
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { ErrorScreen } from '../ErrorScreen';

describe('ErrorScreen', () => {
  it('renders the message inside an alert with the default title', () => {
    render(<ErrorScreen message="Missing gallery id." />);
    const alert = screen.getByRole('alert');
    expect(alert).toHaveTextContent('Something went wrong');
    expect(alert).toHaveTextContent('Missing gallery id.');
  });

  it('does not render a retry button without onRetry', () => {
    render(<ErrorScreen message="boom" />);
    expect(screen.queryByRole('button')).toBeNull();
  });

  it('renders a retry button and invokes onRetry when clicked', () => {
    const onRetry = vi.fn();
    render(<ErrorScreen title="API error" message="500" onRetry={onRetry} retryLabel="Reload" />);

    const button = screen.getByRole('button', { name: 'Reload' });
    fireEvent.click(button);

    expect(onRetry).toHaveBeenCalledOnce();
  });
});

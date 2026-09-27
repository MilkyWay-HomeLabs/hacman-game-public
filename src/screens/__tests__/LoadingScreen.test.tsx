import '@testing-library/jest-dom';
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { LoadingScreen } from '../LoadingScreen';

describe('LoadingScreen', () => {
  it('renders a live status region with the default message', () => {
    render(<LoadingScreen />);
    const status = screen.getByRole('status');
    expect(status).toHaveTextContent('Loading maze');
  });

  it('renders a custom message', () => {
    render(<LoadingScreen message="Fetching levels…" />);
    expect(screen.getByRole('status')).toHaveTextContent('Fetching levels…');
  });
});

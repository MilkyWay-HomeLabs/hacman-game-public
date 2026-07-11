import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

const useAppVersion = vi.fn<() => string>();

vi.mock('../../hooks/useAppVersion', () => ({
  useAppVersion: () => useAppVersion(),
}));

import { AppFooter } from '../AppFooter';

afterEach(() => {
  vi.clearAllMocks();
});

describe('AppFooter', () => {
  it('renders the version with a single leading "v"', () => {
    useAppVersion.mockReturnValue('1.0.1');
    render(<AppFooter />);
    expect(screen.getByText('v1.0.1')).toBeInTheDocument();
  });

  it('does not double the "v" when the source already carries one', () => {
    useAppVersion.mockReturnValue('v2.5.0');
    render(<AppFooter />);
    expect(screen.getByText('v2.5.0')).toBeInTheDocument();
  });

  it('is labelled as the application version region', () => {
    useAppVersion.mockReturnValue('1.0.1');
    render(<AppFooter />);
    expect(screen.getByRole('contentinfo', { name: 'Application version' })).toBeInTheDocument();
  });
});

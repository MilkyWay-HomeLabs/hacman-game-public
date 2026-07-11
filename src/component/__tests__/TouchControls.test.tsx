import '@testing-library/jest-dom';
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { TouchControls } from '../TouchControls';

describe('TouchControls', () => {
  it('renders a labelled group with all four directions', () => {
    render(<TouchControls onMove={vi.fn()} onRelease={vi.fn()} />);
    expect(screen.getByRole('group', { name: 'Touch movement controls' })).toBeInTheDocument();
    for (const label of ['Move up', 'Move down', 'Move left', 'Move right']) {
      expect(screen.getByRole('button', { name: label })).toBeInTheDocument();
    }
  });

  it('calls onMove with the matching direction on pointer down', () => {
    const onMove = vi.fn();
    render(<TouchControls onMove={onMove} onRelease={vi.fn()} />);

    fireEvent.pointerDown(screen.getByRole('button', { name: 'Move up' }));
    fireEvent.pointerDown(screen.getByRole('button', { name: 'Move left' }));
    fireEvent.pointerDown(screen.getByRole('button', { name: 'Move right' }));
    fireEvent.pointerDown(screen.getByRole('button', { name: 'Move down' }));

    expect(onMove.mock.calls.map((c) => c[0])).toEqual(['up', 'left', 'right', 'down']);
  });

  it('calls onRelease on pointer up, leave and cancel', () => {
    const onRelease = vi.fn();
    render(<TouchControls onMove={vi.fn()} onRelease={onRelease} />);

    fireEvent.pointerUp(screen.getByRole('button', { name: 'Move up' }));
    fireEvent.pointerLeave(screen.getByRole('button', { name: 'Move left' }));
    fireEvent.pointerCancel(screen.getByRole('button', { name: 'Move right' }));

    expect(onRelease.mock.calls.map((c) => c[0])).toEqual(['up', 'left', 'right']);
  });
});

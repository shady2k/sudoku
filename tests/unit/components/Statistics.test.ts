/**
 * Statistics Component Tests
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import { writable } from 'svelte/store';
import Statistics from '../../../src/components/Statistics.svelte';

// Mock the gameStore module with factory function
vi.mock('../../../src/lib/stores/gameStore', () => {
  // Create mock stores inside the factory
  const mockSession = writable<any>(null);

  return {
    session: mockSession,
  };
});

// Import the mocked stores after the mock is set up
import { session as mockSession } from '../../../src/lib/stores/gameStore';

describe('Statistics Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSession.set(null);
  });

  it('should not render when no session exists', () => {
    const { container } = render(Statistics);
    expect(container.querySelector('.stats')).not.toBeInTheDocument();
  });

  it('should display difficulty level', () => {
    mockSession.set({
      difficultyLevel: 7,
      errorCount: 0,
      isCompleted: false,
    } as any);

    render(Statistics);
    expect(screen.getByText('7/10')).toBeInTheDocument();
  });

  it('should display error count', () => {
    mockSession.set({
      difficultyLevel: 5,
      errorCount: 3,
      isCompleted: false,
    } as any);

    render(Statistics);
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('should highlight errors when count is greater than zero', () => {
    mockSession.set({
      difficultyLevel: 5,
      errorCount: 5,
      isCompleted: false,
    } as any);

    render(Statistics);
    const errorValue = screen.getByText('5');
    expect(errorValue).toHaveClass('has-errors');
  });

  it('should show completion message when game is completed', () => {
    mockSession.set({
      difficultyLevel: 5,
      errorCount: 0,
      isCompleted: true,
    } as any);

    render(Statistics);
    expect(screen.getByText('🎉 Completed!')).toBeInTheDocument();
  });

  it('should not show completion message when game is in progress', () => {
    mockSession.set({
      difficultyLevel: 5,
      errorCount: 0,
      isCompleted: false,
    } as any);

    render(Statistics);
    expect(screen.queryByText('🎉 Completed!')).not.toBeInTheDocument();
  });
});

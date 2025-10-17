/**
 * Statistics Component Tests
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import { writable as _writable } from 'svelte/store';
import Statistics from '../../../src/components/Statistics.svelte';

// Mock the gameStore module with factory function
vi.mock('../../../src/lib/stores/gameStore.svelte', () => {
  return {
    gameStore: {
      session: null as any,
      isLoading: false,
      error: null,
      currentTime: Date.now(),
    }
  };
});

// Import the mocked stores after the mock is set up
import { gameStore } from '../../../src/lib/stores/gameStore.svelte';

describe('Statistics Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    gameStore.session = null;
  });

  it('should not render when no session exists', () => {
    const { container } = render(Statistics);
    expect(container.querySelector('.stats')).not.toBeInTheDocument();
  });

  it('should display difficulty level', () => {
    gameStore.session = {
      difficultyLevel: 7,
      mistakeCount: 0,
      isCompleted: false,
    } as any;

    render(Statistics);
    expect(screen.getByText('7%')).toBeInTheDocument();
  });

  it('should display error count', () => {
    gameStore.session = {
      difficultyLevel: 5,
      mistakeCount: 3,
      isCompleted: false,
    } as any;

    render(Statistics);
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('should highlight errors when count is greater than zero', () => {
    gameStore.session = {
      difficultyLevel: 5,
      mistakeCount: 5,
      isCompleted: false,
    } as any;

    render(Statistics);
    const mistakeValue = screen.getByText('5');
    expect(mistakeValue).toHaveClass('has-mistakes');
  });

  it('should show completion message when game is completed', () => {
    gameStore.session = {
      difficultyLevel: 5,
      mistakeCount: 0,
      isCompleted: true,
    } as any;

    render(Statistics);
    expect(screen.getByText('🎉 Completed!')).toBeInTheDocument();
  });

  it('should not show completion message when game is in progress', () => {
    gameStore.session = {
      difficultyLevel: 5,
      mistakeCount: 0,
      isCompleted: false,
    } as any;

    render(Statistics);
    expect(screen.queryByText('🎉 Completed!')).not.toBeInTheDocument();
  });
});

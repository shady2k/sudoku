/**
 * Timer Component Tests
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import Timer from '../../../src/components/Timer.svelte';
import * as gameStoreModule from '../../../src/lib/stores/gameStore.svelte';

// Mock the gameStore module
vi.mock('../../../src/lib/stores/gameStore.svelte', () => {
  const { writable } = require('svelte/store');

  const mockSession = writable(null);
  const mockFormattedTime = writable('00:00');

  return {
    session: mockSession,
    formattedTime: mockFormattedTime,
    gameStore: {
      updateTime: vi.fn(),
    },
  };
});

describe('Timer Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    gameStoreModule.session.set(null);
    gameStoreModule.formattedTime.set('00:00');
  });

  it('should render formatted time', () => {
    gameStoreModule.formattedTime.set('05:23');
    render(Timer);

    expect(screen.getByText('05:23')).toBeInTheDocument();
  });

  it('should show paused indicator when game is paused', () => {
    gameStoreModule.session.set({ isPaused: true } as any);
    render(Timer);

    expect(screen.getByText('⏸ Paused')).toBeInTheDocument();
  });

  it('should not show paused indicator when game is active', () => {
    gameStoreModule.session.set({ isPaused: false } as any);
    render(Timer);

    expect(screen.queryByText('⏸ Paused')).not.toBeInTheDocument();
  });

  it('should display time in MM:SS format', () => {
    gameStoreModule.formattedTime.set('12:45');
    render(Timer);

    const display = screen.getByText('12:45');
    expect(display).toHaveClass('time-display');
  });

  it('should display time in HH:MM:SS format for long games', () => {
    gameStoreModule.formattedTime.set('01:23:45');
    render(Timer);

    expect(screen.getByText('01:23:45')).toBeInTheDocument();
  });
});

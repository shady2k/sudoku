/**
 * Timer Component Tests
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import Timer from '../../../src/components/Timer.svelte';
import { gameStore } from '../../../src/lib/stores/gameStore.svelte.ts';

vi.mock('../../../src/lib/stores/gameStore.svelte.ts', () => ({
  gameStore: {
    session: null,
    formattedTime: '00:00',
    updateTime: vi.fn(),
  },
}));

describe('Timer Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    gameStore.session = null;
    gameStore.formattedTime = '00:00';
  });

  it('should render formatted time', () => {
    gameStore.formattedTime = '05:23';
    render(Timer);

    expect(screen.getByText('05:23')).toBeInTheDocument();
  });

  it('should show paused indicator when game is paused', () => {
    gameStore.session = { isPaused: true } as any;
    render(Timer);

    expect(screen.getByText('⏸ Paused')).toBeInTheDocument();
  });

  it('should not show paused indicator when game is active', () => {
    gameStore.session = { isPaused: false } as any;
    render(Timer);

    expect(screen.queryByText('⏸ Paused')).not.toBeInTheDocument();
  });

  it('should display time in MM:SS format', () => {
    gameStore.formattedTime = '12:45';
    render(Timer);

    const display = screen.getByText('12:45');
    expect(display).toHaveClass('time-display');
  });

  it('should display time in HH:MM:SS format for long games', () => {
    gameStore.formattedTime = '01:23:45';
    render(Timer);

    expect(screen.getByText('01:23:45')).toBeInTheDocument();
  });
});

/**
 * Game Store - Reactive State Management
 *
 * Using Svelte stores (writable) for compatibility
 */

import { writable, derived } from 'svelte/store';
import type { GameSession, CellPosition, CellValue, DifficultyLevel } from '../models/types';
import { createGameSession, makeMove, selectCell, toggleAutoCandidates } from '../services/GameSession';
import { updateTimer, pauseTimer, resumeTimer, shouldAutoPause, formatTime } from '../services/TimerService';

// Create writable stores
const session = writable<GameSession | null>(null);
const isLoading = writable(false);
const error = writable<string | null>(null);
const currentTime = writable(Date.now());

// Derived stores
const formattedTime = derived(session, ($session) =>
  $session ? formatTime($session.elapsedTime) : '00:00'
);

const isGameActive = derived(session, ($session) =>
  $session !== null && !$session.isCompleted
);

const canUndo = derived(session, ($session) =>
  ($session?.history.currentIndex ?? -1) > 0
);

// Actions
async function newGame(difficulty: DifficultyLevel, seed?: number): Promise<void> {
  isLoading.set(true);
  error.set(null);

  try {
    const result = await createGameSession(difficulty, seed);

    if (result.success) {
      session.set(result.data);
    } else {
      error.set(result.error.message);
    }
  } catch (err) {
    error.set(err instanceof Error ? err.message : 'Failed to create game');
  } finally {
    isLoading.set(false);
  }
}

function makeMoveAction(position: CellPosition, value: CellValue): void {
  session.update(($session) => {
    if (!$session) return $session;

    const result = makeMove($session, position, value);

    if (result.success) {
      return result.data;
    } else {
      error.set(result.error.message);
      return $session;
    }
  });
}

function selectCellAction(position: CellPosition | null): void {
  session.update(($session) => {
    if (!$session) return $session;
    return selectCell($session, position);
  });
}

function toggleCandidatesAction(): void {
  session.update(($session) => {
    if (!$session) return $session;
    return toggleAutoCandidates($session);
  });
}

function pauseGame(): void {
  session.update(($session) => {
    if (!$session) return $session;
    return pauseTimer($session, Date.now());
  });
}

function resumeGame(): void {
  session.update(($session) => {
    if (!$session) return $session;
    return resumeTimer($session, Date.now());
  });
}

function updateTime(): void {
  session.update(($session) => {
    if (!$session || $session.isPaused || $session.isCompleted) {
      return $session;
    }

    const now = Date.now();
    currentTime.set(now);

    // Check for auto-pause
    if (shouldAutoPause($session, now)) {
      return pauseTimer($session, $session.lastActivityAt);
    } else {
      return updateTimer($session, now);
    }
  });
}

// Export stores and actions separately
export { session, isLoading, error, currentTime, formattedTime, isGameActive, canUndo };

export const gameStore = {
  newGame,
  makeMove: makeMoveAction,
  selectCell: selectCellAction,
  toggleCandidates: toggleCandidatesAction,
  pauseGame,
  resumeGame,
  updateTime
};

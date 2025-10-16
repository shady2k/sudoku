/**
 * Game Store - Reactive State Management
 *
 * Uses Svelte 5 runes for reactivity:
 * - $state: Reactive state
 * - $derived: Computed values
 * - $effect: Side effects
 */

import type { GameSession, CellPosition, CellValue, DifficultyLevel } from '../models/types';
import { createGameSession, makeMove, selectCell, toggleAutoCandidates } from '../services/GameSession';
import { updateTimer, pauseTimer, resumeTimer, shouldAutoPause, formatTime } from '../services/TimerService';

class GameStore {
  // Reactive state
  session = $state<GameSession | null>(null);
  isLoading = $state(false);
  error = $state<string | null>(null);
  currentTime = $state(Date.now());

  // Derived state
  formattedTime = $derived(
    this.session ? formatTime(this.session.elapsedTime) : '00:00'
  );

  isGameActive = $derived(
    this.session !== null && !this.session.isCompleted
  );

  canUndo = $derived(
    (this.session?.history.currentIndex ?? 0) > 0
  );

  // Actions
  async newGame(difficulty: DifficultyLevel, seed?: number): Promise<void> {
    this.isLoading = true;
    this.error = null;

    try {
      const result = await createGameSession(difficulty, seed);

      if (result.success) {
        this.session = result.data;
      } else {
        this.error = result.error.message;
      }
    } catch (err) {
      this.error = err instanceof Error ? err.message : 'Failed to create game';
    } finally {
      this.isLoading = false;
    }
  }

  makeMove(position: CellPosition, value: CellValue): void {
    if (!this.session) return;

    const result = makeMove(this.session, position, value);

    if (result.success) {
      this.session = result.data;
    } else {
      this.error = result.error.message;
    }
  }

  selectCell(position: CellPosition | null): void {
    if (!this.session) return;
    this.session = selectCell(this.session, position);
  }

  toggleCandidates(): void {
    if (!this.session) return;
    this.session = toggleAutoCandidates(this.session);
  }

  pauseGame(): void {
    if (!this.session) return;
    this.session = pauseTimer(this.session, Date.now());
  }

  resumeGame(): void {
    if (!this.session) return;
    this.session = resumeTimer(this.session, Date.now());
  }

  // Timer update (called by interval)
  updateTime(): void {
    if (!this.session || this.session.isPaused || this.session.isCompleted) {
      return;
    }

    const now = Date.now();
    this.currentTime = now;

    // Check for auto-pause
    if (shouldAutoPause(this.session, now)) {
      this.session = pauseTimer(this.session, this.session.lastActivityAt);
    } else {
      this.session = updateTimer(this.session, now);
    }
  }
}

// Export singleton instance
export const gameStore = new GameStore();

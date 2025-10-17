/**
 * Game Store - Reactive State Management
 *
 * Uses Svelte 5 runes for reactivity:
 * - $state: Reactive state
 * - $derived: Computed values
 * - $effect: Side effects
 */

import type { GameSession, CellPosition, CellValue, DifficultyLevel } from '../models/types';
import { createGameSession, makeMove, selectCell, toggleAutoCandidates, setManualCandidates } from '../services/GameSession';
import { updateTimer, pauseTimer, resumeTimer, shouldAutoPause, formatTime } from '../services/TimerService';
import { saveGameSession, loadGameSession, hasSavedGame } from '../services/StorageService';

class GameStore {
  // Reactive state
  session = $state<GameSession | null>(null);
  isLoading = $state(false);
  error = $state<string | null>(null);
  currentTime = $state(Date.now());

  // Auto-save throttling (save at most every 2 seconds)
  private lastSaveTime = 0;
  private saveThrottleMs = 2000;
  private pendingSave = false;

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

  // Load saved game from localStorage (T065)
  async loadSavedGame(): Promise<boolean> {
    if (!hasSavedGame()) {
      return false;
    }

    this.isLoading = true;
    this.error = null;

    try {
      const result = await loadGameSession();

      if (result.success) {
        this.session = result.data;
        return true;
      } else {
        this.error = result.error.message;
        return false;
      }
    } catch (err) {
      this.error = err instanceof Error ? err.message : 'Failed to load game';
      return false;
    } finally {
      this.isLoading = false;
    }
  }

  async newGame(difficulty: DifficultyLevel, seed?: number): Promise<void> {
    this.isLoading = true;
    this.error = null;

    try {
      const result = await createGameSession(difficulty, seed);

      if (result.success) {
        this.session = result.data;
        // Force immediate save for new games (not throttled)
        await this.saveToStorage();
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
      this.throttledSave(); // Auto-save after move
    } else {
      this.error = result.error.message;
    }
  }

  selectCell(position: CellPosition | null): void {
    if (!this.session) return;
    this.session = selectCell(this.session, position);
    this.throttledSave(); // Auto-save after selection
  }

  toggleCandidates(): void {
    if (!this.session) return;
    this.session = toggleAutoCandidates(this.session);
    this.throttledSave(); // Auto-save after toggle
  }

  setManualCandidates(position: CellPosition, candidates: Set<number>): void {
    if (!this.session) return;

    const result = setManualCandidates(this.session, position, candidates as Set<1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9>);

    if (result.success) {
      this.session = result.data;
      this.throttledSave(); // Auto-save after setting candidates
    } else {
      this.error = result.error.message;
    }
  }

  pauseGame(): void {
    if (!this.session) return;
    this.session = pauseTimer(this.session, Date.now());
    this.throttledSave(); // Auto-save when pausing
  }

  resumeGame(): void {
    if (!this.session) return;
    this.session = resumeTimer(this.session, Date.now());
    this.throttledSave(); // Auto-save when resuming
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
      this.throttledSave(); // Save when auto-pausing
    } else {
      this.session = updateTimer(this.session, now);
    }
  }

  // Auto-save with throttling (max once per 2 seconds per task T058)
  private throttledSave(): void {
    if (!this.session) return;

    const now = Date.now();
    const timeSinceLastSave = now - this.lastSaveTime;

    if (timeSinceLastSave >= this.saveThrottleMs) {
      // Save immediately
      this.lastSaveTime = now;
      this.pendingSave = false;
      this.saveToStorage();
    } else if (!this.pendingSave) {
      // Schedule a save for later
      this.pendingSave = true;
      const delay = this.saveThrottleMs - timeSinceLastSave;

      setTimeout(() => {
        if (this.pendingSave && this.session) {
          this.lastSaveTime = Date.now();
          this.pendingSave = false;
          this.saveToStorage();
        }
      }, delay);
    }
  }

  // Actual save operation
  private async saveToStorage(): Promise<void> {
    if (!this.session) return;

    const result = await saveGameSession(this.session);

    if (!result.success) {
      console.error('Failed to save game session:', result.error.message);
      // Don't show error to user for auto-save failures
    }
  }
}

// Export singleton instance
export const gameStore = new GameStore();
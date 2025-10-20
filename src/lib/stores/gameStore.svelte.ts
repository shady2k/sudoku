/**
 * Game Store - Reactive State Management
 *
 * Uses Svelte 5 runes for reactivity:
 * - $state: Reactive state
 * - $derived: Computed values
 * - $effect: Side effects
 */

import type { GameSession, CellPosition, CellValue, DifficultyLevel, SudokuNumber } from '../models/types';
import { isSudokuNumber } from '../models/types';
import { createGameSession, makeMove, selectCell, fillCandidatesOnce, setManualCandidates, setHighlightedNumber, undoMove, redoMove } from '../services/GameSession';
import { updateTimer, pauseTimer, resumeTimer, shouldAutoPause, formatTime } from '../services/TimerService';
import { saveGameSession, loadGameSession, hasSavedGame, loadPreferences, savePreferences } from '../services/StorageService';
import { throttle } from 'lodash-es';

// Top-level reactive state for notesMode to ensure proper tracking
let notesModeState = $state(false);

// Save state management for UI feedback
interface SaveState {
  status: 'idle' | 'saving' | 'success' | 'warning' | 'error';
  lastSuccess: Date | null;
  failureCount: number;
  lastError: string | null;
  nextRetryIn: number; // milliseconds
}

class GameStore {
  // Reactive state
  session = $state<GameSession | null>(null);
  isLoading = $state(false);
  error = $state<string | null>(null);
  currentTime = $state(Date.now());

  // Save state for error recovery UI
  saveState = $state<SaveState>({
    status: 'idle',
    lastSuccess: null,
    failureCount: 0,
    lastError: null,
    nextRetryIn: 0
  });

  // Getter/setter for notesMode that accesses top-level state
  get notesMode(): boolean {
    return notesModeState;
  }

  set notesMode(value: boolean) {
    notesModeState = value;
  }

  // Auto-save throttling using lodash-es (save at most every 2 seconds)
  private throttledSaveImpl = throttle(
    () => this.saveToStorage(),
    2000,
    { leading: true, trailing: true }
  );

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

  canRedo = $derived(
    (this.session?.history.currentIndex ?? 0) < (this.session?.history.actions.length ?? 0)
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

        // Save difficulty preference for next game
        const preferences = await loadPreferences();
        preferences.defaultDifficulty = difficulty;
        await savePreferences(preferences);
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

  fillCandidates(): void {
    if (!this.session) return;
    this.session = fillCandidatesOnce(this.session);
    this.throttledSave(); // Auto-save after fill
  }

  toggleNotesMode(): void {
    this.notesMode = !this.notesMode;
  }

  setHighlightedNumber(number: SudokuNumber | null): void {
    if (!this.session) return;
    this.session = setHighlightedNumber(this.session, number);
    this.throttledSave(); // Auto-save after highlighting change
  }

  clearCell(position: CellPosition): void {
    if (!this.session) return;

    const { row, col } = position;
    const cell = this.session.cells[row]?.[col];

    // Don't allow editing clue cells
    if (!cell || cell.isClue) return;

    // Smart clear: clear whatever content is in the cell
    if (cell.value !== 0) {
      // Cell has a value - clear it
      this.makeMove(position, 0);
    } else if (cell.manualCandidates.size > 0) {
      // Cell has candidates - clear them
      this.setManualCandidates(position, new Set());
    }
  }

  setManualCandidates(position: CellPosition, candidates: Set<number>): void {
    if (!this.session) return;

    // Validate all candidates are valid Sudoku numbers (1-9)
    const validCandidates = new Set<SudokuNumber>();
    for (const num of candidates) {
      if (isSudokuNumber(num)) {
        validCandidates.add(num);
      } else {
        console.warn(`Invalid candidate number: ${num}, skipping`);
      }
    }

    const result = setManualCandidates(this.session, position, validCandidates);

    if (result.success) {
      this.session = result.data;
      this.throttledSave(); // Auto-save after setting candidates
    } else {
      this.error = result.error.message;
    }
  }

  // Undo last action (FR-022)
  undo(): void {
    if (!this.session) return;

    const result = undoMove(this.session);

    if (result.success) {
      this.session = result.data;
      this.throttledSave(); // Auto-save after undo
    } else {
      this.error = result.error.message;
    }
  }

  // Redo previously undone action (FR-022)
  redo(): void {
    if (!this.session) return;

    const result = redoMove(this.session);

    if (result.success) {
      this.session = result.data;
      this.throttledSave(); // Auto-save after redo
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

  // Mark activity to prevent auto-pause (called by user interaction listeners)
  markActivity(): void {
    if (!this.session || this.session.isCompleted) return;

    // If auto-paused, resume
    if (this.session.isPaused) {
      if (this.session.isAutoPaused) {
        this.resumeGame();
      }
      // Don't update lastActivityAt if manually paused - wait for explicit resume
      return;
    }

    // Update lastActivityAt to prevent auto-pause
    this.session = {
      ...this.session,
      lastActivityAt: Date.now()
    };
  }

  // Timer update (called by interval)
  updateTime(): void {
    if (!this.session || this.session.isPaused || this.session.isCompleted) {
      return;
    }

    const now = Date.now();
    this.currentTime = now;

    // Check for auto-pause (3 minutes of inactivity)
    if (shouldAutoPause(this.session, now, 3)) {
      // Auto-pause using the pauseTimer function
      // Need to revert elapsed time before pausing
      const timeSinceLastActivity = now - this.session.lastActivityAt;
      const revertedSession = {
        ...this.session,
        elapsedTime: this.session.elapsedTime - timeSinceLastActivity
      };

      this.session = pauseTimer(revertedSession, now, true); // isAutoPause = true
      this.throttledSave(); // Save when auto-pausing
      return;
    }

    // Update timer normally - keep counting until auto-pause triggers
    this.session = updateTimer(this.session, now);
  }

  // Auto-save with throttling (max once per 2 seconds per task T058)
  private throttledSave(): void {
    if (!this.session) return;
    this.throttledSaveImpl();
  }

  // Cleanup method to cancel pending throttled saves
  destroy(): void {
    this.throttledSaveImpl.cancel();
  }

  // Get retry delay based on failure count (exponential backoff)
  private getRetryDelay(attemptNumber: number): number {
    const delays = [0, 2000, 5000, 10000]; // Immediate, 2s, 5s, 10s
    const cappedDelay = 30000; // Max 30s

    return attemptNumber < delays.length ? (delays[attemptNumber] ?? cappedDelay) : cappedDelay;
  }

  // Actual save operation with retry logic
  private async saveToStorage(retryCount = 0): Promise<void> {
    if (!this.session) return;

    this.saveState.status = 'saving';

    const result = await saveGameSession(this.session);

    if (result.success) {
      // Save succeeded
      this.saveState = {
        status: 'success',
        lastSuccess: new Date(),
        failureCount: 0,
        lastError: null,
        nextRetryIn: 0
      };

      // Reset status to idle after 1s
      setTimeout(() => {
        if (this.saveState.status === 'success') {
          this.saveState.status = 'idle';
        }
      }, 1000);
    } else {
      // Save failed
      this.saveState.failureCount++;
      this.saveState.lastError = result.error.message;

      console.error('Failed to save game session:', result.error.message);

      // Determine if we should retry
      const shouldRetry =
        retryCount < 3 &&
        result.error.code !== 'STORAGE_QUOTA_EXCEEDED';

      if (shouldRetry) {
        // Retry with exponential backoff
        const delay = this.getRetryDelay(retryCount + 1);
        this.saveState.status = 'warning';
        this.saveState.nextRetryIn = delay;

        setTimeout(() => {
          this.saveToStorage(retryCount + 1);
        }, delay);
      } else {
        // Max retries reached or critical error
        this.saveState.status = 'error';
        this.error = `Auto-save failed: ${result.error.message}`;
      }
    }
  }

  // Force immediate save (bypasses throttling)
  async forceSave(): Promise<void> {
    if (!this.session) return;
    await this.saveToStorage();
  }
}

// Export singleton instance
export const gameStore = new GameStore();
/**
 * StorageService - Game State Persistence
 *
 * Handles saving and loading game state to/from browser LocalStorage.
 * Implements the storage-api.ts contract with performance targets:
 * - Save: <500ms (SC-011)
 * - Load: <1s (SC-002)
 */

import type { GameSession, Result, GameRecord, UserPreferences, Action, SudokuNumber } from '../models/types';
import { success, failure } from '../models/types';

// LocalStorage keys
const KEYS = {
  SESSION: 'sudoku:current-session',
  HISTORY: 'sudoku:history',
  PREFERENCES: 'sudoku:preferences',
  VERSION: 'sudoku:version'
} as const;

// Current schema version
export const SCHEMA_VERSION = 1;

// ============================================================================
// LocalStorage Availability Check
// ============================================================================

/**
 * Checks if browser supports required LocalStorage features
 */
export function isLocalStorageAvailable(): boolean {
  try {
    const testKey = '__sudoku_test__';
    localStorage.setItem(testKey, 'test');
    localStorage.removeItem(testKey);
    return true;
  } catch {
    return false;
  }
}

// ============================================================================
// Game Session Persistence
// ============================================================================

/**
 * Saves the current game session to LocalStorage
 * Performance target: <500ms (SC-011)
 */
export async function saveGameSession(session: GameSession): Promise<Result<void>> {
  try {
    if (!isLocalStorageAvailable()) {
      return failure('STORAGE_QUOTA_EXCEEDED', 'LocalStorage is not available');
    }

    // Serialize session (convert Sets to Arrays)
    const serialized = serializeGameSession(session);

    // Save to localStorage
    const data = {
      version: SCHEMA_VERSION,
      data: serialized
    };

    localStorage.setItem(KEYS.SESSION, JSON.stringify(data));

    return success(undefined);
  } catch (error) {
    if (error instanceof Error) {
      if (error.name === 'QuotaExceededError') {
        return failure('STORAGE_QUOTA_EXCEEDED', 'Storage quota exceeded. Try clearing old game history.');
      }
      return failure('CORRUPTED_DATA', `Failed to save session: ${error.message}`);
    }
    return failure('CORRUPTED_DATA', 'Failed to save session');
  }
}

/**
 * Loads the saved game session from LocalStorage
 * Performance target: <1s (SC-002)
 */
export async function loadGameSession(): Promise<Result<GameSession>> {
  try {
    if (!isLocalStorageAvailable()) {
      return failure('NO_SAVED_GAME', 'LocalStorage is not available');
    }

    const stored = localStorage.getItem(KEYS.SESSION);

    if (!stored) {
      return failure('NO_SAVED_GAME', 'No saved game found');
    }

    // Parse stored data
    const parsed = JSON.parse(stored) as { version: number; data: unknown };

    // Validate schema version (for future migrations)
    if (parsed.version !== SCHEMA_VERSION) {
      // In the future, implement migration here
      return failure('CORRUPTED_DATA', 'Unsupported schema version');
    }

    // Deserialize session (convert Arrays back to Sets)
    const result = deserializeGameSession(parsed.data);

    return result;
  } catch (error) {
    if (error instanceof Error) {
      return failure('CORRUPTED_DATA', `Failed to load session: ${error.message}`);
    }
    return failure('CORRUPTED_DATA', 'Failed to load session');
  }
}

/**
 * Deletes the current saved game session
 */
export function deleteGameSession(): Result<void> {
  try {
    localStorage.removeItem(KEYS.SESSION);
    return success(undefined);
  } catch (error) {
    if (error instanceof Error) {
      return failure('CORRUPTED_DATA', `Failed to delete session: ${error.message}`);
    }
    return failure('CORRUPTED_DATA', 'Failed to delete session');
  }
}

/**
 * Checks if a saved game session exists
 */
export function hasSavedGame(): boolean {
  try {
    return localStorage.getItem(KEYS.SESSION) !== null;
  } catch {
    return false;
  }
}

// ============================================================================
// Serialization Helpers
// ============================================================================

interface SerializedCell {
  row: number;
  col: number;
  value: number;
  isClue: boolean;
  isError: boolean;
  manualCandidates: number[];
  autoCandidates: number[] | null;
}

interface SerializedSession {
  sessionId: string;
  puzzle: {
    grid: readonly (readonly number[])[];
    solution: readonly (readonly number[])[];
    clues: readonly (readonly boolean[])[];
    difficultyRating: number;
    puzzleId: string;
    generatedAt: number;
  };
  board: number[][];
  cells: SerializedCell[][];
  startTime: number;
  elapsedTime: number;
  isPaused: boolean;
  pausedAt: number | null;
  difficultyLevel: number;
  errorCount: number;
  isCompleted: boolean;
  lastActivityAt: number;
  selectedCell: { row: number; col: number } | null;
  highlightedNumber: number | null;
  showAutoCandidates: boolean;
  history: {
    actions: unknown[];
    currentIndex: number;
    maxSize: number;
  };
}

/**
 * Serializes a GameSession to JSON-compatible format
 * Converts Sets to Arrays for JSON serialization
 */
export function serializeGameSession(session: GameSession): SerializedSession {
  // Deep copy and convert Sets to Arrays
  const serialized: SerializedSession = {
    ...session,
    cells: session.cells.map(row =>
      row.map(cell => ({
        ...cell,
        manualCandidates: Array.from(cell.manualCandidates),
        autoCandidates: cell.autoCandidates ? Array.from(cell.autoCandidates) : null
      }))
    ),
    history: {
      ...session.history,
      actions: session.history.actions.map(action => {
        if (action.type === 'SET_CANDIDATES' || action.type === 'CLEAR_CANDIDATES') {
          return {
            ...action,
            previousCandidates: Array.from(action.previousCandidates),
            newCandidates: action.type === 'SET_CANDIDATES' ? Array.from(action.newCandidates) : undefined
          };
        }
        return action;
      })
    }
  };

  return serialized;
}

/**
 * Deserializes JSON data back to GameSession
 * Converts Arrays back to Sets
 */
export function deserializeGameSession(data: unknown): Result<GameSession> {
  try {
    // Type guard - basic validation
    if (!data || typeof data !== 'object') {
      return failure('CORRUPTED_DATA', 'Invalid session data format');
    }

    const sessionData = data as Record<string, unknown>;

    // Validate required fields
    if (!sessionData.sessionId || !sessionData.puzzle || !sessionData.cells) {
      return failure('CORRUPTED_DATA', 'Missing required session fields');
    }

    // Convert Arrays back to Sets
    const typedSessionData = data as SerializedSession;

    const deserialized: GameSession = {
      ...typedSessionData,
      highlightedNumber: (typedSessionData.highlightedNumber ?? null) as SudokuNumber | null,
      cells: typedSessionData.cells.map((row: SerializedCell[]) =>
        row.map((cell: SerializedCell) => ({
          ...cell,
          manualCandidates: new Set(cell.manualCandidates || []),
          autoCandidates: cell.autoCandidates ? new Set(cell.autoCandidates) : null
        }))
      ),
      history: {
        ...typedSessionData.history,
        actions: (typedSessionData.history?.actions || []).map((action: unknown) => {
          const typedAction = action as Action;
          if (typedAction.type === 'SET_CANDIDATES') {
            return {
              ...typedAction,
              previousCandidates: typedAction.previousCandidates || [],
              newCandidates: typedAction.newCandidates || []
            };
          }
          if (typedAction.type === 'CLEAR_CANDIDATES') {
            return {
              ...typedAction,
              previousCandidates: typedAction.previousCandidates || []
            };
          }
          return typedAction;
        })
      }
    };

    return success(deserialized);
  } catch (error) {
    if (error instanceof Error) {
      return failure('CORRUPTED_DATA', `Deserialization failed: ${error.message}`);
    }
    return failure('CORRUPTED_DATA', 'Deserialization failed');
  }
}

// ============================================================================
// Game History Persistence
// ============================================================================

/**
 * Saves a completed game record to history
 * Maintains max 1000 records (SC-006)
 */
export async function saveGameRecord(record: GameRecord): Promise<Result<void>> {
  try {
    const history = await loadGameHistory();

    // Add new record
    const updatedHistory = [record, ...history];

    // Keep only most recent 1000 records
    const trimmedHistory = updatedHistory.slice(0, 1000);

    // Calculate personal bests
    const withPersonalBests = trimmedHistory.map((r, index) => {
      if (index === 0) {
        // This is the new record, calculate if it's a personal best
        const sameLevel = trimmedHistory.filter(
          h => h.difficultyLevel === r.difficultyLevel && h.recordId !== r.recordId
        );

        return {
          ...r,
          isPersonalBest: {
            fastestTime: sameLevel.length === 0 || r.totalTime < Math.min(...sameLevel.map(h => h.totalTime)),
            fewestErrors: sameLevel.length === 0 || r.errorCount < Math.min(...sameLevel.map(h => h.errorCount))
          }
        };
      }
      return r;
    });

    // Save to localStorage
    localStorage.setItem(KEYS.HISTORY, JSON.stringify(withPersonalBests));

    return success(undefined);
  } catch (error) {
    if (error instanceof Error) {
      if (error.name === 'QuotaExceededError') {
        // Try to archive old records
        await archiveOldRecords(100);
        return failure('STORAGE_QUOTA_EXCEEDED', 'Storage quota exceeded. Old records archived.');
      }
      return failure('CORRUPTED_DATA', `Failed to save record: ${error.message}`);
    }
    return failure('CORRUPTED_DATA', 'Failed to save record');
  }
}

/**
 * Loads all game history records from LocalStorage
 */
export async function loadGameHistory(): Promise<readonly GameRecord[]> {
  try {
    const stored = localStorage.getItem(KEYS.HISTORY);

    if (!stored) {
      return [];
    }

    const history = JSON.parse(stored) as unknown;

    if (!Array.isArray(history)) {
      return [];
    }

    return history as GameRecord[];
  } catch {
    return [];
  }
}

/**
 * Archives old game history records to free up space
 * Keeps the keepCount most recent records
 */
export async function archiveOldRecords(keepCount: number = 100): Promise<Result<{ archivedCount: number }>> {
  try {
    const history = await loadGameHistory();

    if (history.length <= keepCount) {
      return success({ archivedCount: 0 });
    }

    const kept = history.slice(0, keepCount);
    const archivedCount = history.length - kept.length;

    localStorage.setItem(KEYS.HISTORY, JSON.stringify(kept));

    return success({ archivedCount });
  } catch (error) {
    if (error instanceof Error) {
      return failure('CORRUPTED_DATA', `Failed to archive records: ${error.message}`);
    }
    return failure('CORRUPTED_DATA', 'Failed to archive records');
  }
}

// ============================================================================
// User Preferences Persistence
// ============================================================================

/**
 * Returns default user preferences
 */
export function getDefaultPreferences(): UserPreferences {
  return {
    defaultDifficulty: 50,
    candidateMode: 'manual',
    theme: {
      darkMode: false,
      highlightColor: '#e3f2fd',
      errorColor: '#ffcdd2'
    },
    keyboardShortcuts: {
      undo: 'z',
      redo: 'y',
      newGame: 'ctrl+n',
      toggleCandidates: 'c'
    },
    historyPreferences: {
      sortBy: 'date',
      sortOrder: 'desc',
      filterDifficulty: null
    },
    autoPauseTimeout: 3 // 3 minutes per clarification
  };
}

/**
 * Loads user preferences from LocalStorage
 * Never fails, returns defaults if none exist
 */
export async function loadPreferences(): Promise<UserPreferences> {
  try {
    const stored = localStorage.getItem(KEYS.PREFERENCES);

    if (!stored) {
      return getDefaultPreferences();
    }

    const parsed = JSON.parse(stored) as Partial<UserPreferences>;

    // Merge with defaults to handle missing fields
    return {
      ...getDefaultPreferences(),
      ...parsed
    };
  } catch {
    return getDefaultPreferences();
  }
}

/**
 * Saves user preferences to LocalStorage
 */
export async function savePreferences(preferences: UserPreferences): Promise<Result<void>> {
  try {
    localStorage.setItem(KEYS.PREFERENCES, JSON.stringify(preferences));
    return success(undefined);
  } catch (error) {
    if (error instanceof Error) {
      return failure('CORRUPTED_DATA', `Failed to save preferences: ${error.message}`);
    }
    return failure('CORRUPTED_DATA', 'Failed to save preferences');
  }
}

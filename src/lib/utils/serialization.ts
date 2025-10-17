/**
 * Serialization utilities for LocalStorage persistence
 *
 * Handles conversion between JavaScript objects and JSON-compatible formats:
 * - Set ↔ Array conversion
 * - GameSession serialization/deserialization
 * - Data validation
 */

import type { GameSession, Cell, Result } from '../models/types';
import { success, failure } from '../models/types';

// ============================================================================
// Set Serialization
// ============================================================================

/**
 * Serializes a Set to an Array for JSON compatibility
 */
export function serializeSet<T>(set: Set<T>): T[] {
  return Array.from(set);
}

/**
 * Deserializes an Array back to a Set
 */
export function deserializeSet<T>(array: T[]): Set<T> {
  return new Set(array);
}

// ============================================================================
// GameSession Serialization
// ============================================================================

/**
 * Type for serialized GameSession (JSON-compatible)
 * All Sets are converted to Arrays
 */
type SerializedGameSession = Omit<GameSession, 'cells'> & {
  cells: SerializedCell[][];
};

type SerializedCell = Omit<Cell, 'manualCandidates' | 'autoCandidates'> & {
  manualCandidates: number[];
  autoCandidates: number[] | null;
};

/**
 * Serializes a GameSession to JSON-compatible object
 *
 * Transformations:
 * - Converts all Set objects to Arrays
 * - Preserves all other data structures
 *
 * @param session - GameSession to serialize
 * @returns JSON-serializable object
 */
export function serializeGameSession(session: GameSession): Record<string, unknown> {
  // Serialize cells array (convert Sets to Arrays)
  const serializedCells: SerializedCell[][] = session.cells.map(row =>
    row.map(cell => ({
      ...cell,
      manualCandidates: serializeSet(cell.manualCandidates),
      autoCandidates: cell.autoCandidates ? serializeSet(cell.autoCandidates) : null
    }))
  );

  return {
    ...session,
    cells: serializedCells
  };
}

/**
 * Deserializes JSON data back to GameSession
 *
 * Transformations:
 * - Converts Arrays back to Sets
 * - Validates data structure
 *
 * @param data - JSON-parsed object
 * @returns Result containing GameSession or error
 */
export function deserializeGameSession(data: unknown): Result<GameSession> {
  // Validate data structure
  if (!isValidGameSessionData(data)) {
    return failure(
      'CORRUPTED_DATA',
      'Invalid game session data structure',
      data
    );
  }

  try {
    const serialized = data as SerializedGameSession;

    // Deserialize cells array (convert Arrays to Sets)
    const cells: Cell[][] = serialized.cells.map(row =>
      row.map(cell => ({
        ...cell,
        manualCandidates: deserializeSet(cell.manualCandidates),
        autoCandidates: cell.autoCandidates ? deserializeSet(cell.autoCandidates) : null
      }))
    );

    const session: GameSession = {
      ...serialized,
      cells
    };

    return success(session);
  } catch (error) {
    return failure(
      'CORRUPTED_DATA',
      'Failed to deserialize game session',
      error
    );
  }
}

// ============================================================================
// Data Validation
// ============================================================================

interface ValidationRecord {
  [key: string]: unknown;
}

/**
 * Validates that data has the structure of a GameSession
 *
 * Checks for required fields and correct types
 * Does NOT validate business logic (e.g., valid moves)
 *
 * @param data - Data to validate
 * @returns true if valid GameSession structure
 */
function hasValidPrimitiveFields(obj: ValidationRecord): boolean {
  return (
    typeof obj.sessionId === 'string' &&
    typeof obj.startTime === 'number' &&
    typeof obj.elapsedTime === 'number' &&
    typeof obj.isPaused === 'boolean' &&
    typeof obj.difficultyLevel === 'number' &&
    typeof obj.errorCount === 'number' &&
    typeof obj.isCompleted === 'boolean' &&
    typeof obj.lastActivityAt === 'number' &&
    typeof obj.showAutoCandidates === 'boolean'
  );
}

function hasValidNullableFields(obj: ValidationRecord): boolean {
  if (obj.pausedAt !== null && typeof obj.pausedAt !== 'number') {
    return false;
  }

  if (obj.selectedCell !== null && (
    typeof obj.selectedCell !== 'object' ||
    typeof (obj.selectedCell as ValidationRecord).row !== 'number' ||
    typeof (obj.selectedCell as ValidationRecord).col !== 'number'
  )) {
    return false;
  }

  return true;
}

function hasValidPuzzleObject(obj: ValidationRecord): boolean {
  if (!obj.puzzle || typeof obj.puzzle !== 'object') {
    return false;
  }
  const puzzle = obj.puzzle as ValidationRecord;
  return (
    Array.isArray(puzzle.grid) &&
    Array.isArray(puzzle.solution) &&
    Array.isArray(puzzle.clues)
  );
}

function isValid9x9Array(array: unknown): boolean {
  return (
    Array.isArray(array) &&
    array.length === 9 &&
    (array as unknown[]).every(row => Array.isArray(row) && (row as unknown[]).length === 9)
  );
}

function hasValidHistoryObject(obj: ValidationRecord): boolean {
  if (!obj.history || typeof obj.history !== 'object') {
    return false;
  }
  const history = obj.history as ValidationRecord;
  return (
    Array.isArray(history.actions) &&
    typeof history.currentIndex === 'number' &&
    typeof history.maxSize === 'number'
  );
}

export function isValidGameSessionData(data: unknown): data is SerializedGameSession {
  if (!data || typeof data !== 'object') {
    return false;
  }

  const obj = data as ValidationRecord;

  if (!hasValidPrimitiveFields(obj)) return false;
  if (!hasValidNullableFields(obj)) return false;
  if (!hasValidPuzzleObject(obj)) return false;
  if (!isValid9x9Array(obj.board)) return false;
  if (!isValid9x9Array(obj.cells)) return false;
  if (!hasValidHistoryObject(obj)) return false;

  return true;
}

/**
 * Validates that a cell has the correct structure
 */
export function isValidCellData(data: unknown): data is SerializedCell {
  if (!data || typeof data !== 'object') {
    return false;
  }

  const cell = data as ValidationRecord;

  return (
    typeof cell.row === 'number' &&
    typeof cell.col === 'number' &&
    typeof cell.value === 'number' &&
    typeof cell.isClue === 'boolean' &&
    typeof cell.isError === 'boolean' &&
    Array.isArray(cell.manualCandidates) &&
    (cell.autoCandidates === null || Array.isArray(cell.autoCandidates))
  );
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Calculates the size of an object when JSON-serialized
 * @returns Size in bytes
 */
export function getSerializedSize(obj: unknown): number {
  try {
    const json = JSON.stringify(obj);
    // JavaScript strings are UTF-16, but we want approximate storage size
    // Multiply by 2 for rough UTF-16 byte estimation
    return new Blob([json]).size;
  } catch {
    return 0;
  }
}

/**
 * Compresses a game session by removing unnecessary data
 * Useful for reducing storage quota usage
 */
export function compressGameSession(session: GameSession): GameSession {
  // Create a copy to avoid mutating original
  const compressed = { ...session };

  // Remove empty candidate sets
  compressed.cells = session.cells.map(row =>
    row.map(cell => {
      const compressedCell = { ...cell };

      // Clear manual candidates if empty
      if (cell.manualCandidates.size === 0) {
        compressedCell.manualCandidates = new Set();
      }

      // Clear auto candidates if show candidates is off
      if (!session.showAutoCandidates) {
        compressedCell.autoCandidates = null;
      }

      return compressedCell;
    })
  );

  return compressed;
}

/**
 * Creates a deep clone of a game session
 * Useful for undo/redo functionality
 */
export function cloneGameSession(session: GameSession): GameSession {
  const serialized = serializeGameSession(session);
  const result = deserializeGameSession(serialized);

  if (!result.success) {
    throw new Error('Failed to clone game session: ' + result.error.message);
  }

  return result.data;
}

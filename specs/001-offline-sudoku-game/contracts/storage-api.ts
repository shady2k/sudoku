/**
 * Storage & Persistence API Contract
 *
 * Defines the interface for persisting game state, history, and preferences
 * to browser LocalStorage. All operations handle quota exceeded errors and
 * data corruption gracefully.
 */

import type {
  GameSession,
  GameRecord,
  UserPreferences,
  Result,
} from './types';

// ============================================================================
// Game Session Persistence
// ============================================================================

/**
 * Saves the current game session to LocalStorage
 *
 * @param session - Game session to save
 * @returns Result indicating success or storage error
 *
 * **Side Effects**:
 * - Writes to LocalStorage key 'sudoku:current-session'
 * - May throw QuotaExceededError if storage full
 *
 * **Performance**: Must complete in <500ms (SC-011)
 */
export interface SaveGameSession {
  (session: GameSession): Promise<Result<void>>;
}

/**
 * Loads the saved game session from LocalStorage
 *
 * @returns Result containing the session or error if none/corrupted
 *
 * **Performance**: Must complete in <1 second (SC-002)
 *
 * **Error Handling**:
 * - Returns Failure if no saved game exists
 * - Returns Failure if data is corrupted (invalid JSON or schema)
 * - Validates schema version for migrations
 */
export interface LoadGameSession {
  (): Promise<Result<GameSession>>;
}

/**
 * Deletes the current saved game session
 *
 * @returns Result indicating success
 */
export interface DeleteGameSession {
  (): Result<void>;
}

/**
 * Checks if a saved game session exists
 *
 * @returns true if session exists in LocalStorage
 */
export interface HasSavedGame {
  (): boolean;
}

// ============================================================================
// Game History Persistence
// ============================================================================

/**
 * Saves a completed game record to history
 *
 * @param record - Game record to save
 * @returns Result indicating success or error
 *
 * **Side Effects**:
 * - Appends to 'sudoku:history' array in LocalStorage
 * - Removes oldest record if exceeds 1000 limit (SC-006)
 * - Updates personal best flags for the difficulty level
 */
export interface SaveGameRecord {
  (record: GameRecord): Promise<Result<void>>;
}

/**
 * Loads all game history records from LocalStorage
 *
 * @returns Array of game records, sorted by completion date (newest first)
 *
 * **Error Handling**:
 * - Returns empty array if no history exists
 * - Skips corrupted individual records
 */
export interface LoadGameHistory {
  (): Promise<readonly GameRecord[]>;
}

/**
 * Deletes a specific game record from history
 *
 * @param recordId - ID of record to delete
 * @returns Result indicating success
 */
export interface DeleteGameRecord {
  (recordId: string): Promise<Result<void>>;
}

/**
 * Clears all game history
 *
 * @returns Result indicating success
 */
export interface ClearGameHistory {
  (): Promise<Result<void>>;
}

/**
 * Calculates statistics from game history
 *
 * @param records - Game records to analyze
 * @param difficultyFilter - Optional difficulty level to filter by
 * @returns Statistics object
 */
export interface CalculateStatistics {
  (records: readonly GameRecord[], difficultyFilter?: number): GameStatistics;
}

export interface GameStatistics {
  totalGames: number;
  averageTime: number;
  bestTime: number;
  averageErrors: number;
  fewestErrors: number;
  byDifficulty: Map<number, {
    count: number;
    avgTime: number;
    bestTime: number;
    avgErrors: number;
  }>;
}

// ============================================================================
// User Preferences Persistence
// ============================================================================

/**
 * Saves user preferences to LocalStorage
 *
 * @param preferences - Preferences to save
 * @returns Result indicating success or error
 *
 * **Side Effects**:
 * - Writes to LocalStorage key 'sudoku:preferences'
 */
export interface SavePreferences {
  (preferences: UserPreferences): Promise<Result<void>>;
}

/**
 * Loads user preferences from LocalStorage
 *
 * @returns Preferences object, or default preferences if none exist
 *
 * **Behavior**:
 * - Never fails, always returns valid preferences
 * - Uses sensible defaults if no saved preferences
 */
export interface LoadPreferences {
  (): Promise<UserPreferences>;
}

/**
 * Returns default user preferences
 *
 * @returns Default preferences object
 */
export interface GetDefaultPreferences {
  (): UserPreferences;
}

// ============================================================================
// Storage Management
// ============================================================================

/**
 * Checks available LocalStorage quota
 *
 * @returns Estimated bytes available, or null if unavailable
 */
export interface GetStorageQuota {
  (): Promise<number | null>;
}

/**
 * Calculates current LocalStorage usage by the app
 *
 * @returns Bytes used by sudoku data
 */
export interface GetStorageUsage {
  (): number;
}

/**
 * Archives old game history records to free up space
 *
 * @param keepCount - Number of most recent records to keep (default: 100)
 * @returns Result indicating success and number of records archived
 *
 * **Behavior**:
 * - Keeps the keepCount most recent records
 * - Deletes older records
 * - Used when QuotaExceededError occurs
 */
export interface ArchiveOldRecords {
  (keepCount?: number): Promise<Result<{ archivedCount: number }>>;
}

/**
 * Validates the integrity of stored data
 *
 * @returns Result indicating if data is valid, with details of any issues
 */
export interface ValidateStoredData {
  (): Promise<Result<{ valid: boolean; issues: readonly string[] }>>;
}

// ============================================================================
// Schema Versioning & Migration
// ============================================================================

/**
 * Current schema version number
 */
export const SCHEMA_VERSION: number;

/**
 * Migrates stored data from an old schema version to current
 *
 * @param storedData - Raw data from LocalStorage
 * @param fromVersion - Version of the stored data
 * @returns Migrated data in current schema, or error if migration fails
 */
export interface MigrateSchema {
  (storedData: unknown, fromVersion: number): Result<unknown>;
}

/**
 * Gets the schema version of stored data
 *
 * @returns Schema version number, or 1 if no version stored
 */
export interface GetStoredSchemaVersion {
  (): number;
}

// ============================================================================
// Serialization Helpers
// ============================================================================

/**
 * Serializes a GameSession to JSON-compatible format
 *
 * @param session - Game session to serialize
 * @returns JSON-serializable object
 *
 * **Transformations**:
 * - Converts Sets to Arrays
 * - Handles Date objects
 * - Preserves type safety
 */
export interface SerializeGameSession {
  (session: GameSession): Record<string, unknown>;
}

/**
 * Deserializes JSON data back to GameSession
 *
 * @param data - JSON-parsed object
 * @returns GameSession or error if invalid structure
 *
 * **Transformations**:
 * - Converts Arrays back to Sets
 * - Validates schema
 * - Returns typed GameSession
 */
export interface DeserializeGameSession {
  (data: unknown): Result<GameSession>;
}

// ============================================================================
// Error Handling
// ============================================================================

/**
 * Handles LocalStorage errors and provides fallback behavior
 *
 * @param error - Error thrown by LocalStorage operation
 * @returns Friendly error message for user display
 */
export interface HandleStorageError {
  (error: Error): string;
}

/**
 * Checks if browser supports required LocalStorage features
 *
 * @returns true if LocalStorage is available and functional
 */
export interface IsLocalStorageAvailable {
  (): boolean;
}

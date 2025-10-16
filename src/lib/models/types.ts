/**
 * Shared Type Definitions for Offline Sudoku Game
 *
 * This file contains all core TypeScript interfaces and types used across the application.
 * All types enforce strict null checking and avoid `any` per Constitution Principle VI.
 */

// ============================================================================
// Core Game Types
// ============================================================================

/**
 * Represents the Sudoku grid with initial clues and solution
 */
export interface Puzzle {
  /** 9x9 grid of cells (0 = empty, 1-9 = clue/solution) */
  grid: readonly (readonly number[])[];

  /** Pre-solved solution grid for validation */
  solution: readonly (readonly number[])[];

  /** Bitmask indicating which cells are pre-filled clues (immutable) */
  clues: readonly (readonly boolean[])[];

  /** Difficulty rating (number of clues provided, 17-50) */
  difficultyRating: number;

  /** Unique identifier for puzzle (for replay feature) */
  puzzleId: string;

  /** Timestamp when puzzle was generated */
  generatedAt: number;
}

/**
 * Represents a single cell in the 9x9 grid
 */
export interface Cell {
  /** Row position (0-8) */
  readonly row: number;

  /** Column position (0-8) */
  readonly col: number;

  /** Current value (0 = empty, 1-9 = filled) */
  value: number;

  /** Whether this is a pre-filled clue (immutable) */
  readonly isClue: boolean;

  /** Whether the current value violates Sudoku rules */
  isError: boolean;

  /** Manually entered candidate numbers (user pencil marks) */
  manualCandidates: Set<number>;

  /** Auto-generated candidate numbers (if "Show Candidates" active) */
  autoCandidates: Set<number> | null;
}

/**
 * Represents a single playthrough of a Sudoku puzzle
 */
export interface GameSession {
  /** Unique identifier for this session */
  sessionId: string;

  /** The puzzle being played */
  puzzle: Puzzle;

  /** Current board state (9x9 grid with user progress) */
  board: number[][];

  /** Cell metadata (errors, candidates, etc.) */
  cells: Cell[][];

  /** Timestamp when game started */
  startTime: number;

  /** Total elapsed time in milliseconds (excluding paused time) */
  elapsedTime: number;

  /** Whether timer is currently paused */
  isPaused: boolean;

  /** Timestamp when timer was paused (null if not paused) */
  pausedAt: number | null;

  /** Difficulty level (1-10 scale mapped to clue count) */
  difficultyLevel: number;

  /** Count of errors made (only counts persistent invalid entries per FR-010) */
  errorCount: number;

  /** Whether puzzle is completed */
  isCompleted: boolean;

  /** Timestamp when last action occurred (for auto-pause detection) */
  lastActivityAt: number;

  /** Currently selected cell (null if none) */
  selectedCell: CellPosition | null;

  /** Whether auto-candidates are currently showing */
  showAutoCandidates: boolean;

  /** Action history for undo/redo */
  history: ActionHistory;
}

/**
 * Cell position in the grid
 */
export interface CellPosition {
  row: number;
  col: number;
}

/**
 * Undo/redo action history
 */
export interface ActionHistory {
  /** Stack of actions (most recent last) */
  actions: readonly Action[];

  /** Current position in history (for undo/redo) */
  currentIndex: number;

  /** Maximum history size (50 steps) */
  readonly maxSize: number;
}

/**
 * Single action in the undo/redo history
 */
export type Action =
  | SetValueAction
  | ClearValueAction
  | SetCandidatesAction
  | ClearCandidatesAction;

export interface SetValueAction {
  type: 'SET_VALUE';
  cell: CellPosition;
  previousValue: number;
  newValue: number;
  timestamp: number;
}

export interface ClearValueAction {
  type: 'CLEAR_VALUE';
  cell: CellPosition;
  previousValue: number;
  timestamp: number;
}

export interface SetCandidatesAction {
  type: 'SET_CANDIDATES';
  cell: CellPosition;
  previousCandidates: readonly number[];
  newCandidates: readonly number[];
  timestamp: number;
}

export interface ClearCandidatesAction {
  type: 'CLEAR_CANDIDATES';
  cell: CellPosition;
  previousCandidates: readonly number[];
  timestamp: number;
}

/**
 * Completed game record for history tracking
 */
export interface GameRecord {
  /** Unique identifier */
  recordId: string;

  /** Completion date/time */
  completedAt: number;

  /** Total elapsed time (milliseconds) */
  totalTime: number;

  /** Total errors made during game */
  errorCount: number;

  /** Difficulty level (1-10) */
  difficultyLevel: number;

  /** Puzzle identifier (for potential replay) */
  puzzleId: string;

  /** Whether this is a personal best for this difficulty */
  isPersonalBest: {
    fastestTime: boolean;
    fewestErrors: boolean;
  };
}

/**
 * User preferences and settings
 */
export interface UserPreferences {
  /** Preferred difficulty level (1-10) */
  defaultDifficulty: number;

  /** Candidate mode preference */
  candidateMode: CandidateMode;

  /** Theme/appearance settings */
  theme: ThemeSettings;

  /** Keyboard shortcuts (customizable) */
  keyboardShortcuts: KeyboardShortcuts;

  /** History display preferences */
  historyPreferences: HistoryPreferences;

  /** Auto-pause timeout in minutes (default: 3 per clarification) */
  autoPauseTimeout: number;
}

export type CandidateMode = 'auto' | 'manual' | 'off';

export interface ThemeSettings {
  darkMode: boolean;
  highlightColor: string;
  errorColor: string;
}

export interface KeyboardShortcuts {
  undo: string;
  redo: string;
  newGame: string;
  toggleCandidates: string;
  [key: string]: string;
}

export interface HistoryPreferences {
  sortBy: 'date' | 'time' | 'errors' | 'difficulty';
  sortOrder: 'asc' | 'desc';
  filterDifficulty: number | null;
}

// ============================================================================
// Result Types (for error handling)
// ============================================================================

/**
 * Success result wrapper
 */
export interface Success<T> {
  success: true;
  data: T;
}

/**
 * Error result wrapper
 */
export interface Failure {
  success: false;
  error: GameError;
}

/**
 * Result type for operations that can fail
 */
export type Result<T> = Success<T> | Failure;

/**
 * Game-specific error types
 */
export interface GameError {
  code: ErrorCode;
  message: string;
  details?: unknown;
}

export type ErrorCode =
  | 'INVALID_MOVE'
  | 'PUZZLE_GENERATION_FAILED'
  | 'STORAGE_QUOTA_EXCEEDED'
  | 'INVALID_CELL_POSITION'
  | 'GAME_ALREADY_COMPLETED'
  | 'NO_SAVED_GAME'
  | 'CORRUPTED_DATA'
  | 'INVALID_DIFFICULTY';

// ============================================================================
// Utility Types
// ============================================================================

/**
 * Sudoku number (1-9)
 */
export type SudokuNumber = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;

/**
 * Cell value (0 = empty, 1-9 = filled)
 */
export type CellValue = 0 | SudokuNumber;

/**
 * Row/column index (0-8)
 */
export type GridIndex = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

/**
 * Difficulty level (1-10)
 */
export type DifficultyLevel = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Type guard to check if a value is a SudokuNumber
 */
export function isSudokuNumber(value: number): value is SudokuNumber {
  return Number.isInteger(value) && value >= 1 && value <= 9;
}

/**
 * Type guard to check if a value is a valid CellValue
 */
export function isCellValue(value: number): value is CellValue {
  return value === 0 || isSudokuNumber(value);
}

/**
 * Type guard to check if a value is a valid GridIndex
 */
export function isGridIndex(value: number): value is GridIndex {
  return Number.isInteger(value) && value >= 0 && value <= 8;
}

/**
 * Type guard to check if a value is a valid DifficultyLevel
 */
export function isDifficultyLevel(value: number): value is DifficultyLevel {
  return Number.isInteger(value) && value >= 1 && value <= 10;
}

/**
 * Creates a success result
 */
export function success<T>(data: T): Success<T> {
  return { success: true, data };
}

/**
 * Creates a failure result
 */
export function failure(code: ErrorCode, message: string, details?: unknown): Failure {
  return {
    success: false,
    error: { code, message, details }
  };
}

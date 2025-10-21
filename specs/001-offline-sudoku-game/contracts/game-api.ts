/**
 * Game Operations API Contract
 *
 * Defines the interface for all game logic operations including puzzle generation,
 * validation, move handling, and game state management.
 *
 * All functions are pure or have explicit side effects documented.
 */

import type {
  Puzzle,
  GameSession,
  CellPosition,
  Result,
  ActionHistory,
  SudokuNumber,
  CellValue,
  DifficultyLevel,
} from './types';

// ============================================================================
// Puzzle Generation & Validation
// ============================================================================

/**
 * Generates a new Sudoku puzzle with the specified difficulty
 *
 * @param difficulty - Difficulty level (1-10), mapped to clue count
 * @returns Result containing the generated puzzle or error
 *
 * **Performance**: Must complete in <2 seconds for standard difficulties (SC-007);
 * hardest settings (≥80%) may require up to 8 seconds to satisfy logic-only constraints
 * **Guarantee**: Every puzzle is uniquely solvable using logic only (FR-001)
 */
export interface GeneratePuzzle {
  (difficulty: DifficultyLevel): Promise<Result<Puzzle>>;
}

/**
 * Validates if a given cell value violates Sudoku rules
 *
 * @param board - Current 9x9 board state
 * @param position - Cell position to validate
 * @param value - Value to check (1-9)
 * @returns true if valid, false if violates row/column/box rules
 *
 * **Performance**: Must complete in <10ms (Constitution Principle II)
 */
export interface ValidateMove {
  (board: readonly (readonly number[])[], position: CellPosition, value: SudokuNumber): boolean;
}

/**
 * Checks if the puzzle is completely solved correctly
 *
 * @param board - Current 9x9 board state
 * @param solution - Expected solution
 * @returns true if all cells match solution
 *
 * **Performance**: Must complete in <100ms (Constitution Principle II)
 */
export interface CheckSolution {
  (board: readonly (readonly number[])[], solution: readonly (readonly number[])[]): boolean;
}

/**
 * Generates auto-candidate numbers for all empty cells based on current board state
 *
 * @param board - Current 9x9 board state
 * @returns Map of cell positions to their valid candidate numbers
 */
export interface GenerateCandidates {
  (board: readonly (readonly number[])[]): Map<string, Set<SudokuNumber>>;
}

// ============================================================================
// Game Session Management
// ============================================================================

/**
 * Creates a new game session with a freshly generated puzzle
 *
 * @param difficulty - Difficulty level (1-10)
 * @returns Result containing the new game session or error
 */
export interface CreateGameSession {
  (difficulty: DifficultyLevel): Promise<Result<GameSession>>;
}

/**
 * Makes a move by setting a cell value
 *
 * @param session - Current game session
 * @param position - Cell to modify
 * @param value - Value to set (1-9, or 0 to clear)
 * @returns Updated game session
 *
 * **Side Effects**:
 * - Updates board state
 * - Increments error count if invalid move persists (FR-010)
 * - Updates action history for undo
 * - Updates lastActivityAt timestamp
 * - May trigger completion detection (FR-014)
 */
export interface MakeMove {
  (session: GameSession, position: CellPosition, value: CellValue): Result<GameSession>;
}

/**
 * Clears a cell value (user deletes entry)
 *
 * @param session - Current game session
 * @param position - Cell to clear
 * @returns Updated game session
 */
export interface ClearCell {
  (session: GameSession, position: CellPosition): Result<GameSession>;
}

/**
 * Manually sets candidate numbers for a cell
 *
 * @param session - Current game session
 * @param position - Cell to modify
 * @param candidates - Set of candidate numbers (1-9)
 * @returns Updated game session
 */
export interface SetManualCandidates {
  (session: GameSession, position: CellPosition, candidates: Set<SudokuNumber>): Result<GameSession>;
}

/**
 * Toggles auto-generated candidates on/off for all empty cells
 *
 * @param session - Current game session
 * @returns Updated game session with auto-candidates toggled
 */
export interface ToggleAutoCandidates {
  (session: GameSession): GameSession;
}

/**
 * Selects a cell (for keyboard navigation and highlighting)
 *
 * @param session - Current game session
 * @param position - Cell to select (null to deselect)
 * @returns Updated game session
 *
 * **Side Effects**:
 * - Updates selectedCell
 * - May increment error count if previous cell had invalid entry (FR-010)
 */
export interface SelectCell {
  (session: GameSession, position: CellPosition | null): GameSession;
}

// ============================================================================
// Timer Management
// ============================================================================

/**
 * Updates the elapsed time for an active game session
 *
 * @param session - Current game session
 * @param currentTime - Current timestamp in milliseconds
 * @returns Updated game session with incremented elapsedTime
 *
 * **Behavior**:
 * - Only increments if isPaused is false
 * - Calculates delta from lastActivityAt
 */
export interface UpdateTimer {
  (session: GameSession, currentTime: number): GameSession;
}

/**
 * Pauses the game timer
 *
 * @param session - Current game session
 * @param pauseTime - Timestamp when pause occurred
 * @returns Updated game session with isPaused=true and pausedAt set
 */
export interface PauseTimer {
  (session: GameSession, pauseTime: number): GameSession;
}

/**
 * Resumes the game timer
 *
 * @param session - Current game session
 * @param resumeTime - Timestamp when resume occurred
 * @returns Updated game session with isPaused=false and pausedAt=null
 */
export interface ResumeTimer {
  (session: GameSession, resumeTime: number): GameSession;
}

/**
 * Checks if game should auto-pause due to inactivity
 *
 * @param session - Current game session
 * @param currentTime - Current timestamp
 * @param autoPauseMinutes - Minutes of inactivity before auto-pause (default: 5)
 * @returns true if should auto-pause
 */
export interface ShouldAutoPause {
  (session: GameSession, currentTime: number, autoPauseMinutes: number): boolean;
}

// ============================================================================
// Undo/Redo Operations
// ============================================================================

/**
 * Undoes the last action
 *
 * @param session - Current game session
 * @returns Updated game session with previous state restored, or error if no undo available
 *
 * **Behavior**:
 * - Reverts to actions[currentIndex - 1]
 * - Decrements currentIndex
 * - Updates board, cells, and error count
 */
export interface UndoMove {
  (session: GameSession): Result<GameSession>;
}

/**
 * Redoes the next action (if undo was performed)
 *
 * @param session - Current game session
 * @returns Updated game session with next state applied, or error if no redo available
 */
export interface RedoMove {
  (session: GameSession): Result<GameSession>;
}

/**
 * Checks if undo is available
 *
 * @param history - Action history
 * @returns true if can undo
 */
export interface CanUndo {
  (history: ActionHistory): boolean;
}

/**
 * Checks if redo is available
 *
 * @param history - Action history
 * @returns true if can redo
 */
export interface CanRedo {
  (history: ActionHistory): boolean;
}

// ============================================================================
// Completion Detection
// ============================================================================

/**
 * Checks if the puzzle is completed (all cells filled correctly)
 *
 * @param session - Current game session
 * @returns true if completed, false otherwise
 *
 * **Criteria**:
 * - All 81 cells filled (no zeros)
 * - Board matches puzzle solution
 * - No validation errors
 */
export interface IsPuzzleCompleted {
  (session: GameSession): boolean;
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Calculates which cells are in the same row, column, and 3x3 box as the target cell
 *
 * @param position - Target cell position
 * @returns Array of related cell positions
 */
export interface GetRelatedCells {
  (position: CellPosition): readonly CellPosition[];
}

/**
 * Maps difficulty level (1-10) to number of clues (17-50)
 *
 * @param difficulty - Difficulty level
 * @returns Number of clues for that difficulty
 */
export interface DifficultyToClues {
  (difficulty: DifficultyLevel): number;
}

/**
 * Calculates the 3x3 box index for a cell position
 *
 * @param position - Cell position
 * @returns Box indices [rowBox, colBox] (0-2 each)
 */
export interface GetBoxIndex {
  (position: CellPosition): readonly [number, number];
}

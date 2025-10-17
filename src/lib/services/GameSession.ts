/**
 * Game Session Management
 *
 * Pure functions for game state management:
 * - Creating new game sessions
 * - Making moves
 * - Cell selection
 * - Error counting
 * - Completion detection
 */

import type {
  GameSession,
  Cell,
  CellPosition,
  Result,
  DifficultyLevel,
  CellValue,
  SudokuNumber,
  ActionHistory,
  SetValueAction,
  SetCandidatesAction,
  Action
} from '../models/types';
import { success, failure, isSudokuNumber } from '../models/types';
import { generatePuzzle } from './PuzzleGenerator';
import { isValidMove } from '../utils/validation';
import { getCell, setCell } from '../utils/gridHelpers';
import { generateCandidates, eliminateCandidatesFromRelatedCells } from './GameValidator';

/**
 * Creates a new game session with a freshly generated puzzle
 *
 * @param difficulty - Difficulty level (1-10)
 * @param seed - Optional seed for reproducibility
 * @returns Result containing new game session
 */
export async function createGameSession(
  difficulty: DifficultyLevel,
  seed?: number
): Promise<Result<GameSession>> {
  // Generate puzzle
  const puzzleResult = await generatePuzzle(difficulty, seed);
  if (!puzzleResult.success) {
    return puzzleResult;
  }

  const puzzle = puzzleResult.data;
  const now = Date.now();

  // Initialize board with puzzle clues
  const board: number[][] = puzzle.grid.map(row => [...row]);

  // Initialize cells
  const cells: Cell[][] = [];
  for (let row = 0; row < 9; row++) {
    const cellRow: Cell[] = [];
    for (let col = 0; col < 9; col++) {
      const value = getCell(puzzle.grid, row, col);
      const isClue = puzzle.clues[row]?.[col] === true;

      cellRow.push({
        row,
        col,
        value,
        isClue,
        isError: false,
        manualCandidates: new Set(),
        autoCandidates: null
      });
    }
    cells.push(cellRow);
  }

  // Initialize action history
  const history: ActionHistory = {
    actions: [],
    currentIndex: 0,
    maxSize: 50
  };

  // Auto-select first non-clue cell for keyboard-only gameplay (T080)
  let selectedCell: CellPosition | null = null;
  for (let row = 0; row < 9; row++) {
    for (let col = 0; col < 9; col++) {
      if (!puzzle.clues[row]?.[col]) {
        selectedCell = { row, col };
        break;
      }
    }
    if (selectedCell) break;
  }

  const session: GameSession = {
    sessionId: `session-${now}-${Math.random().toString(36).substring(7)}`,
    puzzle,
    board,
    cells,
    startTime: now,
    elapsedTime: 0,
    isPaused: false,
    pausedAt: null,
    difficultyLevel: difficulty,
    errorCount: 0,
    isCompleted: false,
    lastActivityAt: now,
    selectedCell,
    highlightedNumber: null,
    showAutoCandidates: false,
    history
  };

  return success(session);
}

/**
 * Makes a move by setting a cell value
 *
 * @param session - Current game session
 * @param position - Cell to modify
 * @param value - Value to set (1-9, or 0 to clear)
 * @returns Updated game session
 */
export function makeMove(
  session: GameSession,
  position: CellPosition,
  value: CellValue
): Result<GameSession> {
  // Validate move
  const validationResult = validateMove(session, position);
  if (!validationResult.success) {
    return validationResult;
  }

  // Capture snapshot BEFORE making any changes (for undo)
  const snapshot = captureGridSnapshot(session.board, session.cells);

  // Create new session and update cell value
  const newSession = createUpdatedSession(session);
  const updateResult = updateCellValue(newSession, position, value);
  if (!updateResult.success) {
    return updateResult;
  }

  // Apply candidate elimination for valid moves
  if (value !== 0 && updateResult.data.isValid) {
    applyCandidateElimination(newSession, position, value as SudokuNumber);
  }

  // Update action history with snapshot
  const action: SetValueAction = {
    type: 'SET_VALUE',
    cell: position,
    newValue: value,
    timestamp: Date.now(),
    snapshot
  };

  newSession.history = addActionToHistory(session.history, action);
  newSession.isCompleted = isPuzzleCompleted(newSession);

  return success(newSession);
}

/**
 * Validates if a move can be made
 */
function validateMove(session: GameSession, position: CellPosition): Result<void> {
  const { row, col } = position;

  if (row < 0 || row > 8 || col < 0 || col > 8) {
    return failure('INVALID_CELL_POSITION', `Invalid position: (${row}, ${col})`);
  }

  const cell = session.cells[row]?.[col];
  if (!cell) {
    return failure('INVALID_CELL_POSITION', `Cell not found at (${row}, ${col})`);
  }

  if (cell.isClue) {
    return failure('INVALID_MOVE', 'Cannot modify clue cells');
  }

  if (session.isCompleted) {
    return failure('GAME_ALREADY_COMPLETED', 'Game is already completed');
  }

  return success(undefined);
}

/**
 * Creates a new session with updated state
 */
function createUpdatedSession(session: GameSession): GameSession {
  const newSession = { ...session };
  newSession.board = session.board.map(r => [...r]);
  newSession.cells = session.cells.map(r => r.map(c => ({ ...c })));
  newSession.lastActivityAt = Date.now();
  return newSession;
}

/**
 * Updates cell value and validates move
 */
function updateCellValue(
  session: GameSession,
  position: CellPosition,
  value: CellValue
): Result<{ isValid: boolean }> {
  const { row, col } = position;

  setCell(session.board, row, col, value);
  const cellRow = session.cells[row];
  if (!cellRow) {
    return failure('INVALID_CELL_POSITION', `Cell row ${row} not found`);
  }

  const cell = cellRow[col];
  if (!cell) {
    return failure('INVALID_CELL_POSITION', `Cell [${row}, ${col}] not found`);
  }

  cell.value = value;

  // Validate and mark errors
  const isValid = value !== 0 ? isValidMove(session.board, position, value as SudokuNumber) : true;
  cell.isError = value !== 0 ? !isValid : false;

  // Clear candidates when value is set
  if (value !== 0) {
    cell.manualCandidates = new Set();
  }

  return success({ isValid });
}

/**
 * Applies automatic candidate elimination to related cells
 */
function applyCandidateElimination(
  session: GameSession,
  position: CellPosition,
  value: SudokuNumber
): void {
  const eliminatedCandidates = eliminateCandidatesFromRelatedCells(
    session.board,
    session.cells,
    position,
    value
  );

  for (const [cellIndex, candidatesToRemove] of eliminatedCandidates) {
    const affectedRow = Math.floor(cellIndex / 9);
    const affectedCol = cellIndex % 9;
    const affectedCell = session.cells[affectedRow]?.[affectedCol];

    if (affectedCell) {
      for (const candidate of candidatesToRemove) {
        affectedCell.manualCandidates.delete(candidate);
      }
    }
  }
}

/**
 * Selects a cell
 *
 * When deselecting (position = null), increments error count if previous cell had error
 *
 * @param session - Current game session
 * @param position - Cell to select (null to deselect)
 * @returns Updated game session
 */
export function selectCell(
  session: GameSession,
  position: CellPosition | null
): GameSession {
  const newSession = { ...session };
  newSession.lastActivityAt = Date.now();

  // Check if previous cell had error (FR-010: error counted on deselection)
  if (session.selectedCell && position !== session.selectedCell) {
    const prevCell = session.cells[session.selectedCell.row]?.[session.selectedCell.col];
    if (prevCell && prevCell.isError && prevCell.value !== 0) {
      newSession.errorCount = session.errorCount + 1;
    }
  }

  newSession.selectedCell = position;

  return newSession;
}

/**
 * Sets the highlighted number for pattern recognition
 *
 * @param session - Current game session
 * @param number - Number to highlight (null to clear)
 * @returns Updated game session
 */
export function setHighlightedNumber(
  session: GameSession,
  number: SudokuNumber | null
): GameSession {
  const newSession = { ...session };
  newSession.lastActivityAt = Date.now();
  newSession.highlightedNumber = number;
  return newSession;
}

/**
 * Checks if puzzle is completed
 *
 * Criteria:
 * - All cells filled (no zeros)
 * - Board matches solution
 * - No errors
 */
export function isPuzzleCompleted(session: GameSession): boolean {
  // Check all cells filled
  for (let row = 0; row < 9; row++) {
    for (let col = 0; col < 9; col++) {
      if (getCell(session.board, row, col) === 0) {
        return false;
      }
    }
  }

  // Check matches solution
  for (let row = 0; row < 9; row++) {
    for (let col = 0; col < 9; col++) {
      if (getCell(session.board, row, col) !== getCell(session.puzzle.solution, row, col)) {
        return false;
      }
    }
  }

  return true;
}

/**
 * Adds action to history with size limit enforcement
 */
function addActionToHistory(
  history: ActionHistory,
  action: SetValueAction | SetCandidatesAction
): ActionHistory {
  const actions = [...history.actions.slice(0, history.currentIndex), action];

  // Enforce max size (FIFO)
  if (actions.length > history.maxSize) {
    actions.shift();
  }

  return {
    ...history,
    actions,
    currentIndex: actions.length
  };
}

/**
 * Captures a full grid snapshot (board + candidates) for undo/redo
 *
 * @param board - Current board state
 * @param cells - Cell metadata grid
 * @returns Snapshot object with board and candidates
 */
function captureGridSnapshot(
  board: readonly (readonly number[])[],
  cells: readonly (readonly Cell[])[]
): { board: number[][]; candidates: Map<string, Set<number>> } {
  // Deep copy board
  const boardCopy = board.map(row => [...row]);

  // Capture all non-empty candidates (sparse snapshot for efficiency)
  const candidates = new Map<string, Set<number>>();
  for (let row = 0; row < 9; row++) {
    for (let col = 0; col < 9; col++) {
      const cell = cells[row]?.[col];
      if (cell && cell.manualCandidates.size > 0) {
        candidates.set(`${row},${col}`, new Set(cell.manualCandidates));
      }
    }
  }

  return { board: boardCopy, candidates };
}

/**
 * Restores grid state from a snapshot
 *
 * @param session - Game session to restore
 * @param snapshot - Snapshot to restore from
 * @returns Updated game session
 */
function restoreGridFromSnapshot(
  session: GameSession,
  snapshot: { board: number[][]; candidates: Map<string, Set<number>> }
): GameSession {
  const newSession = { ...session };
  newSession.board = snapshot.board.map(row => [...row]);
  newSession.cells = session.cells.map(r => r.map(c => ({ ...c })));

  // Restore board values to cells
  for (let row = 0; row < 9; row++) {
    for (let col = 0; col < 9; col++) {
      const cellRow = newSession.cells[row];
      if (cellRow) {
        const cell = cellRow[col];
        if (cell) {
          cell.value = snapshot.board[row]?.[col] ?? 0;
          // Clear all candidates first
          cell.manualCandidates.clear();
        }
      }
    }
  }

  // Restore candidates from snapshot
  for (const [key, candidates] of snapshot.candidates) {
    const parts = key.split(',').map(Number);
    const row = parts[0];
    const col = parts[1];
    if (row !== undefined && col !== undefined) {
      const cellRow = newSession.cells[row];
      if (cellRow) {
        const cell = cellRow[col];
        if (cell) {
          cell.manualCandidates = new Set(candidates);
        }
      }
    }
  }

  return newSession;
}

/**
 * Manually sets candidate numbers for a cell
 *
 * @param session - Current game session
 * @param position - Cell to modify
 * @param candidates - Set of candidate numbers (1-9)
 * @returns Updated game session
 */
export function setManualCandidates(
  session: GameSession,
  position: CellPosition,
  candidates: Set<SudokuNumber>
): Result<GameSession> {
  const { row, col } = position;

  // Validate position
  if (row < 0 || row > 8 || col < 0 || col > 8) {
    return failure('INVALID_CELL_POSITION', `Invalid position: (${row}, ${col})`);
  }

  const cell = session.cells[row]?.[col];
  if (!cell) {
    return failure('INVALID_CELL_POSITION', `Cell not found at (${row}, ${col})`);
  }

  // Cannot set candidates on clue cells or filled cells
  if (cell.isClue || cell.value !== 0) {
    return failure('INVALID_MOVE', 'Cannot set candidates on clue or filled cells');
  }

  // Validate candidates (must be numbers 1-9)
  for (const candidate of candidates) {
    if (candidate < 1 || candidate > 9) {
      return failure('INVALID_CANDIDATES', `Invalid candidate: ${candidate}`);
    }
  }

  // Capture snapshot BEFORE making any changes (for undo)
  const snapshot = captureGridSnapshot(session.board, session.cells);

  // Create new session (immutable update)
  const newSession = { ...session };
  newSession.board = session.board.map(r => [...r]);
  newSession.cells = session.cells.map(r => r.map(c => ({ ...c })));
  newSession.lastActivityAt = Date.now();

  // Update cell candidates
  const cellRow = newSession.cells[row];
  if (!cellRow) {
    return failure('INVALID_CELL_POSITION', `Cell row ${row} not found`);
  }
  const newCell = cellRow[col];
  if (!newCell) {
    return failure('INVALID_CELL_POSITION', `Cell [${row}, ${col}] not found`);
  }

  newCell.manualCandidates = new Set(candidates);

  // Update action history with snapshot
  const action: SetCandidatesAction = {
    type: 'SET_CANDIDATES',
    cell: position,
    newCandidates: Array.from(candidates),
    timestamp: Date.now(),
    snapshot // Full grid snapshot for simple undo/redo
  };

  newSession.history = addActionToHistory(session.history, action);

  return success(newSession);
}


/**
 * Fills candidates once by converting auto-generated candidates to manual candidates
 * This is a one-time action - candidates become manual and can be edited by user
 * Overwrites ALL existing candidates in empty cells (Option A behavior)
 */
export function fillCandidatesOnce(session: GameSession): GameSession {
  // Create new session (immutable update)
  const newSession = { ...session };
  newSession.board = session.board.map(r => [...r]);
  newSession.cells = session.cells.map(r => r.map(c => ({ ...c })));
  newSession.lastActivityAt = Date.now();

  // Generate candidates using the validation service
  const allCandidates = generateCandidates(newSession.board);

  // Fill all empty cells with auto-generated candidates as manual candidates
  // This overwrites any existing manual candidates (Option A)
  for (let row = 0; row < 9; row++) {
    for (let col = 0; col < 9; col++) {
      const cell = newSession.cells[row]?.[col];
      if (cell && !cell.isClue && cell.value === 0) {
        const key = `${row},${col}`;
        const candidates = allCandidates.get(key);
        // Convert auto-candidates to manual candidates
        cell.manualCandidates = candidates ? new Set(candidates) : new Set();
        // Clear any auto-candidates (not used in new approach)
        cell.autoCandidates = null;
      }
    }
  }

  return newSession;
}

/**
 * Undo the last action (FR-022)
 *
 * @param session - Current game session
 * @returns Updated game session with previous state restored
 */
export function undoMove(session: GameSession): Result<GameSession> {
  // Check if we can undo
  if (session.history.currentIndex <= 0) {
    return failure('INVALID_MOVE', 'No actions to undo');
  }

  // Get the action to undo
  const action = session.history.actions[session.history.currentIndex - 1];
  if (!action) {
    return failure('INVALID_MOVE', 'Action not found');
  }

  // Restore from snapshot (works for all action types)
  let newSession = restoreGridFromSnapshot(session, action.snapshot);
  newSession.lastActivityAt = Date.now();

  // Move history pointer back
  newSession.history = {
    ...session.history,
    currentIndex: session.history.currentIndex - 1
  };

  // Recalculate completion status
  newSession.isCompleted = isPuzzleCompleted(newSession);

  return success(newSession);
}

/**
 * Redo the previously undone action (FR-022)
 *
 * @param session - Current game session
 * @returns Updated game session with next state applied
 */
export function redoMove(session: GameSession): Result<GameSession> {
  // Check if we can redo
  if (session.history.currentIndex >= session.history.actions.length) {
    return failure('INVALID_MOVE', 'No actions to redo');
  }

  // Get the action to redo
  const action = session.history.actions[session.history.currentIndex];
  if (!action) {
    return failure('INVALID_MOVE', 'Action not found');
  }

  let newSession = { ...session };
  newSession.lastActivityAt = Date.now();

  // Restore state and move pointer forward (don't re-execute, just restore)
  newSession = restoreStateAfterRedo(session, action);
  newSession.history = {
    ...session.history,
    currentIndex: session.history.currentIndex + 1
  };

  return success(newSession);
}

/**
 * Helper to restore state after redo without adding to history
 * Re-applies the action including candidate elimination for SET_VALUE actions
 */
function restoreStateAfterRedo(session: GameSession, action: Action): GameSession {
  let newSession = createUpdatedSession(session);

  if (action.type === 'SET_VALUE') {
    applySetValueAction(newSession, action);
  } else if (action.type === 'SET_CANDIDATES') {
    applySetCandidatesAction(newSession, action);
  }

  newSession.isCompleted = isPuzzleCompleted(newSession);
  return newSession;
}

/**
 * Applies a SET_VALUE action during redo
 */
function applySetValueAction(session: GameSession, action: SetValueAction): void {
  const { row, col } = action.cell;
  const value = action.newValue as CellValue;

  setCell(session.board, row, col, value);
  const cell = session.cells[row]?.[col];
  if (!cell) return;

  cell.value = value;

  // Clear candidates when value is set
  if (value !== 0) {
    cell.manualCandidates = new Set();
  }

  // Recalculate error status
  const isValid = value !== 0 ? isValidMove(session.board, action.cell, value as SudokuNumber) : true;
  cell.isError = value !== 0 ? !isValid : false;

  // Re-apply automatic candidate elimination (FR-012)
  if (value !== 0 && isValid) {
    applyCandidateElimination(session, action.cell, value as SudokuNumber);
  }
}

/**
 * Applies a SET_CANDIDATES action during redo
 */
function applySetCandidatesAction(session: GameSession, action: SetCandidatesAction): void {
  const { row, col } = action.cell;
  const cell = session.cells[row]?.[col];
  if (!cell) return;

  const validCandidates = new Set<SudokuNumber>();
  for (const num of action.newCandidates) {
    if (isSudokuNumber(num)) {
      validCandidates.add(num);
    }
  }
  cell.manualCandidates = validCandidates;
}

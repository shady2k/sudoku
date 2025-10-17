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
  SetCandidatesAction
} from '../models/types';
import { success, failure } from '../models/types';
import { generatePuzzle } from './PuzzleGenerator';
import { isValidMove } from '../utils/validation';
import { getCell, setCell } from '../utils/gridHelpers';
import { generateCandidates } from './GameValidator';

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
  const { row, col } = position;

  // Validate position
  if (row < 0 || row > 8 || col < 0 || col > 8) {
    return failure('INVALID_CELL_POSITION', `Invalid position: (${row}, ${col})`);
  }

  const cell = session.cells[row]?.[col];
  if (!cell) {
    return failure('INVALID_CELL_POSITION', `Cell not found at (${row}, ${col})`);
  }

  // Cannot modify clue cells
  if (cell.isClue) {
    return failure('INVALID_MOVE', 'Cannot modify clue cells');
  }

  // Check if game is already completed
  if (session.isCompleted) {
    return failure('GAME_ALREADY_COMPLETED', 'Game is already completed');
  }

  const previousValue = cell.value;

  // Create new session (immutable update)
  const newSession = { ...session };
  newSession.board = session.board.map(r => [...r]);
  newSession.cells = session.cells.map(r => r.map(c => ({ ...c })));
  newSession.lastActivityAt = Date.now();

  // Update cell value
  setCell(newSession.board, row, col, value);
  const cellRow = newSession.cells[row];
  if (!cellRow) {
    return failure('INVALID_CELL_POSITION', `Cell row ${row} not found`);
  }
  const newCell = cellRow[col];
  if (!newCell) {
    return failure('INVALID_CELL_POSITION', `Cell [${row}, ${col}] not found`);
  }
  newCell.value = value;

  // Validate move and mark error
  if (value !== 0) {
    newCell.isError = !isValidMove(newSession.board, position, value as SudokuNumber);
  } else {
    newCell.isError = false;
  }

  // Clear candidates when value is set
  if (value !== 0) {
    newCell.manualCandidates = new Set();
  }

  // Update action history
  const action: SetValueAction = {
    type: 'SET_VALUE',
    cell: position,
    previousValue,
    newValue: value,
    timestamp: Date.now()
  };

  newSession.history = addActionToHistory(session.history, action);

  // Check for completion
  newSession.isCompleted = isPuzzleCompleted(newSession);

  return success(newSession);
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

  // If selecting a cell with a value, highlight that number (FR-013)
  if (position) {
    const cell = session.cells[position.row]?.[position.col];
    if (cell && cell.value !== 0) {
      newSession.highlightedNumber = cell.value as SudokuNumber;
    } else {
      // Selecting empty cell clears highlighting
      newSession.highlightedNumber = null;
    }
  } else {
    // Deselecting clears highlighting
    newSession.highlightedNumber = null;
  }

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

  const previousCandidates = Array.from(newCell.manualCandidates);
  newCell.manualCandidates = new Set(candidates);

  // Update action history
  const action: SetCandidatesAction = {
    type: 'SET_CANDIDATES',
    cell: position,
    previousCandidates,
    newCandidates: Array.from(candidates),
    timestamp: Date.now()
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

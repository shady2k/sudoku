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
  SetValueAction
} from '../models/types';
import { success, failure } from '../models/types';
import { generatePuzzle } from './PuzzleGenerator';
import { isValidMove } from '../utils/validation';

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
    cells[row] = [];
    for (let col = 0; col < 9; col++) {
      const value = puzzle.grid[row]![col]!;
      const isClue = puzzle.clues[row]![col]!;

      cells[row]![col] = {
        row,
        col,
        value,
        isClue,
        isError: false,
        manualCandidates: new Set(),
        autoCandidates: null
      };
    }
  }

  // Initialize action history
  const history: ActionHistory = {
    actions: [],
    currentIndex: 0,
    maxSize: 50
  };

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
    selectedCell: null,
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
  newSession.board[row]![col] = value;
  const newCell = newSession.cells[row]![col]!;
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
      if (session.board[row]![col] === 0) {
        return false;
      }
    }
  }

  // Check matches solution
  for (let row = 0; row < 9; row++) {
    for (let col = 0; col < 9; col++) {
      if (session.board[row]![col] !== session.puzzle.solution[row]![col]) {
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
  action: SetValueAction
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
 * Toggles auto-candidate display
 */
export function toggleAutoCandidates(session: GameSession): GameSession {
  return {
    ...session,
    showAutoCandidates: !session.showAutoCandidates,
    lastActivityAt: Date.now()
  };
}

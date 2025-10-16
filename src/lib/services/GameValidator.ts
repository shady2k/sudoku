/**
 * Game Validator Service
 *
 * Provides candidate generation and fast validation functions for Sudoku gameplay.
 * Implements bitwise operations for <10ms performance per Constitution Principle II.
 */

import type { CellPosition, SudokuNumber } from '../models/types';

/**
 * Generates auto-candidate numbers for all empty cells based on current board state
 *
 * @param board - Current 9x9 board state
 * @returns Map of cell positions to their valid candidate numbers
 *
 * **Performance**: Must complete in <100ms per game-api.ts contract
 * **Algorithm**: Uses bitwise masks for O(1) validation per cell
 */
export function generateCandidates(board: readonly (readonly number[])[]): Map<string, Set<SudokuNumber>> {
  // Validate input board
  if (!board || board.length !== 9 || board.some(row => !row || row.length !== 9)) {
    return new Map();
  }

  const candidates = new Map<string, Set<SudokuNumber>>();

  // Pre-calculate row, column, and box constraints using bit masks
  // Each bit represents numbers 1-9 (bit 0 = 1, bit 1 = 2, ..., bit 8 = 9)
  const rowMasks = new Array<number>(9).fill(0);
  const colMasks = new Array<number>(9).fill(0);
  const boxMasks = new Array<number>(9).fill(0);

  // Build constraint masks from current board state
  for (let row = 0; row < 9; row++) {
    for (let col = 0; col < 9; col++) {
      const value = board[row][col];
      if (value > 0 && value <= 9) {
        const bit = 1 << (value - 1);
        rowMasks[row] |= bit;
        colMasks[col] |= bit;
        const boxIndex = Math.floor(row / 3) * 3 + Math.floor(col / 3);
        boxMasks[boxIndex] |= bit;
      }
    }
  }

  // Generate candidates for each empty cell
  for (let row = 0; row < 9; row++) {
    for (let col = 0; col < 9; col++) {
      const value = board[row][col];

      // Only generate candidates for empty cells
      if (value === 0) {
        const cellCandidates = getCellCandidates(row, col, rowMasks, colMasks, boxMasks);
        if (cellCandidates.size > 0) {
          const key = `${row},${col}`;
          candidates.set(key, cellCandidates);
        }
      }
    }
  }

  return candidates;
}

/**
 * Gets valid candidates for a specific cell using bitwise operations
 *
 * @param row - Cell row (0-8)
 * @param col - Cell column (0-8)
 * @param rowMasks - Pre-calculated row constraint masks
 * @param colMasks - Pre-calculated column constraint masks
 * @param boxMasks - Pre-calculated box constraint masks
 * @returns Set of valid candidate numbers
 */
function getCellCandidates(
  row: number,
  col: number,
  rowMasks: readonly number[],
  colMasks: readonly number[],
  boxMasks: readonly number[]
): Set<SudokuNumber> {
  const boxIndex = Math.floor(row / 3) * 3 + Math.floor(col / 3);

  // Combine all constraints (OR operation)
  const combinedMask = rowMasks[row] | colMasks[col] | boxMasks[boxIndex];

  // Candidates are bits that are NOT in the combined mask
  // ALL_POSSIBLE_MASK has all 9 bits set (0b111111111 = 511)
  const ALL_POSSIBLE_MASK = 511;
  const candidatesMask = ALL_POSSIBLE_MASK & ~combinedMask;

  const candidates = new Set<SudokuNumber>();

  // Extract set bits from candidates mask
  for (let num = 1; num <= 9; num++) {
    const bit = 1 << (num - 1);
    if (candidatesMask & bit) {
      candidates.add(num as SudokuNumber);
    }
  }

  return candidates;
}

/**
 * Validates if a candidate number is valid for a cell
 *
 * @param board - Current board state
 * @param row - Cell row (0-8)
 * @param col - Cell column (0-8)
 * @param candidate - Number to check (1-9)
 * @returns true if candidate is valid, false otherwise
 *
 * **Performance**: O(1) time using pre-calculated masks
 */
export function isValidCandidate(
  board: readonly (readonly number[])[],
  row: number,
  col: number,
  candidate: SudokuNumber
): boolean {
  // Validate input
  if (!board || board.length !== 9 || row < 0 || row > 8 || col < 0 || col > 8) {
    return false;
  }

  if (candidate < 1 || candidate > 9) {
    return false;
  }

  // Check if cell is already filled
  if (board[row][col] !== 0) {
    return false;
  }

  // Validate against row
  for (let c = 0; c < 9; c++) {
    if (board[row][c] === candidate) {
      return false;
    }
  }

  // Validate against column
  for (let r = 0; r < 9; r++) {
    if (board[r][col] === candidate) {
      return false;
    }
  }

  // Validate against 3x3 box
  const boxStartRow = Math.floor(row / 3) * 3;
  const boxStartCol = Math.floor(col / 3) * 3;
  for (let r = boxStartRow; r < boxStartRow + 3; r++) {
    for (let c = boxStartCol; c < boxStartCol + 3; c++) {
      if (board[r][c] === candidate) {
        return false;
      }
    }
  }

  return true;
}
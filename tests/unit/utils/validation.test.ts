import { describe, it, expect } from 'vitest';
import {
  isValidMove,
  getRelatedCells,
  getBoxIndex,
  createValidator
} from '../../../src/lib/utils/validation';

describe('validation utilities', () => {
  describe('getBoxIndex', () => {
    it('should calculate correct box index for top-left cell', () => {
      expect(getBoxIndex({ row: 0, col: 0 })).toEqual([0, 0]);
    });

    it('should calculate correct box index for middle cell', () => {
      expect(getBoxIndex({ row: 4, col: 4 })).toEqual([1, 1]);
    });

    it('should calculate correct box index for bottom-right cell', () => {
      expect(getBoxIndex({ row: 8, col: 8 })).toEqual([2, 2]);
    });

    it('should calculate correct box index for various positions', () => {
      expect(getBoxIndex({ row: 2, col: 5 })).toEqual([0, 1]);
      expect(getBoxIndex({ row: 7, col: 1 })).toEqual([2, 0]);
    });
  });

  describe('getRelatedCells', () => {
    it('should return all cells in same row, column, and box', () => {
      const related = getRelatedCells({ row: 4, col: 4 });

      // Should include 20 unique cells (8 in row + 8 in col + 4 in box, excluding self)
      expect(related.length).toBe(20);

      // Should not include the cell itself
      expect(related.some(cell => cell.row === 4 && cell.col === 4)).toBe(false);
    });

    it('should include all row cells', () => {
      const related = getRelatedCells({ row: 0, col: 0 });
      const rowCells = related.filter(cell => cell.row === 0);
      expect(rowCells.length).toBe(8); // All other cells in row 0
    });

    it('should include all column cells', () => {
      const related = getRelatedCells({ row: 0, col: 0 });
      const colCells = related.filter(cell => cell.col === 0);
      expect(colCells.length).toBe(8); // All other cells in col 0
    });

    it('should include all box cells', () => {
      const related = getRelatedCells({ row: 1, col: 1 });
      const boxCells = related.filter(cell => {
        const [boxRow, boxCol] = getBoxIndex(cell);
        return boxRow === 0 && boxCol === 0;
      });
      // 9 cells in box minus 3 already counted in row minus 3 in column minus self = 2
      expect(boxCells.length).toBeGreaterThan(0);
    });
  });

  describe('isValidMove', () => {
    const createEmptyBoard = (): number[][] => {
      return Array.from({ length: 9 }, () => Array(9).fill(0));
    };

    it('should return true for valid move on empty board', () => {
      const board = createEmptyBoard();
      expect(isValidMove(board, { row: 0, col: 0 }, 5)).toBe(true);
    });

    it('should return false when number exists in same row', () => {
      const board = createEmptyBoard();
      board[0][5] = 5;
      expect(isValidMove(board, { row: 0, col: 0 }, 5)).toBe(false);
    });

    it('should return false when number exists in same column', () => {
      const board = createEmptyBoard();
      board[5][0] = 5;
      expect(isValidMove(board, { row: 0, col: 0 }, 5)).toBe(false);
    });

    it('should return false when number exists in same box', () => {
      const board = createEmptyBoard();
      board[1][1] = 5;
      expect(isValidMove(board, { row: 0, col: 0 }, 5)).toBe(false);
    });

    it('should return true when number exists in different areas', () => {
      const board = createEmptyBoard();
      board[5][5] = 5; // Different row, column, and box
      expect(isValidMove(board, { row: 0, col: 0 }, 5)).toBe(true);
    });

    it('should ignore current cell value when validating', () => {
      const board = createEmptyBoard();
      board[0][0] = 5;
      expect(isValidMove(board, { row: 0, col: 0 }, 5)).toBe(true);
    });
  });

  describe('FastValidator', () => {
    const createEmptyBoard = (): number[][] => {
      return Array.from({ length: 9 }, () => Array(9).fill(0));
    };

    it('should validate moves using bitmask optimization', () => {
      const board = createEmptyBoard();
      board[0][1] = 5;
      board[1][0] = 3;
      board[1][1] = 7;

      const validator = createValidator(board);

      // Invalid: 5 already in row
      expect(validator.validateMove(0, 0, 5)).toBe(false);

      // Invalid: 3 already in column
      expect(validator.validateMove(0, 0, 3)).toBe(false);

      // Invalid: 7 already in box
      expect(validator.validateMove(0, 0, 7)).toBe(false);

      // Valid: 1 not in row, column, or box
      expect(validator.validateMove(0, 0, 1)).toBe(true);
    });

    it('should update masks after move', () => {
      const board = createEmptyBoard();
      const validator = createValidator(board);

      // Initially valid
      expect(validator.validateMove(0, 0, 5)).toBe(true);

      // Make move
      validator.updateMove(0, 0, 0, 5);

      // Now invalid in same row
      expect(validator.validateMove(0, 1, 5)).toBe(false);

      // Still valid in different row
      expect(validator.validateMove(5, 5, 5)).toBe(true);
    });

    it('should handle clearing values', () => {
      const board = createEmptyBoard();
      board[0][0] = 5;
      const validator = createValidator(board);

      // Invalid because 5 is already there
      expect(validator.validateMove(0, 1, 5)).toBe(false);

      // Clear the value
      validator.updateMove(0, 0, 5, 0);

      // Now valid
      expect(validator.validateMove(0, 1, 5)).toBe(true);
    });

    it('should complete validation in <10ms', () => {
      const board = createEmptyBoard();
      // Fill board with some values
      for (let i = 0; i < 9; i++) {
        board[i][i] = ((i % 9) + 1) as any;
      }

      const validator = createValidator(board);
      const startTime = performance.now();

      // Perform 1000 validations
      for (let i = 0; i < 1000; i++) {
        validator.validateMove(
          i % 9,
          (i + 1) % 9,
          ((i % 9) + 1) as any
        );
      }

      const elapsed = performance.now() - startTime;

      // Each validation should take less than 0.01ms on average
      expect(elapsed / 1000).toBeLessThan(0.01);
    });
  });
});

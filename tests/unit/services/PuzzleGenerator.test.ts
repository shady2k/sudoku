import { describe, it, expect } from 'vitest';
import { generatePuzzle, generateCompleteGrid } from '../../../src/lib/services/PuzzleGenerator';
import { isValidMove } from '../../../src/lib/utils/validation';

describe('PuzzleGenerator', () => {
  describe('generateCompleteGrid', () => {
    it('should generate a valid complete 9x9 grid', async () => {
      const result = await generateCompleteGrid(12345);

      expect(result.success).toBe(true);
      if (result.success) {
        const grid = result.data;

        // Check dimensions
        expect(grid.length).toBe(9);
        expect(grid.every(row => row.length === 9)).toBe(true);

        // Check all cells filled (1-9)
        expect(grid.every(row => row.every(val => val >= 1 && val <= 9))).toBe(true);
      }
    });

    it('should generate valid rows (no duplicates)', async () => {
      const result = await generateCompleteGrid(12345);

      expect(result.success).toBe(true);
      if (result.success) {
        const grid = result.data;

        grid.forEach(row => {
          const set = new Set(row);
          expect(set.size).toBe(9); // All unique values
        });
      }
    });

    it('should generate valid columns (no duplicates)', async () => {
      const result = await generateCompleteGrid(12345);

      expect(result.success).toBe(true);
      if (result.success) {
        const grid = result.data;

        for (let col = 0; col < 9; col++) {
          const column = grid.map(row => row[col]);
          const set = new Set(column);
          expect(set.size).toBe(9);
        }
      }
    });

    it('should generate valid boxes (no duplicates)', async () => {
      const result = await generateCompleteGrid(12345);

      expect(result.success).toBe(true);
      if (result.success) {
        const grid = result.data;

        for (let boxRow = 0; boxRow < 3; boxRow++) {
          for (let boxCol = 0; boxCol < 3; boxCol++) {
            const box: number[] = [];
            for (let r = 0; r < 3; r++) {
              for (let c = 0; c < 3; c++) {
                box.push(grid[boxRow * 3 + r]![boxCol * 3 + c]!);
              }
            }
            const set = new Set(box);
            expect(set.size).toBe(9);
          }
        }
      }
    });

    it('should generate reproducible grid with same seed', async () => {
      const result1 = await generateCompleteGrid(42);
      const result2 = await generateCompleteGrid(42);

      expect(result1.success).toBe(true);
      expect(result2.success).toBe(true);

      if (result1.success && result2.success) {
        expect(result1.data).toEqual(result2.data);
      }
    });

    it('should generate different grids with different seeds', async () => {
      const result1 = await generateCompleteGrid(42);
      const result2 = await generateCompleteGrid(123);

      expect(result1.success).toBe(true);
      expect(result2.success).toBe(true);

      if (result1.success && result2.success) {
        expect(result1.data).not.toEqual(result2.data);
      }
    });
  });

  describe('generatePuzzle - basic functionality', () => {
    it('should generate puzzle with correct difficulty', async () => {
      const result = await generatePuzzle(50); // Medium difficulty (50%)

      expect(result.success).toBe(true);
      if (result.success) {
        const puzzle = result.data;

        // Count clues
        let clueCount = 0;
        puzzle.grid.forEach(row => {
          row.forEach(val => {
            if (val !== 0) clueCount++;
          });
        });

        // Difficulty 50% should have around 33-34 clues (50% between 17-50)
        expect(clueCount).toBeGreaterThan(28);
        expect(clueCount).toBeLessThan(38);
        expect(puzzle.difficultyRating).toBe(clueCount);
      }
    });

    it('should generate puzzle within time budget', async () => {
      const start = performance.now();
      const result = await generatePuzzle(50);
      const elapsed = performance.now() - start;

      expect(result.success).toBe(true);
      // Should complete in <2000ms per SC-007
      expect(elapsed).toBeLessThan(2000);
    });

    it('should mark clues correctly', async () => {
      const result = await generatePuzzle(50);

      expect(result.success).toBe(true);
      if (result.success) {
        const { grid, clues } = result.data;

        for (let row = 0; row < 9; row++) {
          for (let col = 0; col < 9; col++) {
            const hasValue = grid[row]![col] !== 0;
            const isClue = clues[row]![col];

            // Clue markers should match non-zero cells
            expect(isClue).toBe(hasValue);
          }
        }
      }
    });

    it('should generate reproducible puzzle with seed', async () => {
      const seed = 12345;
      const result1 = await generatePuzzle(50, seed);
      const result2 = await generatePuzzle(50, seed);

      expect(result1.success).toBe(true);
      expect(result2.success).toBe(true);

      if (result1.success && result2.success) {
        expect(result1.data.grid).toEqual(result2.data.grid);
      }
    });
  });

  describe('generatePuzzle - validation', () => {
    it('should generate valid puzzle (all clues follow Sudoku rules)', async () => {
      const result = await generatePuzzle(50);

      expect(result.success).toBe(true);
      if (result.success) {
        const { grid } = result.data;

        for (let row = 0; row < 9; row++) {
          for (let col = 0; col < 9; col++) {
            const val = grid[row]![col]!;
            if (val !== 0) {
              expect(isValidMove(grid, { row, col }, val as any)).toBe(true);
            }
          }
        }
      }
    });

    it('should include solution grid', async () => {
      const result = await generatePuzzle(50);

      expect(result.success).toBe(true);
      if (result.success) {
        const { solution } = result.data;

        // Solution should be complete (no zeros)
        expect(solution.every(row => row.every(val => val >= 1 && val <= 9))).toBe(true);

        // Solution should be valid Sudoku
        for (let row = 0; row < 9; row++) {
          for (let col = 0; col < 9; col++) {
            const val = solution[row]![col]!;
            expect(isValidMove(solution, { row, col }, val as any)).toBe(true);
          }
        }
      }
    });
  });

  describe('generatePuzzle - difficulty levels', () => {
    it('should generate easier puzzle with difficulty 0%', async () => {
      const result = await generatePuzzle(0);

      expect(result.success).toBe(true);
      if (result.success) {
        const puzzle = result.data;

        let clueCount = 0;
        puzzle.grid.forEach(row => {
          row.forEach(val => {
            if (val !== 0) clueCount++;
          });
        });

        // Difficulty 0% should have ~50 clues (easiest)
        expect(clueCount).toBeGreaterThan(45);
      }
    });

    it('should generate harder puzzle with difficulty 100%', async () => {
      const result = await generatePuzzle(100);

      expect(result.success).toBe(true);
      if (result.success) {
        const puzzle = result.data;

        let clueCount = 0;
        puzzle.grid.forEach(row => {
          row.forEach(val => {
            if (val !== 0) clueCount++;
          });
        });

        // Difficulty 100% should have ~17 clues (hardest)
        expect(clueCount).toBeLessThan(25);
      }
    });
  });
});

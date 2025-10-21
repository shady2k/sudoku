/**
 * Sudoku Puzzle Generator (Simplified)
 *
 * Generates valid Sudoku puzzles using:
 * 1. Backtracking algorithm for complete grid generation
 * 2. Random cell removal with unique solution verification
 * 3. Seeded random for reproducibility
 *
 * Guarantee: Unique solution (solvable)
 */

import type { Puzzle, Result, DifficultyLevel } from '../models/types';
import { success, failure, isDifficultyLevel } from '../models/types';
import { SeededRandom } from '../utils/seededRandom';
import { difficultyToClues } from '../utils/validation';
import { getCell, setCell } from '../utils/gridHelpers';

/**
 * Generates a complete valid Sudoku grid
 *
 * Uses backtracking algorithm with randomization
 *
 * @param seed - Seed for reproducibility
 * @returns 9x9 grid filled with valid Sudoku solution
 */
export async function generateCompleteGrid(seed?: number): Promise<Result<number[][]>> {
  const rng = new SeededRandom(seed);
  const grid: number[][] = Array.from({ length: 9 }, () => Array(9).fill(0));

  // Fill grid using backtracking
  if (!fillGrid(grid, rng)) {
    return failure('PUZZLE_GENERATION_FAILED', 'Failed to generate complete grid');
  }

  return success(grid);
}

/**
 * Fills a grid using backtracking algorithm with randomization
 *
 * @param grid - Grid to fill (modified in place)
 * @param rng - Random number generator for shuffling candidates
 * @returns true if successfully filled
 */
function fillGrid(grid: number[][], rng: SeededRandom): boolean {
  // Find next empty cell
  const empty = findEmptyCell(grid);
  if (!empty) {
    return true; // Grid is complete
  }

  const { row, col } = empty;

  // Try numbers 1-9 in random order
  const numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9];
  rng.shuffle(numbers);

  for (const num of numbers) {
    if (isValidPlacement(grid, row, col, num)) {
      setCell(grid, row, col, num);

      if (fillGrid(grid, rng)) {
        return true;
      }

      // Backtrack
      setCell(grid, row, col, 0);
    }
  }

  return false;
}

/**
 * Finds the first empty cell (with value 0)
 */
function findEmptyCell(grid: readonly (readonly number[])[]): { row: number; col: number } | null {
  for (let row = 0; row < 9; row++) {
    for (let col = 0; col < 9; col++) {
      if (getCell(grid, row, col) === 0) {
        return { row, col };
      }
    }
  }
  return null;
}

/**
 * Checks if a number can be placed at a position
 */
function isValidPlacement(
  grid: readonly (readonly number[])[],
  row: number,
  col: number,
  num: number
): boolean {
  // Check row
  for (let c = 0; c < 9; c++) {
    if (getCell(grid, row, c) === num) return false;
  }

  // Check column
  for (let r = 0; r < 9; r++) {
    if (getCell(grid, r, col) === num) return false;
  }

  // Check 3x3 box
  const boxRow = Math.floor(row / 3) * 3;
  const boxCol = Math.floor(col / 3) * 3;
  for (let r = boxRow; r < boxRow + 3; r++) {
    for (let c = boxCol; c < boxCol + 3; c++) {
      if (getCell(grid, r, c) === num) return false;
    }
  }

  return true;
}

/**
 * Validates difficulty and seed parameters
 */
function validateInputs(difficulty: DifficultyLevel, seed?: number): Result<number> {
  if (!isDifficultyLevel(difficulty)) {
    return failure('INVALID_DIFFICULTY', `Invalid difficulty: ${difficulty}%. Must be 0-100.`);
  }

  if (!Number.isFinite(difficulty) || difficulty < 0 || difficulty > 100 || !Number.isInteger(difficulty)) {
    return failure('INVALID_DIFFICULTY', `Difficulty must be an integer between 0-100, received: ${difficulty}`);
  }

  const validSeed = seed !== undefined && Number.isFinite(seed) &&
    seed >= Number.MIN_SAFE_INTEGER && seed <= Number.MAX_SAFE_INTEGER
    ? seed : Date.now();

  return success(validSeed);
}

/**
 * Generates a Sudoku puzzle with specified difficulty
 *
 * Simplified version: generates a complete grid and removes cells to target clue count.
 * Ensures puzzle is solvable by verifying unique solution.
 * For very hard puzzles, tries multiple grids to find one that can reach lower clue counts.
 *
 * @param difficulty - Difficulty level (0-100%, where 0% = easiest, 100% = hardest)
 * @param seed - Optional seed for reproducibility
 * @returns Puzzle with clues, solution, and metadata
 */
export async function generatePuzzle(
  difficulty: DifficultyLevel,
  seed?: number
): Promise<Result<Puzzle>> {
  const validationResult = validateInputs(difficulty, seed);
  if (!validationResult.success) {
    return validationResult;
  }
  const validSeed = validationResult.data;
  const targetClues = difficultyToClues(difficulty);

  // For very hard puzzles, try multiple grids to get better results
  const maxAttempts = difficulty >= 80 ? 5 : 1;
  let bestPuzzle = null;
  let bestClueCount = 81;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const attemptSeed = validSeed + attempt;

    // Generate complete grid
    const gridResult = await generateCompleteGrid(attemptSeed);
    if (!gridResult.success) {
      continue;
    }

    const solution = gridResult.data;
    const rng = new SeededRandom(attemptSeed);

    // Remove cells to reach target difficulty
    const { grid: puzzle, clueCount } = removeCellsSimple(solution, targetClues, rng);

    // Keep the best result
    if (clueCount < bestClueCount) {
      bestPuzzle = {
        grid: puzzle,
        solution: solution.map(row => [...row]),
        clueCount
      };
      bestClueCount = clueCount;
    }

    // If we reached the target, stop early
    if (clueCount <= targetClues) {
      break;
    }
  }

  if (!bestPuzzle) {
    return failure('PUZZLE_GENERATION_FAILED', 'Failed to generate puzzle');
  }

  return success({
    grid: bestPuzzle.grid,
    solution: bestPuzzle.solution,
    clues: bestPuzzle.grid.map(row => row.map(val => val !== 0)),
    difficultyRating: bestPuzzle.clueCount,
    puzzleId: `puzzle-${validSeed}-${difficulty}`,
    generatedAt: Date.now()
  });
}

/**
 * Simplified cell removal - removes cells randomly until target is reached
 * Only checks for unique solution to ensure puzzle is solvable
 * Uses multiple passes to achieve better results
 */
function removeCellsSimple(
  solution: number[][],
  targetClues: number,
  rng: SeededRandom
): { grid: number[][]; clueCount: number } {
  const puzzle = solution.map(row => [...row]);
  let clueCount = 81;

  // Multiple passes to get closer to target
  const maxPasses = 2;
  for (let pass = 0; pass < maxPasses; pass++) {
    // Get all filled positions and shuffle
    const positions: Array<{ row: number; col: number }> = [];
    for (let row = 0; row < 9; row++) {
      for (let col = 0; col < 9; col++) {
        if (puzzle[row]?.[col]) {
          positions.push({ row, col });
        }
      }
    }
    rng.shuffle(positions);

    let removedInPass = 0;
    // Try to remove cells
    for (const pos of positions) {
      if (clueCount <= targetClues) break;

      const currentValue = puzzle[pos.row]?.[pos.col];
      if (currentValue === undefined || currentValue === 0) continue;

      // Try removing the cell
      setCell(puzzle, pos.row, pos.col, 0);

      // Check if still has unique solution
      if (hasUniqueSolution(puzzle)) {
        clueCount--;
        removedInPass++;
      } else {
        // Restore the cell
        setCell(puzzle, pos.row, pos.col, currentValue);
      }
    }

    // Stop if we reached target or made no progress
    if (clueCount <= targetClues || removedInPass === 0) break;
  }

  return { grid: puzzle, clueCount };
}

/**
 * Validates that a puzzle has a unique solution
 *
 * Uses backtracking with solution counting and early termination
 * If multiple solutions exist, returns false early
 *
 * @param puzzle - Puzzle to validate
 * @returns true if unique solution exists
 */
export function hasUniqueSolution(puzzle: readonly (readonly number[])[]): boolean {
  const grid = puzzle.map(row => [...row]);
  let solutionCount = 0;

  function solve(): boolean {
    if (solutionCount > 1) {
      return true; // Early termination signal
    }

    const empty = findEmptyCell(grid);
    if (!empty) {
      solutionCount++;
      return solutionCount > 1;
    }

    const { row, col } = empty;

    for (let num = 1; num <= 9; num++) {
      if (isValidPlacement(grid, row, col, num)) {
        setCell(grid, row, col, num);

        const shouldTerminate = solve();

        setCell(grid, row, col, 0); // Backtrack

        if (shouldTerminate) {
          return true;
        }
      }
    }

    return false;
  }

  solve();
  return solutionCount === 1;
}


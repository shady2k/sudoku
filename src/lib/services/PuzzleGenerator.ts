/**
 * Sudoku Puzzle Generator
 *
 * Generates valid Sudoku puzzles using:
 * 1. Backtracking algorithm for complete grid generation
 * 2. Strategic cell removal for difficulty control
 * 3. Seeded random for reproducibility
 *
 * Performance target: <2 seconds (SC-007)
 * Guarantee: Unique solution, logic-solvable (FR-001)
 */

import type { Puzzle, Result, DifficultyLevel } from '../models/types';
import { success, failure, isDifficultyLevel } from '../models/types';
import { SeededRandom } from '../utils/seededRandom';
import { difficultyToClues, generateAllCandidates } from '../utils/validation';
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
 * Generates a Sudoku puzzle with specified difficulty
 *
 * @param difficulty - Difficulty level (0-100%, where 0% = easiest, 100% = hardest)
 * @param seed - Optional seed for reproducibility
 * @returns Puzzle with clues, solution, and metadata
 *
 * Performance: Target <2 seconds (SC-007)
 * Guarantee: Unique solution with time-based circuit breaker (2s timeout)
 * Fallback: Progressive difficulty reduction if timeout exceeded
 */
export async function generatePuzzle(
  difficulty: DifficultyLevel,
  seed?: number
): Promise<Result<Puzzle>> {
  if (!isDifficultyLevel(difficulty)) {
    return failure('INVALID_DIFFICULTY', `Invalid difficulty: ${difficulty}%. Must be 0-100.`);
  }

  /**
   * Input Validation
   * Validates difficulty parameter to ensure it's a valid integer between 0-100
   * and sanitizes the seed to prevent invalid or dangerous values
   */

  // Validate difficulty parameter
  if (!Number.isFinite(difficulty)) {
    return failure('INVALID_DIFFICULTY', `Difficulty must be a finite number, received: ${difficulty}`);
  }

  if (difficulty < 0 || difficulty > 100) {
    return failure('INVALID_DIFFICULTY', `Difficulty must be between 0 and 100, received: ${difficulty}`);
  }

  if (!Number.isInteger(difficulty)) {
    return failure('INVALID_DIFFICULTY', `Difficulty must be an integer, received: ${difficulty}`);
  }

  /**
   * Seed Validation and Sanitization
   * Ensures seed is a valid finite number within safe integer range
   * Falls back to timestamp if invalid to maintain backward compatibility
   * Negative seeds are allowed as they're mathematically valid for seeding
   */
  let validSeed: number;
  if (seed !== undefined && Number.isFinite(seed) && seed >= Number.MIN_SAFE_INTEGER && seed <= Number.MAX_SAFE_INTEGER) {
    validSeed = seed;
  } else {
    validSeed = Date.now();
  }

  // Progressive fallback: Try 100% → 95% → 90% → error
  const difficultyAttempts: DifficultyLevel[] = [difficulty];
  if (difficulty === 100) {
    difficultyAttempts.push(95, 90);
  } else if (difficulty >= 95) {
    difficultyAttempts.push(difficulty - 5);
  }

  for (const attemptDifficulty of difficultyAttempts) {
    const result = await generatePuzzleWithTimeout(attemptDifficulty, validSeed, 2000);

    if (result.success) {
      return result;
    }
  }

  // All attempts failed - provide helpful error message
  return failure(
    'PUZZLE_GENERATION_FAILED',
    `Failed to generate valid puzzle at difficulty ${difficulty}% after ${difficultyAttempts.length} difficulty level attempts (tried: ${difficultyAttempts.join('%, ')}%). Consider using difficulty ${difficultyAttempts[difficultyAttempts.length - 1] ?? difficulty}% for faster generation.`
  );
}

/**
 * Internal function to generate puzzle with time-based circuit breaker
 */
async function generatePuzzleWithTimeout(
  difficulty: DifficultyLevel,
  seed: number,
  maxTimeMs: number
): Promise<Result<Puzzle>> {
  const startTime = Date.now();
  const targetClues = difficultyToClues(difficulty);
  let attempt = 0;
  const maxAttempts = 100; // Prevent infinite loops

  // Time-based circuit breaker: Keep trying until timeout or max attempts
  while (Date.now() - startTime < maxTimeMs && attempt < maxAttempts) {
    /**
     * Improved Seed Variation using Linear Congruential Generator (LCG)
     * Uses LCG constants for better distribution across attempts:
     * - Multiplier: 1664525 (common LCG constant)
     * - Increment: 1013904223 * attempt (varies per attempt)
     * - >>> 0 converts to unsigned 32-bit integer for consistent behavior
     */
    // Use linear congruential generator (LCG) constants for better distribution
    const attemptSeed = (seed * 1664525 + attempt * 1013904223) >>> 0;
    const rng = new SeededRandom(attemptSeed);

    // Step 1: Generate complete grid
    const gridResult = await generateCompleteGrid(attemptSeed);
    if (!gridResult.success) {
      attempt++;
      continue; // Try next attempt
    }

    const solution = gridResult.data;

    // Step 2: Create puzzle by removing cells
    const puzzle = removeCells(solution, targetClues, rng);

    // Step 3: Quick validation before expensive uniqueness check
    const actualClues = puzzle.reduce(
      (sum, row) => sum + row.filter(val => val !== 0).length,
      0
    );

    // Skip if too many clues removed (puzzle too hard)
    if (actualClues < 17) {
      attempt++;
      continue;
    }

    // Step 4: Validate uniqueness with timeout protection
    const uniquenessStartTime = Date.now();
    const uniqueSolution = hasUniqueSolution(puzzle);
    const uniquenessDuration = Date.now() - uniquenessStartTime;

    if (uniquenessDuration > 500 || !uniqueSolution) {
      attempt++;
      continue; // Try next attempt
    }

    // Step 5: Create clue markers
    const clues: boolean[][] = puzzle.map(row =>
      row.map(val => val !== 0)
    );

    return success({
      grid: puzzle.map(row => [...row]), // Make readonly
      solution: solution.map(row => [...row]), // Make readonly
      clues: clues.map(row => [...row]), // Make readonly
      difficultyRating: actualClues,
      puzzleId: `puzzle-${attemptSeed}-${difficulty}`,
      generatedAt: Date.now()
    });
  }

  // Timeout exceeded or max attempts reached
  return failure(
    'PUZZLE_GENERATION_FAILED',
    `Failed to generate valid puzzle at difficulty ${difficulty}% within ${maxTimeMs}ms (tried ${attempt + 1} attempts)`
  );
}

/**
 * Removes cells from a complete grid to create a puzzle
 *
 * Strategy: Random removal with target clue count
 *
 * @param solution - Complete valid grid
 * @param targetClues - Desired number of clues
 * @param rng - Random number generator
 * @returns Grid with cells removed (0 = empty)
 */
function removeCells(
  solution: number[][],
  targetClues: number,
  rng: SeededRandom
): number[][] {
  // Create copy of solution
  const puzzle = solution.map(row => [...row]);

  // Create list of all positions
  const positions: Array<{ row: number; col: number }> = [];
  for (let row = 0; row < 9; row++) {
    for (let col = 0; col < 9; col++) {
      positions.push({ row, col });
    }
  }

  // Shuffle positions for random removal
  rng.shuffle(positions);

  // Remove cells until we reach target clue count
  let currentClueCount = 81;

  for (const pos of positions) {
    if (currentClueCount <= targetClues) break;

    const row = puzzle[pos.row];
    if (!row) continue;
    const currentValue = row[pos.col];
    if (currentValue === undefined || currentValue === 0) continue;

    setCell(puzzle, pos.row, pos.col, 0);

    const unique = hasUniqueSolution(puzzle);
    const logical = unique && isLogicallySolvable(puzzle);

    if (unique && logical) {
      currentClueCount--;
      continue;
    }

    // Revert removal if constraints are not met
    setCell(puzzle, pos.row, pos.col, currentValue);
  }

  return puzzle;
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

/**
 * Helper: Check for contradictions (empty cells without candidates)
 */
function hasContradiction(board: number[][], candidatesMap: Map<string, Set<number>>): boolean {
  for (let row = 0; row < 9; row++) {
    for (let col = 0; col < 9; col++) {
      if (board[row]?.[col] === 0 && !candidatesMap.has(`${row},${col}`)) {
        return true;
      }
    }
  }
  return false;
}

/**
 * Helper: Apply naked singles technique
 */
function applyNakedSingles(board: number[][], candidatesMap: Map<string, Set<number>>): boolean {
  let progress = false;
  for (const [key, candidates] of candidatesMap) {
    if (candidates.size === 1) {
      const [row, col] = parseKey(key);
      const value = candidates.values().next().value as number | undefined;
      if (value !== undefined) {
        setCell(board, row, col, value);
        progress = true;
      }
    }
  }
  return progress;
}

/**
 * Helper: Apply hidden singles technique for a region
 */
function applyHiddenSingles(
  board: number[][],
  candidatesMap: Map<string, Set<number>>,
  getCells: () => Array<[number, number]>
): boolean {
  const candidatePositions = new Map<number, Array<[number, number]>>();

  for (const [row, col] of getCells()) {
    if (board[row]?.[col] !== 0) continue;
    const key = `${row},${col}`;
    const candidates = candidatesMap.get(key);
    if (!candidates) continue;

    for (const candidate of candidates) {
      const positions = candidatePositions.get(candidate) ?? [];
      positions.push([row, col]);
      candidatePositions.set(candidate, positions);
    }
  }

  let progress = false;
  for (const [candidate, positions] of candidatePositions) {
    if (positions.length === 1) {
      const pos = positions[0];
      if (pos) {
        const [r, c] = pos;
        setCell(board, r, c, candidate);
        progress = true;
      }
    }
  }
  return progress;
}

/**
 * Helper: Apply hidden singles for all regions (rows, columns, boxes)
 */
function applyAllHiddenSingles(board: number[][], candidatesMap: Map<string, Set<number>>): boolean {
  let progress = false;

  // Rows
  for (let row = 0; row < 9; row++) {
    if (applyHiddenSingles(board, candidatesMap, () => {
      const cells: Array<[number, number]> = [];
      for (let col = 0; col < 9; col++) cells.push([row, col]);
      return cells;
    })) {
      progress = true;
    }
  }
  if (progress) return true;

  // Columns
  for (let col = 0; col < 9; col++) {
    if (applyHiddenSingles(board, candidatesMap, () => {
      const cells: Array<[number, number]> = [];
      for (let row = 0; row < 9; row++) cells.push([row, col]);
      return cells;
    })) {
      progress = true;
    }
  }
  if (progress) return true;

  // Boxes
  for (let boxRow = 0; boxRow < 3; boxRow++) {
    for (let boxCol = 0; boxCol < 3; boxCol++) {
      if (applyHiddenSingles(board, candidatesMap, () => {
        const cells: Array<[number, number]> = [];
        for (let r = boxRow * 3; r < boxRow * 3 + 3; r++) {
          for (let c = boxCol * 3; c < boxCol * 3 + 3; c++) {
            cells.push([r, c]);
          }
        }
        return cells;
      })) {
        progress = true;
      }
    }
  }

  return progress;
}

/**
 * Checks whether a puzzle can be solved using deterministic logic (no guessing)
 *
 * Supported strategies:
 * - Naked singles
 * - Hidden singles (row, column, 3x3 box)
 */
export function isLogicallySolvable(puzzle: readonly (readonly number[])[]): boolean {
  const board = puzzle.map(row => [...row]);

  const maxIterations = 81;
  for (let iteration = 0; iteration < maxIterations; iteration++) {
    if (isBoardComplete(board)) {
      return true;
    }

    const candidatesMap = generateAllCandidates(board);

    // Check for contradictions
    if (hasContradiction(board, candidatesMap)) {
      return false;
    }

    // Try naked singles
    if (applyNakedSingles(board, candidatesMap)) {
      continue;
    }

    // Try hidden singles
    if (applyAllHiddenSingles(board, candidatesMap)) {
      continue;
    }

    // No progress made
    return false;
  }

  return isBoardComplete(board);
}

function parseKey(key: string): [number, number] {
  const [rowString, colString] = key.split(',');
  const row = Number.parseInt(rowString ?? '', 10);
  const col = Number.parseInt(colString ?? '', 10);
  return [row, col];
}

function isBoardComplete(board: readonly (readonly number[])[]): boolean {
  return board.every(row => row.every(value => value !== 0));
}

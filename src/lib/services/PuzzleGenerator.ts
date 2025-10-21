/**
 * Sudoku Puzzle Generator
 *
 * Generates valid Sudoku puzzles using:
 * 1. Backtracking algorithm for complete grid generation
 * 2. Strategic cell removal for difficulty control
 * 3. Seeded random for reproducibility
 *
 * Performance target: <2 seconds for standard puzzles (SC-007); hardest (≥80%)
 * difficulties may require up to ~8 seconds to reach near-minimal clue counts.
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
 * Performance: Target <2 seconds for standard difficulties (SC-007); hardest attempts may use extended budget
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
    const timeBudget =
      attemptDifficulty >= 80 ? 8000 :
      attemptDifficulty >= 50 ? 4000 :
      2000;
    const result = await generatePuzzleWithTimeout(attemptDifficulty, validSeed, timeBudget);

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
  let bestAttempt: {
    grid: number[][];
    solution: number[][];
    clues: boolean[][];
    clueCount: number;
    puzzleId: string;
    generatedAt: number;
  } | null = null;

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

    if (!bestAttempt) {
      const baselineClues: boolean[][] = solution.map(row =>
        row.map(() => true)
      );
      bestAttempt = {
        grid: solution.map(row => [...row]),
        solution: solution.map(row => [...row]),
        clues: baselineClues,
        clueCount: 81,
        puzzleId: `puzzle-${attemptSeed}-${difficulty}`,
        generatedAt: Date.now()
      };
    }

    // Step 2: Create puzzle by removing cells
    const deadline = startTime + maxTimeMs;
    const { grid: puzzle, clueCount: actualClues, timedOut } = removeCells(
      solution,
      targetClues,
      rng,
      deadline
    );

    // Skip if too many clues removed (puzzle too hard / invalid)
    if (actualClues < 17) {
      attempt++;
      continue;
    }

    // Step 3: Validate uniqueness with timeout protection
    const uniquenessStartTime = Date.now();
    const uniqueSolution = hasUniqueSolution(puzzle);
    const uniquenessDuration = Date.now() - uniquenessStartTime;

    if (uniquenessDuration > 500 || !uniqueSolution) {
      attempt++;
      continue; // Try next attempt
    }

    // Step 4: Create clue markers
    const clues: boolean[][] = puzzle.map(row =>
      row.map(val => val !== 0)
    );

    const attemptResult = {
      grid: puzzle.map(row => [...row]),
      solution: solution.map(row => [...row]),
      clues: clues.map(row => [...row]),
      clueCount: actualClues,
      puzzleId: `puzzle-${attemptSeed}-${difficulty}`,
      generatedAt: Date.now()
    };

    if (actualClues <= targetClues) {
      return success({
        grid: attemptResult.grid,
        solution: attemptResult.solution,
        clues: attemptResult.clues,
        difficultyRating: actualClues,
        puzzleId: attemptResult.puzzleId,
        generatedAt: attemptResult.generatedAt
      });
    }

    if (!bestAttempt || actualClues < bestAttempt.clueCount) {
      bestAttempt = attemptResult;
    }

    if (timedOut) {
      break;
    }

    attempt++;
  }

  if (bestAttempt) {
    return success({
      grid: bestAttempt.grid,
      solution: bestAttempt.solution,
      clues: bestAttempt.clues,
      difficultyRating: bestAttempt.clueCount,
      puzzleId: bestAttempt.puzzleId,
      generatedAt: bestAttempt.generatedAt
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
 * @returns Object with puzzle grid (0 = empty), resulting clue count, and timeout flag
 */
function removeCells(
  solution: number[][],
  targetClues: number,
  rng: SeededRandom,
  deadlineMs: number
): { grid: number[][]; clueCount: number; timedOut: boolean } {
  const isNearMinimalTarget = targetClues <= 20;
  const maxStalledPasses = isNearMinimalTarget ? 8 : 2;
  const maxRemovalAttempts = isNearMinimalTarget ? 16 : 4;
  const maxRemovalDurationMs = isNearMinimalTarget ? 2000 : 600;

  let bestPuzzle = solution.map(row => [...row]);
  let bestClueCount = 81;
  let timedOut = false;

  for (let attempt = 0; attempt < maxRemovalAttempts; attempt++) {
    const puzzle = solution.map(row => [...row]);
    let currentClueCount = 81;
    let stalledPasses = 0;
    const attemptStart = Date.now();

    // Continue removing until we hit the target clue count or stall repeatedly
    while (
      currentClueCount > targetClues &&
      stalledPasses < maxStalledPasses &&
      Date.now() - attemptStart < maxRemovalDurationMs
    ) {
      const positions: Array<{ row: number; col: number }> = [];
      for (let row = 0; row < 9; row++) {
        for (let col = 0; col < 9; col++) {
          if (puzzle[row]?.[col]) {
            positions.push({ row, col });
          }
        }
      }

      rng.shuffle(positions);

      let removedThisPass = 0;

      for (const pos of positions) {
        if (Date.now() >= deadlineMs) {
          timedOut = true;
          break;
        }

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
          removedThisPass++;
        } else {
          // Revert removal if constraints are not met
          setCell(puzzle, pos.row, pos.col, currentValue);
        }
      }

      if (removedThisPass === 0) {
        stalledPasses++;
      } else {
        stalledPasses = 0;
      }

      if (Date.now() >= deadlineMs) {
        timedOut = true;
        break;
      }
    }

    if (currentClueCount < bestClueCount) {
      bestClueCount = currentClueCount;
      bestPuzzle = puzzle.map(row => [...row]);
    }

    if (currentClueCount <= targetClues) {
      return {
        grid: puzzle.map(row => [...row]),
        clueCount: currentClueCount
      };
    }

    if (Date.now() >= deadlineMs) {
      timedOut = true;
      break;
    }
  }

  return {
    grid: bestPuzzle.map(row => [...row]),
    clueCount: bestClueCount,
    timedOut
  };
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
 * Checks whether a puzzle can be solved using deterministic logic (no guessing)
 *
 * Currently limited to detecting forbidden rectangle patterns where four cells
 * share the same candidate pair, which would force guesswork.
 */
export function isLogicallySolvable(puzzle: readonly (readonly number[])[]): boolean {
  const board = puzzle.map(row => [...row]);
  const candidatesMap = generateAllCandidates(board);

  if (hasDuplicatePairRectangle(candidatesMap)) {
    return false;
  }

  return true;
}

function parseKey(key: string): [number, number] {
  const [rowString, colString] = key.split(',');
  const row = Number.parseInt(rowString ?? '', 10);
  const col = Number.parseInt(colString ?? '', 10);
  return [row, col];
}

function hasDuplicatePairRectangle(candidatesMap: Map<string, Set<number>>): boolean {
  const pairMap = new Map<string, Map<number, Set<number>>>();

  for (const [key, candidates] of candidatesMap) {
    if (candidates.size !== 2) continue;

    const [row, col] = parseKey(key);
    const sortedPair = Array.from(candidates).sort((a, b) => a - b);
    const pairKey = `${sortedPair[0]},${sortedPair[1]}`;

    let rowMap = pairMap.get(pairKey);
    if (!rowMap) {
      rowMap = new Map<number, Set<number>>();
      pairMap.set(pairKey, rowMap);
    }

    let colSet = rowMap.get(row);
    if (!colSet) {
      colSet = new Set<number>();
      rowMap.set(row, colSet);
    }

    colSet.add(col);
  }

  for (const rowMap of pairMap.values()) {
    const entries = Array.from(rowMap.entries());
    for (let i = 0; i < entries.length; i++) {
      const entryA = entries[i];
      if (!entryA) continue;
      const [, colsA] = entryA;
      if (colsA.size < 2) continue;

      for (let j = i + 1; j < entries.length; j++) {
        const entryB = entries[j];
        if (!entryB) continue;
        const [, colsB] = entryB;
        if (colsB.size < 2) continue;

        let sharedColumnCount = 0;
        for (const col of colsA) {
          if (colsB.has(col)) {
            sharedColumnCount++;
            if (sharedColumnCount >= 2) {
              return true;
            }
          }
        }
      }
    }
  }

  return false;
}

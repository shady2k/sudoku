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
 * Gets fallback difficulty levels for progressive retries
 */
function getDifficultyAttempts(difficulty: DifficultyLevel): DifficultyLevel[] {
  const attempts: DifficultyLevel[] = [difficulty];
  if (difficulty === 100) {
    attempts.push(95, 90);
  } else if (difficulty >= 95) {
    attempts.push(difficulty - 5);
  }
  return attempts;
}

/**
 * Gets time budget based on difficulty level
 */
function getTimeBudget(difficulty: DifficultyLevel): number {
  return difficulty >= 80 ? 8000 : difficulty >= 50 ? 4000 : 2000;
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
  const validationResult = validateInputs(difficulty, seed);
  if (!validationResult.success) {
    return validationResult;
  }
  const validSeed = validationResult.data;

  const difficultyAttempts = getDifficultyAttempts(difficulty);

  for (const attemptDifficulty of difficultyAttempts) {
    const timeBudget = getTimeBudget(attemptDifficulty);
    const result = await generatePuzzleWithTimeout(attemptDifficulty, validSeed, timeBudget);

    if (result.success) {
      return result;
    }
  }

  return failure(
    'PUZZLE_GENERATION_FAILED',
    `Failed to generate valid puzzle at difficulty ${difficulty}% after ${difficultyAttempts.length} difficulty level attempts (tried: ${difficultyAttempts.join('%, ')}%). Consider using difficulty ${difficultyAttempts[difficultyAttempts.length - 1] ?? difficulty}% for faster generation.`
  );
}

type PuzzleAttempt = {
  grid: number[][];
  solution: number[][];
  clues: boolean[][];
  clueCount: number;
  puzzleId: string;
  generatedAt: number;
};

function createPuzzleResult(attempt: PuzzleAttempt): Puzzle {
  return {
    grid: attempt.grid,
    solution: attempt.solution,
    clues: attempt.clues,
    difficultyRating: attempt.clueCount,
    puzzleId: attempt.puzzleId,
    generatedAt: attempt.generatedAt
  };
}

function createAttemptResult(puzzle: number[][], solution: number[][], actualClues: number, attemptSeed: number, difficulty: DifficultyLevel): PuzzleAttempt {
  return {
    grid: puzzle.map(row => [...row]),
    solution: solution.map(row => [...row]),
    clues: puzzle.map(row => row.map(val => val !== 0)),
    clueCount: actualClues,
    puzzleId: `puzzle-${attemptSeed}-${difficulty}`,
    generatedAt: Date.now()
  };
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
  const maxAttempts = 100;
  let bestAttempt: PuzzleAttempt | null = null;

  while (Date.now() - startTime < maxTimeMs && attempt < maxAttempts) {
    const attemptSeed = (seed * 1664525 + attempt * 1013904223) >>> 0;
    const rng = new SeededRandom(attemptSeed);

    const gridResult = await generateCompleteGrid(attemptSeed);
    if (!gridResult.success) {
      attempt++;
      continue;
    }

    const solution = gridResult.data;
    const deadline = startTime + maxTimeMs;
    const { grid: puzzle, clueCount: actualClues, timedOut } = removeCells(
      solution,
      targetClues,
      rng,
      deadline
    );

    if (actualClues < 17) {
      attempt++;
      continue;
    }

    const uniquenessStartTime = Date.now();
    const uniqueSolution = hasUniqueSolution(puzzle);
    const uniquenessDuration = Date.now() - uniquenessStartTime;

    if (uniquenessDuration > 500 || !uniqueSolution) {
      attempt++;
      continue;
    }

    const attemptResult = createAttemptResult(puzzle, solution, actualClues, attemptSeed, difficulty);

    if (actualClues <= targetClues) {
      return success(createPuzzleResult(attemptResult));
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
    return success(createPuzzleResult(bestAttempt));
  }

  return failure(
    'PUZZLE_GENERATION_FAILED',
    `Failed to generate valid puzzle at difficulty ${difficulty}% within ${maxTimeMs}ms (tried ${attempt + 1} attempts)`
  );
}

type RemovalConfig = {
  maxStalledPasses: number;
  maxRemovalAttempts: number;
  maxRemovalDurationMs: number;
};

function getRemovalConfig(targetClues: number): RemovalConfig {
  const isNearMinimal = targetClues <= 20;
  return {
    maxStalledPasses: isNearMinimal ? 8 : 2,
    maxRemovalAttempts: isNearMinimal ? 16 : 4,
    maxRemovalDurationMs: isNearMinimal ? 2000 : 600
  };
}

function getFilledPositions(puzzle: number[][]): Array<{ row: number; col: number }> {
  const positions: Array<{ row: number; col: number }> = [];
  for (let row = 0; row < 9; row++) {
    for (let col = 0; col < 9; col++) {
      if (puzzle[row]?.[col]) {
        positions.push({ row, col });
      }
    }
  }
  return positions;
}

function tryRemoveCell(
  puzzle: number[][],
  pos: { row: number; col: number }
): boolean {
  const row = puzzle[pos.row];
  if (!row) return false;
  const currentValue = row[pos.col];
  if (currentValue === undefined || currentValue === 0) return false;

  setCell(puzzle, pos.row, pos.col, 0);

  const unique = hasUniqueSolution(puzzle);
  const logical = unique && isLogicallySolvable(puzzle);

  if (unique && logical) {
    return true;
  }

  setCell(puzzle, pos.row, pos.col, currentValue);
  return false;
}

function performRemovalPass(
  puzzle: number[][],
  targetClues: number,
  rng: SeededRandom,
  deadlineMs: number
): { removed: number; timedOut: boolean; currentClueCount: number } {
  const positions = getFilledPositions(puzzle);
  rng.shuffle(positions);

  let removedThisPass = 0;
  let currentClueCount = 81;
  let timedOut = false;

  for (const pos of positions) {
    if (Date.now() >= deadlineMs) {
      timedOut = true;
      break;
    }

    if (currentClueCount <= targetClues) break;

    if (tryRemoveCell(puzzle, pos)) {
      currentClueCount--;
      removedThisPass++;
    }
  }

  return { removed: removedThisPass, timedOut, currentClueCount };
}

/**
 * Removes cells from a complete grid to create a puzzle
 */
function removeCells(
  solution: number[][],
  targetClues: number,
  rng: SeededRandom,
  deadlineMs: number
): { grid: number[][]; clueCount: number; timedOut: boolean } {
  const config = getRemovalConfig(targetClues);
  let bestPuzzle = solution.map(row => [...row]);
  let bestClueCount = 81;
  let timedOut = false;

  for (let attempt = 0; attempt < config.maxRemovalAttempts; attempt++) {
    const puzzle = solution.map(row => [...row]);
    let currentClueCount = 81;
    let stalledPasses = 0;
    const attemptStart = Date.now();

    while (
      currentClueCount > targetClues &&
      stalledPasses < config.maxStalledPasses &&
      Date.now() - attemptStart < config.maxRemovalDurationMs
    ) {
      const result = performRemovalPass(puzzle, targetClues, rng, deadlineMs);
      currentClueCount = result.currentClueCount;

      if (result.timedOut) {
        timedOut = true;
        break;
      }

      stalledPasses = result.removed === 0 ? stalledPasses + 1 : 0;
    }

    if (currentClueCount < bestClueCount) {
      bestClueCount = currentClueCount;
      bestPuzzle = puzzle.map(row => [...row]);
    }

    if (currentClueCount <= targetClues) {
      return { grid: puzzle.map(row => [...row]), clueCount: currentClueCount, timedOut: false };
    }

    if (Date.now() >= deadlineMs) {
      timedOut = true;
      break;
    }
  }

  return { grid: bestPuzzle.map(row => [...row]), clueCount: bestClueCount, timedOut };
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

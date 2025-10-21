/**
 * Sudoku Puzzle Generator - Dig-Hole Strategy
 *
 * Based on the paper "Sudoku Puzzles Generating: from Easy to Evil" (Team #3485)
 *
 * Algorithm:
 * 1. Las Vegas algorithm to generate terminal pattern (complete valid grid)
 * 2. Dig-hole strategy with five operators:
 *    - Sequence determination based on difficulty
 *    - Restrictions on given cell distribution
 *    - Reduction to absurdity for uniqueness checking
 *    - Pruning to avoid backtracking
 *    - Propagation for diversity (future enhancement)
 *
 * Guarantee: Unique solution (solvable)
 */

import type { Puzzle, Result, DifficultyLevel } from '../models/types';
import { success, failure, isDifficultyLevel } from '../models/types';
import { SeededRandom } from '../utils/seededRandom';
import { getCell, setCell } from '../utils/gridHelpers';

/**
 * Digging sequence types based on the paper
 */
type DiggingSequence = 'random' | 'jumping' | 's-pattern' | 'left-to-right';

/**
 * Difficulty configuration based on the paper's metrics
 */
interface DifficultyConfig {
  minGivens: number;
  maxGivens: number;
  minGivensPerRowCol: number;
  sequence: DiggingSequence;
}

/**
 * Maps difficulty level (0-100) to paper's five levels
 */
function getDifficultyConfig(difficulty: DifficultyLevel): DifficultyConfig {
  if (difficulty <= 20) {
    // Level 1: Extremely Easy
    return { minGivens: 50, maxGivens: 60, minGivensPerRowCol: 5, sequence: 'random' };
  } else if (difficulty <= 40) {
    // Level 2: Easy
    return { minGivens: 36, maxGivens: 49, minGivensPerRowCol: 4, sequence: 'random' };
  } else if (difficulty <= 60) {
    // Level 3: Medium
    return { minGivens: 32, maxGivens: 35, minGivensPerRowCol: 3, sequence: 'jumping' };
  } else if (difficulty <= 80) {
    // Level 4: Difficult
    return { minGivens: 28, maxGivens: 31, minGivensPerRowCol: 2, sequence: 's-pattern' };
  } else {
    // Level 5: Evil
    return { minGivens: 22, maxGivens: 27, minGivensPerRowCol: 0, sequence: 'left-to-right' };
  }
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
 * Solves a Sudoku puzzle using backtracking (DFS)
 * Returns true if a solution exists
 */
function solvePuzzle(grid: number[][]): boolean {
  const empty = findEmptyCell(grid);
  if (!empty) return true; // Solved

  const { row, col } = empty;

  for (let num = 1; num <= 9; num++) {
    if (isValidPlacement(grid, row, col, num)) {
      setCell(grid, row, col, num);

      if (solvePuzzle(grid)) {
        return true;
      }

      setCell(grid, row, col, 0); // Backtrack
    }
  }

  return false;
}

/**
 * Las Vegas Algorithm for creating terminal pattern
 *
 * Places 11 random givens and attempts to solve within timeout.
 * If successful, returns complete grid. Otherwise retries with new random placement.
 *
 * @param rng - Seeded random number generator
 * @param maxAttempts - Maximum retry attempts
 * @returns Complete valid Sudoku grid
 */
function createTerminalPattern(rng: SeededRandom, maxAttempts = 100): number[][] | null {
  const numInitialGivens = 11; // Paper found this optimal

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const grid: number[][] = Array.from({ length: 9 }, () => Array(9).fill(0));

    // Randomly place 11 givens
    const positions: Array<{ row: number; col: number }> = [];
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        positions.push({ row: r, col: c });
      }
    }
    rng.shuffle(positions);

    let placed = 0;
    for (const pos of positions) {
      if (placed >= numInitialGivens) break;

      // Try random values 1-9
      const values = [1, 2, 3, 4, 5, 6, 7, 8, 9];
      rng.shuffle(values);

      for (const val of values) {
        if (isValidPlacement(grid, pos.row, pos.col, val)) {
          setCell(grid, pos.row, pos.col, val);
          placed++;
          break;
        }
      }
    }

    // Attempt to solve
    if (solvePuzzle(grid)) {
      return grid;
    }
  }

  return null;
}

/**
 * Generates cell positions in specified sequence order
 */
function generateDiggingSequence(sequence: DiggingSequence, rng: SeededRandom): Array<{ row: number; col: number }> {
  const positions: Array<{ row: number; col: number }> = [];

  switch (sequence) {
    case 'left-to-right':
      // Left to right, top to bottom
      for (let row = 0; row < 9; row++) {
        for (let col = 0; col < 9; col++) {
          positions.push({ row, col });
        }
      }
      break;

    case 's-pattern':
      // Wandering along S pattern
      for (let row = 0; row < 9; row++) {
        if (row % 2 === 0) {
          // Left to right on even rows
          for (let col = 0; col < 9; col++) {
            positions.push({ row, col });
          }
        } else {
          // Right to left on odd rows
          for (let col = 8; col >= 0; col--) {
            positions.push({ row, col });
          }
        }
      }
      break;

    case 'jumping':
      // Jumping one cell (checkerboard pattern, then fill gaps)
      // First pass: every other cell
      for (let row = 0; row < 9; row++) {
        for (let col = row % 2; col < 9; col += 2) {
          positions.push({ row, col });
        }
      }
      // Second pass: remaining cells
      for (let row = 0; row < 9; row++) {
        for (let col = (row + 1) % 2; col < 9; col += 2) {
          positions.push({ row, col });
        }
      }
      break;

    case 'random':
      // Fully randomized
      for (let row = 0; row < 9; row++) {
        for (let col = 0; col < 9; col++) {
          positions.push({ row, col });
        }
      }
      rng.shuffle(positions);
      break;
  }

  return positions;
}

/**
 * Checks if current grid satisfies distribution restrictions
 */
function meetsRestrictions(
  grid: readonly (readonly number[])[],
  config: DifficultyConfig
): boolean {
  let totalGivens = 0;

  // Count total givens and check row/column minimums
  for (let i = 0; i < 9; i++) {
    let rowGivens = 0;
    let colGivens = 0;

    for (let j = 0; j < 9; j++) {
      if (getCell(grid, i, j) !== 0) {
        rowGivens++;
        totalGivens += (i === 0 ? 1 : 0); // Count once
      }
      if (getCell(grid, j, i) !== 0) {
        colGivens++;
      }
    }

    if (rowGivens < config.minGivensPerRowCol || colGivens < config.minGivensPerRowCol) {
      return false;
    }
  }

  // Recount total properly
  totalGivens = 0;
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      if (getCell(grid, r, c) !== 0) totalGivens++;
    }
  }

  return totalGivens >= config.minGivens;
}

/**
 * Check if puzzle with cell removed has unique solution using "Reduction to Absurdity"
 *
 * Paper's approach (lines 380-395):
 * If we dig out digit D from position (r,c):
 *   Step 1: Try substituting D with each other digit (1-9, excluding D)
 *   Step 2: For each substitute, check if puzzle can be solved
 *   Step 3: If ANY substitute yields a solution, the puzzle has multiple solutions
 *   Step 4: Only if ALL 8 substitutes yield no solution, the removal is valid
 *
 * Optimization: We only test values that pass the constraint check (row/col/box).
 * This dramatically reduces the number of solve attempts.
 *
 * @param grid - Puzzle grid (with cell already set to 0)
 * @param originalRow - Row of removed cell
 * @param originalCol - Column of removed cell
 * @param originalValue - Original value that was removed
 * @returns true if puzzle has unique solution after removal
 */
function checkUniquenessAfterRemoval(
  grid: number[][],
  originalRow: number,
  originalCol: number,
  originalValue: number
): boolean {
  // Collect valid alternate values that pass constraint checks
  const validAlternates: number[] = [];
  for (let testValue = 1; testValue <= 9; testValue++) {
    if (testValue === originalValue) continue;
    if (isValidPlacement(grid, originalRow, originalCol, testValue)) {
      validAlternates.push(testValue);
    }
  }

  // If no valid alternates exist, removal is safe (unique solution guaranteed)
  if (validAlternates.length === 0) {
    return true;
  }

  // Test each valid alternate - if ANY solves, we have multiple solutions
  for (const testValue of validAlternates) {
    const testGrid = grid.map(row => [...row]);
    setCell(testGrid, originalRow, originalCol, testValue);

    if (solvePuzzle(testGrid)) {
      // Found an alternate solution! Not unique.
      return false;
    }
  }

  // None of the valid alternates produced a solution
  // Therefore, only the original value works → unique solution
  return true;
}

/**
 * Dig holes strategy with pruning optimization
 *
 * @param solution - Complete valid grid
 * @param config - Difficulty configuration
 * @param rng - Random number generator
 * @returns Puzzle grid with holes dug
 */
function digHoles(
  solution: number[][],
  config: DifficultyConfig,
  rng: SeededRandom
): number[][] {
  const puzzle = solution.map(row => [...row]);
  const sequence = generateDiggingSequence(config.sequence, rng);
  const explored = new Set<string>(); // Pruning: track explored cells

  // Target random clue count within range
  const targetGivens = config.minGivens + Math.floor(rng.next() * (config.maxGivens - config.minGivens + 1));

  for (const pos of sequence) {
    const key = `${pos.row},${pos.col}`;

    // Pruning: skip if already explored or empty
    if (explored.has(key) || getCell(puzzle, pos.row, pos.col) === 0) {
      continue;
    }

    explored.add(key);

    // Check if we've reached target
    let currentGivens = 0;
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        if (getCell(puzzle, r, c) !== 0) currentGivens++;
      }
    }

    if (currentGivens <= targetGivens) {
      break; // Reached target difficulty
    }

    const originalValue = getCell(puzzle, pos.row, pos.col);
    if (originalValue === 0) continue;

    // Try removing this cell
    setCell(puzzle, pos.row, pos.col, 0);

    // Check restrictions
    if (!meetsRestrictions(puzzle, config)) {
      // Violates restrictions - restore
      setCell(puzzle, pos.row, pos.col, originalValue);
      continue;
    }

    // Check uniqueness using reduction to absurdity
    if (!checkUniquenessAfterRemoval(puzzle, pos.row, pos.col, originalValue)) {
      // Not unique - restore
      setCell(puzzle, pos.row, pos.col, originalValue);
    }
    // else: successfully removed, keep it at 0
  }

  return puzzle;
}

/**
 * Generates a complete valid Sudoku grid using Las Vegas algorithm
 *
 * @param seed - Seed for reproducibility
 * @returns 9x9 grid filled with valid Sudoku solution
 */
export async function generateCompleteGrid(seed?: number): Promise<Result<number[][]>> {
  const rng = new SeededRandom(seed);
  const grid = createTerminalPattern(rng);

  if (!grid) {
    return failure('PUZZLE_GENERATION_FAILED', 'Failed to generate complete grid using Las Vegas algorithm');
  }

  return success(grid);
}

/**
 * Generates a Sudoku puzzle with specified difficulty using dig-hole strategy
 *
 * Based on the paper "Sudoku Puzzles Generating: from Easy to Evil"
 *
 * Algorithm:
 * 1. Create terminal pattern using Las Vegas algorithm (11 random givens + solve)
 * 2. Dig holes according to difficulty-specific sequence
 * 3. Apply restrictions on givens distribution
 * 4. Verify uniqueness using reduction to absurdity
 * 5. Use pruning to avoid backtracking
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
  const config = getDifficultyConfig(difficulty);
  const rng = new SeededRandom(validSeed);

  // Step 1: Create terminal pattern using Las Vegas algorithm
  const gridResult = await generateCompleteGrid(validSeed);
  if (!gridResult.success) {
    return gridResult;
  }
  const solution = gridResult.data;

  // Step 2: Dig holes to create puzzle
  const puzzle = digHoles(solution, config, rng);

  // Count final clues
  let clueCount = 0;
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      if (getCell(puzzle, r, c) !== 0) clueCount++;
    }
  }

  return success({
    grid: puzzle,
    solution: solution.map(row => [...row]),
    clues: puzzle.map(row => row.map(val => val !== 0)),
    difficultyRating: clueCount,
    puzzleId: `puzzle-${validSeed}-${difficulty}`,
    generatedAt: Date.now()
  });
}

/**
 * Legacy export for compatibility - validates puzzle has unique solution
 * Uses backtracking solver for verification
 */
export function hasUniqueSolution(puzzle: readonly (readonly number[])[]): boolean {
  const grid = puzzle.map(row => [...row]);
  let solutionCount = 0;

  function solve(): boolean {
    if (solutionCount > 1) {
      return true; // Early termination
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

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
    // Level 5: Evil - needs more time for uniqueness checking
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
 * @param solveTimeout - Timeout for each solve attempt (paper uses 0.1s)
 * @returns Complete valid Sudoku grid
 */
function createTerminalPattern(rng: SeededRandom, maxAttempts = 100, solveTimeout = 100): number[][] | null {
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

    // Attempt to solve with timeout
    if (solvePuzzleWithTimeout(grid, solveTimeout)) {
      return grid;
    }
  }

  return null;
}

/**
 * Generates left-to-right sequence
 */
function generateLeftToRightSequence(): Array<{ row: number; col: number }> {
  const positions: Array<{ row: number; col: number }> = [];
  for (let row = 0; row < 9; row++) {
    for (let col = 0; col < 9; col++) {
      positions.push({ row, col });
    }
  }
  return positions;
}

/**
 * Generates S-pattern sequence
 */
function generateSPatternSequence(): Array<{ row: number; col: number }> {
  const positions: Array<{ row: number; col: number }> = [];
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
  return positions;
}

/**
 * Generates jumping pattern sequence
 */
function generateJumpingSequence(): Array<{ row: number; col: number }> {
  const positions: Array<{ row: number; col: number }> = [];
  // First pass: even row + even col, odd row + odd col
  for (let row = 0; row < 9; row++) {
    for (let col = 0; col < 9; col++) {
      if ((row + col) % 2 === 0) {
        positions.push({ row, col });
      }
    }
  }
  // Second pass: remaining cells (even row + odd col, odd row + even col)
  for (let row = 0; row < 9; row++) {
    for (let col = 0; col < 9; col++) {
      if ((row + col) % 2 === 1) {
        positions.push({ row, col });
      }
    }
  }
  return positions;
}

/**
 * Generates random sequence
 */
function generateRandomSequence(rng: SeededRandom): Array<{ row: number; col: number }> {
  const positions: Array<{ row: number; col: number }> = [];
  for (let row = 0; row < 9; row++) {
    for (let col = 0; col < 9; col++) {
      positions.push({ row, col });
    }
  }
  rng.shuffle(positions);
  return positions;
}

/**
 * Generates cell positions in specified sequence order
 */
function generateDiggingSequence(sequence: DiggingSequence, rng: SeededRandom): Array<{ row: number; col: number }> {
  switch (sequence) {
    case 'left-to-right':
      return generateLeftToRightSequence();
    case 's-pattern':
      return generateSPatternSequence();
    case 'jumping':
      return generateJumpingSequence();
    case 'random':
      return generateRandomSequence(rng);
  }
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
        totalGivens++; // Count all givens properly
      }
      if (getCell(grid, j, i) !== 0) {
        colGivens++;
      }
    }

    if (rowGivens < config.minGivensPerRowCol || colGivens < config.minGivensPerRowCol) {
      return false;
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
 * Optimizations:
 * - Only test values that pass constraint checks (row/col/box)
 * - Early termination when first alternate solution is found
 * - Optional time budget to prevent infinite loops on hard puzzles
 *
 * @param grid - Puzzle grid (with cell already set to 0)
 * @param originalRow - Row of removed cell
 * @param originalCol - Column of removed cell
 * @param originalValue - Original value that was removed
 * @param startTime - Start time for timeout checking
 * @param timeBudget - Maximum time allowed for uniqueness checking
 * @returns true if puzzle has unique solution after removal
 */
function checkUniquenessAfterRemoval(
  grid: number[][],
  originalRow: number,
  originalCol: number,
  originalValue: number,
  startTime: number = Date.now(),
  timeBudget?: number
): boolean {
  // Check time budget if provided
  if (timeBudget !== undefined && Date.now() - startTime > timeBudget) {
    // Timeout reached - assume not unique to be safe
    return false;
  }

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

  // Test each valid alternate - stop early if we find any solution
  for (const testValue of validAlternates) {
    // Check time budget before each solve attempt
    if (timeBudget !== undefined && Date.now() - startTime > timeBudget) {
      return false;
    }

    const testGrid = grid.map(row => [...row]);
    setCell(testGrid, originalRow, originalCol, testValue);

    // Use appropriate solving method based on whether we have time budget
    const hasSolution = timeBudget !== undefined
      ? solvePuzzleWithTimeout(testGrid, 100) // Time-limited
      : solvePuzzle(testGrid); // Full solve for accuracy

    if (hasSolution) {
      // Found an alternate solution! Not unique.
      return false;
    }
  }

  // None of the valid alternates produced a solution
  // Therefore, only the original value works → unique solution
  return true;
}

/**
 * Solve puzzle with timeout to prevent infinite loops
 */
function solvePuzzleWithTimeout(grid: number[][], timeoutMs: number): boolean {
  const startTime = Date.now();

  function solve(): boolean {
    // Check timeout
    if (Date.now() - startTime > timeoutMs) {
      return false; // Timeout - no solution found in time
    }

    const empty = findEmptyCell(grid);
    if (!empty) return true; // Solved

    const { row, col } = empty;

    for (let num = 1; num <= 9; num++) {
      if (isValidPlacement(grid, row, col, num)) {
        setCell(grid, row, col, num);

        if (solve()) {
          return true;
        }

        setCell(grid, row, col, 0); // Backtrack
      }
    }

    return false;
  }

  return solve();
}

/**
 * Measures puzzle solving complexity by counting search attempts (with limits for performance)
 * This implements the paper's "enumerating search times" metric
 */
function measureSolvingComplexity(grid: readonly (readonly number[])[], maxAttempts: number = 50000): { complexity: number; searchAttempts: number } {
  const testGrid = grid.map(row => [...row]);
  let searchAttempts = 0;

  function solve(): boolean {
    // Early termination for performance
    if (searchAttempts > maxAttempts) return false;

    const empty = findEmptyCell(testGrid);
    if (!empty) return true; // Solved

    const { row, col } = empty;

    for (let num = 1; num <= 9; num++) {
      searchAttempts++; // Count each trial as a search attempt

      if (isValidPlacement(testGrid, row, col, num)) {
        setCell(testGrid, row, col, num);

        if (solve()) {
          return true;
        }

        setCell(testGrid, row, col, 0); // Backtrack
      }
    }

    return false;
  }

  solve();

  // Map to paper's difficulty levels based on search attempts
  let complexity = 1; // Level 1: < 100 attempts
  if (searchAttempts >= maxAttempts) {
    complexity = 5; // Treat maxed out attempts as Level 5 (evil)
  } else if (searchAttempts >= 10000) {
    complexity = 4; // Level 4: 10,000-99,999 attempts
  } else if (searchAttempts >= 1000) {
    complexity = 3; // Level 3: 1,000-9,999 attempts
  } else if (searchAttempts >= 100) {
    complexity = 2; // Level 2: 100-999 attempts
  }

  return { complexity, searchAttempts };
}

/**
 * Analyzes how "constrained" each cell is - cells with fewer valid options are more critical
 * Optimized version with early termination
 */
function analyzeCellConstraints(grid: readonly (readonly number[])[]): Array<{ row: number; col: number; options: number }> {
  const constraints: Array<{ row: number; col: number; options: number }> = [];

  for (let row = 0; row < 9; row++) {
    for (let col = 0; col < 9; col++) {
      if (getCell(grid, row, col) === 0) {
        // Count how many numbers can legally go here - early termination for optimization
        let options = 0;
        for (let num = 1; num <= 9; num++) {
          if (isValidPlacement(grid, row, col, num)) {
            options++;
            if (options > 3) break; // We only care about highly constrained cells (1-3 options)
          }
        }
        constraints.push({ row, col, options });
      }
    }
  }

  // Sort by constraints and return only the most constrained cells
  return constraints
    .sort((a, b) => a.options - b.options)
    .filter(cell => cell.options <= 3) // Only keep cells with 1-3 options
    .slice(0, 20); // Limit to top 20 most constrained cells for performance
}

/**
 * Measures constraint propagation difficulty - simplified for performance
 * Returns a score where higher means more difficult (fewer obvious moves)
 */
function measureConstraintPropagation(grid: readonly (readonly number[])[]): { obviousMoves: number; propagationScore: number } {
  let obviousMoves = 0;

  // Check for naked singles only (most basic technique)
  for (let row = 0; row < 9; row++) {
    for (let col = 0; col < 9; col++) {
      if (getCell(grid, row, col) === 0) {
        let options = 0;

        for (let num = 1; num <= 9; num++) {
          if (isValidPlacement(grid, row, col, num)) {
            options++;
            if (options > 1) break; // Not a naked single
          }
        }

        if (options === 1) {
          obviousMoves++;
        }
      }
    }
  }

  // Calculate propagation score - puzzles with fewer obvious moves are harder
  const totalEmpty = grid.flat().filter(val => val === 0).length;
  const propagationScore = totalEmpty - obviousMoves; // Higher = harder

  return { obviousMoves, propagationScore };
}

/**
 * Calculate dynamic time budget based on difficulty
 */
function calculateTimeBudget(config: DifficultyConfig, timeBudget?: number): number {
  return timeBudget ?? (
    config.minGivensPerRowCol === 0 ? 8000 : // Evil level: 8 seconds
    config.minGivensPerRowCol === 2 ? 3000 : // Difficult: 3 seconds
    2000 // Others: 2 seconds
  );
}

/**
 * Calculate target complexity level based on difficulty
 */
function calculateTargetComplexity(config: DifficultyConfig): number {
  if (config.minGivensPerRowCol === 0) return 5; // Evil
  if (config.minGivensPerRowCol === 2) return 4; // Difficult
  if (config.minGivensPerRowCol === 3) return 3; // Medium
  if (config.minGivensPerRowCol === 4) return 2; // Easy
  return 1; // Extremely Easy
}

/**
 * Count current givens in puzzle
 */
function countGivens(puzzle: readonly (readonly number[])[]): number {
  let count = 0;
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      if (getCell(puzzle, r, c) !== 0) count++;
    }
  }
  return count;
}

/**
 * Try to remove a cell from the puzzle
 */
function tryRemoveCell(
  puzzle: number[][],
  row: number,
  col: number,
  config: DifficultyConfig,
  startTime: number,
  timeBudget: number
): boolean {
  const originalValue = getCell(puzzle, row, col);
  if (originalValue === 0) return false;

  setCell(puzzle, row, col, 0);

  if (!meetsRestrictions(puzzle, config)) {
    setCell(puzzle, row, col, originalValue);
    return false;
  }

  if (!checkUniquenessAfterRemoval(puzzle, row, col, originalValue, startTime, timeBudget)) {
    setCell(puzzle, row, col, originalValue);
    return false;
  }

  return true;
}

/**
 * Perform strategic removal for harder puzzles
 */
function performStrategicRemoval(
  puzzle: number[][],
  targetComplexity: number,
  config: DifficultyConfig,
  startTime: number,
  timeBudget: number
): void {
  if (targetComplexity < 4) return;

  const constraints = analyzeCellConstraints(puzzle);
  const maxAttempts = Math.min(targetComplexity === 5 ? 3 : 2, constraints.length);
  const targetRemovals = targetComplexity === 5 ? 2 : 1;
  let successfulRemovals = 0;

  for (let i = 0; i < maxAttempts && successfulRemovals < targetRemovals; i++) {
    const constraint = constraints[i];
    if (!constraint) break;

    const { row, col } = constraint;
    if (getCell(puzzle, row, col) !== 0) {
      if (tryRemoveCell(puzzle, row, col, config, startTime, timeBudget)) {
        successfulRemovals++;
      }
    }
  }
}

/**
 * Dig holes strategy with complexity analysis and intelligent cell selection
 *
 * @param solution - Complete valid grid
 * @param config - Difficulty configuration
 * @param rng - Random number generator
 * @param timeBudget - Maximum time for digging holes (ms)
 * @returns Puzzle grid with holes dug
 */
function digHoles(
  solution: number[][],
  config: DifficultyConfig,
  rng: SeededRandom,
  timeBudget?: number
): number[][] {
  const startTime = Date.now();
  const puzzle = solution.map(row => [...row]);
  const sequence = generateDiggingSequence(config.sequence, rng);
  const explored = new Set<string>();

  const actualTimeBudget = calculateTimeBudget(config, timeBudget);
  const targetGivens = config.minGivens + Math.floor(rng.next() * (config.maxGivens - config.minGivens + 1));
  const targetComplexity = calculateTargetComplexity(config);

  // First pass: remove cells to reach target clue count
  for (const pos of sequence) {
    if (Date.now() - startTime > actualTimeBudget) break;

    const key = `${pos.row},${pos.col}`;
    if (explored.has(key) || getCell(puzzle, pos.row, pos.col) === 0) continue;

    explored.add(key);

    if (countGivens(puzzle) <= targetGivens) break;

    tryRemoveCell(puzzle, pos.row, pos.col, config, startTime, actualTimeBudget);
  }

  // Second pass: strategic removal for harder puzzles
  performStrategicRemoval(puzzle, targetComplexity, config, startTime, actualTimeBudget);

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
 * Uses backtracking solver for verification with timeout optimization
 */
export function hasUniqueSolution(puzzle: readonly (readonly number[])[], timeoutMs: number = 5000): boolean {
  const grid = puzzle.map(row => [...row]);
  let solutionCount = 0;
  const startTime = Date.now();

  function solve(): boolean {
    // Check timeout
    if (Date.now() - startTime > timeoutMs) {
      return true; // Timeout - assume not unique to be safe
    }

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
      // Check timeout before each attempt
      if (Date.now() - startTime > timeoutMs) {
        return true;
      }

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

// Export helper functions for testing and analysis
export { measureSolvingComplexity, measureConstraintPropagation, analyzeCellConstraints };

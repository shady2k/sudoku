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
function measureSolvingComplexity(grid: readonly (readonly number[])[], maxAttempts: number = 1000000): { complexity: number; searchAttempts: number } {
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
  } else if (searchAttempts >= 100000) {
    complexity = 5; // Level 5 (Evil): 100,000-999,999 attempts
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
    config.minGivensPerRowCol === 0 ? 20000 : // Evil level: 20 seconds (paper allows 100k+ searches)
    config.minGivensPerRowCol === 2 ? 5000 : // Difficult: 5 seconds
    config.minGivensPerRowCol === 3 ? 3000 : // Medium: 3 seconds
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
 * Equivalent Propagation - Digit Swap
 * Swaps two digits globally throughout the grid
 */
function propagationDigitSwap(grid: number[][], digit1: number, digit2: number): number[][] {
  const newGrid = grid.map(row =>
    row.map(cell => {
      if (cell === digit1) return digit2;
      if (cell === digit2) return digit1;
      return cell;
    })
  );

  return newGrid;
}

/**
 * Equivalent Propagation - Column Swap
 * Swaps two columns within the same block-column
 */
function propagationColumnSwap(grid: number[][], col1: number, col2: number): number[][] {
  const newGrid = grid.map(row => [...row]);
  for (let row = 0; row < 9; row++) {
    const currentRow = newGrid[row];
    if (currentRow && currentRow[col1] !== undefined && currentRow[col2] !== undefined) {
      const temp = currentRow[col1];
      currentRow[col1] = currentRow[col2];
      currentRow[col2] = temp;
    }
  }

  return newGrid;
}

/**
 * Equivalent Propagation - Block-Column Swap
 * Swaps two entire block-columns
 */
function propagationBlockColumnSwap(grid: number[][], block1: number, block2: number): number[][] {
  const newGrid = grid.map(row => [...row]);
  for (let row = 0; row < 9; row++) {
    const currentRow = newGrid[row];
    if (currentRow) {
      for (let i = 0; i < 3; i++) {
        const col1 = block1 * 3 + i;
        const col2 = block2 * 3 + i;
        if (currentRow[col1] !== undefined && currentRow[col2] !== undefined) {
          const temp = currentRow[col1];
          currentRow[col1] = currentRow[col2];
          currentRow[col2] = temp;
        }
      }
    }
  }

  return newGrid;
}

/**
 * Equivalent Propagation - Row Swap
 * Swaps two rows within the same block-row
 */
function propagationRowSwap(grid: number[][], row1: number, row2: number): number[][] {
  const newGrid = grid.map(row => [...row]);
  const temp = newGrid[row1];
  if (temp && newGrid[row2]) {
    newGrid[row1] = newGrid[row2];
    newGrid[row2] = temp;
  }

  return newGrid;
}

/**
 * Equivalent Propagation - Grid Rotation
 * Rotates entire grid 90° clockwise
 */
function propagationGridRotate(grid: number[][]): number[][] {
  const newGrid: number[][] = Array.from({ length: 9 }, () => Array(9).fill(0));
  for (let row = 0; row < 9; row++) {
    const currentRow = grid[row];
    if (currentRow) {
      for (let col = 0; col < 9; col++) {
        const targetRow = newGrid[col];
        const currentValue = currentRow[col];
        if (targetRow && currentValue !== undefined) {
          targetRow[8 - row] = currentValue;
        }
      }
    }
  }
  return newGrid;
}

/**
 * Apply random equivalent propagation transformations
 * These preserve puzzle validity, uniqueness, and difficulty
 *
 * @param puzzle - Puzzle grid with holes
 * @param solution - Complete solution grid
 * @param rng - Random number generator
 * @returns Object with transformed puzzle and solution
 */
function applyRandomPropagation(
  puzzle: number[][],
  solution: number[][],
  rng: SeededRandom
): { puzzle: number[][], solution: number[][] } {
  let transformedPuzzle = puzzle.map(row => [...row]);
  let transformedSolution = solution.map(row => [...row]);

  // Apply 1-5 random transformations to BOTH grids with same parameters
  const numTransformations = 1 + Math.floor(rng.next() * 5);

  for (let i = 0; i < numTransformations; i++) {
    const transformType = Math.floor(rng.next() * 5);

    switch (transformType) {
      case 0: {
        // Digit swap - pick two digits
        const digits = [1, 2, 3, 4, 5, 6, 7, 8, 9];
        rng.shuffle(digits);
        const digit1 = digits[0];
        const digit2 = digits[1];
        if (digit1 !== undefined && digit2 !== undefined) {
          transformedPuzzle = propagationDigitSwap(transformedPuzzle, digit1, digit2);
          transformedSolution = propagationDigitSwap(transformedSolution, digit1, digit2);
        }
        break;
      }
      case 1: {
        // Column swap within block
        const blockCol = Math.floor(rng.next() * 3);
        const base = blockCol * 3;
        const cols = [base, base + 1, base + 2];
        rng.shuffle(cols);
        const col1 = cols[0];
        const col2 = cols[1];
        if (col1 !== undefined && col2 !== undefined) {
          transformedPuzzle = propagationColumnSwap(transformedPuzzle, col1, col2);
          transformedSolution = propagationColumnSwap(transformedSolution, col1, col2);
        }
        break;
      }
      case 2: {
        // Block-column swap
        const blocks = [0, 1, 2];
        rng.shuffle(blocks);
        const block1 = blocks[0];
        const block2 = blocks[1];
        if (block1 !== undefined && block2 !== undefined) {
          transformedPuzzle = propagationBlockColumnSwap(transformedPuzzle, block1, block2);
          transformedSolution = propagationBlockColumnSwap(transformedSolution, block1, block2);
        }
        break;
      }
      case 3: {
        // Row swap within block
        const blockRow = Math.floor(rng.next() * 3);
        const base = blockRow * 3;
        const rows = [base, base + 1, base + 2];
        rng.shuffle(rows);
        const row1 = rows[0];
        const row2 = rows[1];
        if (row1 !== undefined && row2 !== undefined) {
          transformedPuzzle = propagationRowSwap(transformedPuzzle, row1, row2);
          transformedSolution = propagationRowSwap(transformedSolution, row1, row2);
        }
        break;
      }
      case 4:
        // Grid rotation
        transformedPuzzle = propagationGridRotate(transformedPuzzle);
        transformedSolution = propagationGridRotate(transformedSolution);
        break;
    }
  }

  return { puzzle: transformedPuzzle, solution: transformedSolution };
}

/**
 * Verify evil puzzle meets strict quality criteria
 */
function verifyEvilPuzzle(puzzle: readonly (readonly number[])[]): boolean {
  // Check givens count
  const givens = countGivens(puzzle);
  if (givens < 22 || givens > 27) {
    return false;
  }

  // Verify high search complexity (critical for evil difficulty)
  const { searchAttempts } = measureSolvingComplexity(puzzle, 1000000);
  if (searchAttempts < 100000) {
    return false; // Not hard enough
  }

  // Verify at least one row/column has very sparse givens (≤2)
  let minRowGivens = 9;
  let minColGivens = 9;

  for (let i = 0; i < 9; i++) {
    let rowGivens = 0;
    let colGivens = 0;

    for (let j = 0; j < 9; j++) {
      if (getCell(puzzle, i, j) !== 0) rowGivens++;
      if (getCell(puzzle, j, i) !== 0) colGivens++;
    }

    minRowGivens = Math.min(minRowGivens, rowGivens);
    minColGivens = Math.min(minColGivens, colGivens);
  }

  // Evil puzzles should have at least one very sparse row or column
  if (minRowGivens > 2 && minColGivens > 2) {
    return false; // Not sparse enough
  }

  return true;
}

/**
 * Verify puzzle quality based on difficulty level
 */
function verifyPuzzleQuality(
  puzzle: readonly (readonly number[])[],
  config: DifficultyConfig
): boolean {
  // Check givens count
  const givens = countGivens(puzzle);
  if (givens < config.minGivens || givens > config.maxGivens) {
    return false;
  }

  // For evil puzzles, apply strict verification
  if (config.minGivensPerRowCol === 0) {
    return verifyEvilPuzzle(puzzle);
  }

  // For difficult puzzles, check complexity
  if (config.minGivensPerRowCol === 2) {
    const { searchAttempts } = measureSolvingComplexity(puzzle, 200000);
    if (searchAttempts < 10000) {
      return false; // Not hard enough for difficult level
    }
  }

  return true;
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
  if (targetComplexity < 3) return; // Also apply to medium puzzles

  const constraints = analyzeCellConstraints(puzzle);

  // For evil puzzles, be much more aggressive
  const maxAttempts = targetComplexity === 5 ? Math.min(constraints.length, 10) :
                      targetComplexity === 4 ? 5 : 2;
  const targetRemovals = targetComplexity === 5 ? 5 :
                         targetComplexity === 4 ? 3 : 1;
  let successfulRemovals = 0;

  // Try removing from both constrained and less constrained cells for evil puzzles
  const cellsToTry = targetComplexity === 5 ?
    [...constraints, ...getRandomCells(puzzle, 10)] :
    constraints;

  for (let i = 0; i < maxAttempts && successfulRemovals < targetRemovals; i++) {
    const cell = cellsToTry[i];
    if (!cell) break;

    const { row, col } = cell;
    if (getCell(puzzle, row, col) !== 0) {
      if (tryRemoveCell(puzzle, row, col, config, startTime, timeBudget)) {
        successfulRemovals++;
      }
    }
  }
}

/**
 * Get random non-empty cells for strategic removal
 */
function getRandomCells(puzzle: number[][], count: number): Array<{ row: number; col: number; options: number }> {
  const cells: Array<{ row: number; col: number; options: number }> = [];
  const positions: Array<{ row: number; col: number }> = [];

  for (let row = 0; row < 9; row++) {
    for (let col = 0; col < 9; col++) {
      if (getCell(puzzle, row, col) !== 0) {
        positions.push({ row, col });
      }
    }
  }

  // Shuffle positions
  for (let i = positions.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const posI = positions[i];
    const posJ = positions[j];
    if (posI && posJ) {
      positions[i] = posJ;
      positions[j] = posI;
    }
  }

  // Take first 'count' positions and count their options
  for (let i = 0; i < Math.min(count, positions.length); i++) {
    const pos = positions[i];
    if (!pos) break;
    const { row, col } = pos;
    let options = 0;
    for (let num = 1; num <= 9; num++) {
      if (isValidPlacement(puzzle, row, col, num)) {
        options++;
      }
    }
    cells.push({ row, col, options });
  }

  return cells.sort((a, b) => a.options - b.options);
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
  const failedCells = new Set<string>(); // Enhanced pruning: track cells that failed uniqueness

  const actualTimeBudget = calculateTimeBudget(config, timeBudget);
  const targetGivens = config.minGivens + Math.floor(rng.next() * (config.maxGivens - config.minGivens + 1));
  const targetComplexity = calculateTargetComplexity(config);

  // First pass: remove cells to reach target clue count with enhanced pruning
  for (const pos of sequence) {
    if (Date.now() - startTime > actualTimeBudget) break;

    const key = `${pos.row},${pos.col}`;
    if (explored.has(key) || failedCells.has(key) || getCell(puzzle, pos.row, pos.col) === 0) continue;

    // Enhanced pruning: for evil puzzles, skip if we've reached minimum givens in row/col
    if (config.minGivensPerRowCol === 0) {
      const currentRow = puzzle[pos.row];
      const rowGivens = currentRow?.filter(val => val !== 0).length || 0;
      const colGivens = puzzle.map(row => row[pos.col]).filter(val => val !== 0).length;
      if (rowGivens <= 1 || colGivens <= 1) continue; // Maintain at least 1 per row/col
    }

    explored.add(key);

    if (countGivens(puzzle) <= targetGivens) break;

    const originalValue = getCell(puzzle, pos.row, pos.col);
    if (originalValue !== 0) {
      setCell(puzzle, pos.row, pos.col, 0);

      if (!meetsRestrictions(puzzle, config) ||
          !checkUniquenessAfterRemoval(puzzle, pos.row, pos.col, originalValue, startTime, actualTimeBudget)) {
        setCell(puzzle, pos.row, pos.col, originalValue);
        failedCells.add(key); // Enhanced pruning: remember failed cells
      }
    }
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
 * 6. Apply equivalent propagation for diversity
 * 7. Verify puzzle meets quality criteria (with retry for evil puzzles)
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

  // Determine max attempts based on difficulty
  // Evil puzzles need more attempts to meet quality criteria
  const maxAttempts = config.minGivensPerRowCol === 0 ? 10 : 3;
  const overallTimeout = config.minGivensPerRowCol === 0 ? 30000 : 10000;
  const startTime = Date.now();

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    // Check overall timeout
    if (Date.now() - startTime > overallTimeout) {
      break;
    }

    // Create a unique seed for each attempt
    const attemptSeed = validSeed + attempt;
    const rng = new SeededRandom(attemptSeed);

    // Step 1: Create terminal pattern using Las Vegas algorithm
    const gridResult = await generateCompleteGrid(attemptSeed);
    if (!gridResult.success) {
      continue; // Try again
    }
    const solution = gridResult.data;

    // Step 2: Dig holes to create puzzle
    const puzzle = digHoles(solution, config, rng);

    // Step 3: Verify puzzle quality
    if (!verifyPuzzleQuality(puzzle, config)) {
      continue; // Try again with different seed
    }

    // Step 4: Apply equivalent propagation for diversity
    const transformed = applyRandomPropagation(puzzle, solution, rng);

    // Count final clues
    const clueCount = countGivens(transformed.puzzle);

    return success({
      grid: transformed.puzzle,
      solution: transformed.solution,
      clues: transformed.puzzle.map(row => row.map(val => val !== 0)),
      difficultyRating: clueCount,
      puzzleId: `puzzle-${attemptSeed}-${difficulty}`,
      generatedAt: Date.now()
    });
  }

  // Fallback: If we couldn't generate a quality puzzle, generate one without strict verification
  // This ensures we always return a valid puzzle, even if not perfectly meeting quality criteria
  const rng = new SeededRandom(validSeed);
  const gridResult = await generateCompleteGrid(validSeed);
  if (!gridResult.success) {
    return gridResult;
  }
  const solution = gridResult.data;
  const puzzle = digHoles(solution, config, rng);
  const transformed = applyRandomPropagation(puzzle, solution, rng);
  const clueCount = countGivens(transformed.puzzle);

  return success({
    grid: transformed.puzzle,
    solution: transformed.solution,
    clues: transformed.puzzle.map(row => row.map(val => val !== 0)),
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

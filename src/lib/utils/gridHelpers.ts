/**
 * Safe Grid Access Utilities
 *
 * Provides type-safe access to 9x9 Sudoku grids without non-null assertions.
 * These functions ensure array bounds are respected while maintaining type safety.
 */

/**
 * Safely gets a value from a grid cell
 * Throws if indices are out of bounds (should never happen in valid Sudoku code)
 */
export function getCell(
  grid: readonly (readonly number[])[],
  row: number,
  col: number
): number {
  if (row < 0 || row >= 9 || col < 0 || col >= 9) {
    throw new Error(`Invalid grid indices: row=${row}, col=${col}`);
  }

  const rowData = grid[row];
  if (!rowData) {
    throw new Error(`Grid row ${row} is undefined`);
  }

  const value = rowData[col];
  if (value === undefined) {
    throw new Error(`Grid cell [${row}, ${col}] is undefined`);
  }

  return value;
}

/**
 * Safely sets a value in a mutable grid cell
 */
export function setCell(
  grid: number[][],
  row: number,
  col: number,
  value: number
): void {
  if (row < 0 || row >= 9 || col < 0 || col >= 9) {
    throw new Error(`Invalid grid indices: row=${row}, col=${col}`);
  }

  const rowData = grid[row];
  if (!rowData) {
    throw new Error(`Grid row ${row} is undefined`);
  }

  rowData[col] = value;
}

/**
 * Safely gets a row from the grid
 */
export function getRow(
  grid: readonly (readonly number[])[],
  row: number
): readonly number[] {
  if (row < 0 || row >= 9) {
    throw new Error(`Invalid row index: ${row}`);
  }

  const rowData = grid[row];
  if (!rowData) {
    throw new Error(`Grid row ${row} is undefined`);
  }

  return rowData;
}

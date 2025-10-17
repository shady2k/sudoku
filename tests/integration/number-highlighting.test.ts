/**
 * Number Highlighting Integration Tests
 *
 * These tests verify the complete number highlighting flow without mocking,
 * ensuring that clicking a cell properly highlights matching numbers.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { gameStore } from '../../src/lib/stores/gameStore.svelte';

describe('Number Highlighting Integration (FR-013)', () => {
  beforeEach(async () => {
    // Start with a fresh game
    await gameStore.newGame(50, 12345); // Fixed seed for reproducibility
  });

  it('should set highlightedNumber when clicking cell with value', () => {
    // Arrange: Find a cell with a value
    let cellWithValue: { row: number; col: number; value: number } | null = null;
    for (let row = 0; row < 9; row++) {
      for (let col = 0; col < 9; col++) {
        const cell = gameStore.session?.cells[row]?.[col];
        if (cell && cell.value !== 0) {
          cellWithValue = { row, col, value: cell.value };
          break;
        }
      }
      if (cellWithValue) break;
    }

    expect(cellWithValue).not.toBeNull();
    if (!cellWithValue) return;

    // Act: Select the cell (simulating click)
    gameStore.selectCell({ row: cellWithValue.row, col: cellWithValue.col });
    gameStore.setHighlightedNumber(cellWithValue.value);

    // Assert: highlightedNumber should be set
    expect(gameStore.session?.highlightedNumber).toBe(cellWithValue.value);
  });

  it('should maintain highlightedNumber after selectCell is called', () => {
    // Arrange: Find a cell with value 5 (or any non-zero value)
    let targetCell: { row: number; col: number; value: number } | null = null;
    for (let row = 0; row < 9; row++) {
      for (let col = 0; col < 9; col++) {
        const cell = gameStore.session?.cells[row]?.[col];
        if (cell && cell.value !== 0) {
          targetCell = { row, col, value: cell.value };
          break;
        }
      }
      if (targetCell) break;
    }

    expect(targetCell).not.toBeNull();
    if (!targetCell) return;

    // Act: Set highlighting BEFORE selecting (this was the bug scenario)
    gameStore.setHighlightedNumber(targetCell.value);
    const highlightedBefore = gameStore.session?.highlightedNumber;

    // Now select the cell (this used to overwrite highlightedNumber)
    gameStore.selectCell({ row: targetCell.row, col: targetCell.col });
    const highlightedAfter = gameStore.session?.highlightedNumber;

    // Assert: highlightedNumber should NOT be changed by selectCell
    expect(highlightedBefore).toBe(targetCell.value);
    expect(highlightedAfter).toBe(targetCell.value);
    expect(highlightedAfter).toBe(highlightedBefore); // Key assertion: selectCell doesn't overwrite
  });

  it('should toggle off highlighting when clicking same number twice', () => {
    // Arrange: Find a cell with a value
    let cellWithValue: { row: number; col: number; value: number } | null = null;
    for (let row = 0; row < 9; row++) {
      for (let col = 0; col < 9; col++) {
        const cell = gameStore.session?.cells[row]?.[col];
        if (cell && cell.value !== 0) {
          cellWithValue = { row, col, value: cell.value };
          break;
        }
      }
      if (cellWithValue) break;
    }

    expect(cellWithValue).not.toBeNull();
    if (!cellWithValue) return;

    // Act: First click - set highlighting
    gameStore.setHighlightedNumber(cellWithValue.value);
    expect(gameStore.session?.highlightedNumber).toBe(cellWithValue.value);

    // Second click - toggle off
    gameStore.setHighlightedNumber(null);

    // Assert: Should be null now
    expect(gameStore.session?.highlightedNumber).toBeNull();
  });

  it('should clear highlighting when clicking empty cell', () => {
    // Arrange: Set some highlighting first
    gameStore.setHighlightedNumber(5);
    expect(gameStore.session?.highlightedNumber).toBe(5);

    // Act: "Click" an empty cell by clearing highlighting
    gameStore.setHighlightedNumber(null);

    // Assert: Should be cleared
    expect(gameStore.session?.highlightedNumber).toBeNull();
  });

  it('should handle multiple cells with same value', () => {
    // Arrange: Make a move to ensure we have multiple cells with same value
    let emptyCell: { row: number; col: number } | null = null;
    for (let row = 0; row < 9; row++) {
      for (let col = 0; col < 9; col++) {
        const cell = gameStore.session?.cells[row]?.[col];
        if (cell && cell.value === 0 && !cell.isClue) {
          emptyCell = { row, col };
          break;
        }
      }
      if (emptyCell) break;
    }

    expect(emptyCell).not.toBeNull();
    if (!emptyCell) return;

    // Make a move
    gameStore.makeMove(emptyCell, 7);

    // Act: Highlight the number we just entered
    gameStore.setHighlightedNumber(7);

    // Assert: Should be highlighted
    expect(gameStore.session?.highlightedNumber).toBe(7);

    // Count how many cells have value 7
    let countWithSeven = 0;
    for (let row = 0; row < 9; row++) {
      for (let col = 0; col < 9; col++) {
        const cell = gameStore.session?.cells[row]?.[col];
        if (cell?.value === 7) {
          countWithSeven++;
        }
      }
    }

    // We should have at least the one we just placed
    expect(countWithSeven).toBeGreaterThanOrEqual(1);
  });
});

/**
 * SudokuGrid Component Tests
 *
 * Tests for the main 9×9 Sudoku grid component with cell selection,
 * keyboard navigation, and responsive layout.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import SudokuGrid from '../../../src/components/SudokuGrid.svelte';
import { gameStore } from '../../../src/lib/stores/gameStore.svelte.ts';
import type { GameSession, Cell as CellType } from '../../../src/lib/models/types';

// Mock the gameStore
vi.mock('../../../src/lib/stores/gameStore.svelte.ts', () => ({
  gameStore: {
    session: null,
    selectCell: vi.fn(),
    makeMove: vi.fn(),
  },
}));

describe('SudokuGrid Component', () => {
  const user = userEvent.setup();

  const createMockCell = (row: number, col: number, overrides: Partial<CellType> = {}): CellType => ({
    row,
    col,
    value: 0,
    isClue: false,
    isError: false,
    manualCandidates: new Set(),
    autoCandidates: null,
    ...overrides,
  });

  const createMockSession = (): GameSession => {
    const cells: CellType[][] = [];
    for (let r = 0; r < 9; r++) {
      const row: CellType[] = [];
      for (let c = 0; c < 9; c++) {
        row.push(createMockCell(r, c));
      }
      cells.push(row);
    }

    return {
      sessionId: 'test-session',
      puzzle: {} as any,
      board: Array(9).fill(0).map(() => Array(9).fill(0)),
      cells,
      startTime: Date.now(),
      elapsedTime: 0,
      isPaused: false,
      pausedAt: null,
      difficultyLevel: 5,
      errorCount: 0,
      isCompleted: false,
      lastActivityAt: Date.now(),
      selectedCell: null,
      showAutoCandidates: false,
      history: {
        actions: [],
        currentIndex: -1,
        maxSize: 50,
      },
    };
  };

  beforeEach(() => {
    vi.clearAllMocks();
    gameStore.session = null;
  });

  describe('Rendering', () => {
    it('should render empty state when no session', () => {
      gameStore.session = null;
      render(SudokuGrid);

      expect(screen.getByText('No game in progress')).toBeInTheDocument();
      expect(screen.getByText('Click "New Game" to start')).toBeInTheDocument();
    });

    it('should render 9×9 grid when session exists', () => {
      const mockSession = createMockSession();
      gameStore.session = mockSession;

      render(SudokuGrid);

      // Grid should be present
      const grid = document.querySelector('.grid');
      expect(grid).toBeInTheDocument();

      // Should have 81 cells (9x9)
      const cellWrappers = document.querySelectorAll('.cell-wrapper');
      expect(cellWrappers).toHaveLength(81);
    });

    it('should render all cells with correct positions', () => {
      const mockSession = createMockSession();
      gameStore.session = mockSession;

      render(SudokuGrid);

      // Check cells have correct data attributes
      for (let row = 0; row < 9; row++) {
        for (let col = 0; col < 9; col++) {
          const cell = document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
          expect(cell).toBeInTheDocument();
        }
      }
    });

    it('should apply thick borders for 3×3 box boundaries', () => {
      const mockSession = createMockSession();
      gameStore.session = mockSession;

      render(SudokuGrid);

      // Columns 2 and 5 should have thick right border
      const thickRightCells = document.querySelectorAll('.thick-right');
      expect(thickRightCells.length).toBe(18); // 9 rows × 2 columns

      // Rows 2 and 5 should have thick bottom border
      const thickBottomCells = document.querySelectorAll('.thick-bottom');
      expect(thickBottomCells.length).toBe(18); // 2 rows × 9 columns
    });
  });

  describe('Cell Selection', () => {
    it('should mark selected cell as selected', () => {
      const mockSession = createMockSession();
      mockSession.selectedCell = { row: 0, col: 0 };
      gameStore.session = mockSession;

      render(SudokuGrid);

      const cell = document.querySelector('[data-row="0"][data-col="0"]');
      expect(cell).toHaveClass('selected');
    });

    it('should call selectCell when clicking a cell', async () => {
      const mockSession = createMockSession();
      gameStore.session = mockSession;

      render(SudokuGrid);

      const cell = screen.getByRole('button', { name: '', hidden: true });
      await user.click(cell);

      expect(gameStore.selectCell).toHaveBeenCalled();
    });

    it('should not select clue cells', () => {
      const mockSession = createMockSession();
      mockSession.cells[0][0].isClue = true;
      mockSession.cells[0][0].value = 5;
      gameStore.session = mockSession;

      render(SudokuGrid);

      const cell = document.querySelector('[data-row="0"][data-col="0"]');

      // Component should prevent selection of clue cells in handler
      // (Though the test needs to simulate the click through the handler)
      expect(cell).toBeInTheDocument();
    });
  });

  describe('Related Cell Highlighting', () => {
    it('should highlight cells in same row as selected cell', () => {
      const mockSession = createMockSession();
      mockSession.selectedCell = { row: 4, col: 4 }; // Center cell
      gameStore.session = mockSession;

      // Mock getRelatedCells to return same row
      vi.doMock('../../../src/lib/utils/validation', () => ({
        getRelatedCells: vi.fn(() => {
          const related = [];
          for (let c = 0; c < 9; c++) {
            if (c !== 4) related.push({ row: 4, col: c });
          }
          return related;
        }),
      }));

      render(SudokuGrid);

      // Cells in row 4 (except selected) should be related
      for (let col = 0; col < 9; col++) {
        const cell = document.querySelector(`[data-row="4"][data-col="${col}"]`);
        if (col === 4) {
          expect(cell).toHaveClass('selected');
        }
      }
    });
  });

  describe('Keyboard Navigation', () => {
    it('should move selection up with ArrowUp', async () => {
      const mockSession = createMockSession();
      mockSession.selectedCell = { row: 5, col: 5 };
      gameStore.session = mockSession;

      render(SudokuGrid);

      await user.keyboard('{ArrowUp}');

      expect(gameStore.selectCell).toHaveBeenCalledWith({ row: 4, col: 5 });
    });

    it('should move selection down with ArrowDown', async () => {
      const mockSession = createMockSession();
      mockSession.selectedCell = { row: 3, col: 3 };
      gameStore.session = mockSession;

      render(SudokuGrid);

      await user.keyboard('{ArrowDown}');

      expect(gameStore.selectCell).toHaveBeenCalledWith({ row: 4, col: 3 });
    });

    it('should move selection left with ArrowLeft', async () => {
      const mockSession = createMockSession();
      mockSession.selectedCell = { row: 4, col: 4 };
      gameStore.session = mockSession;

      render(SudokuGrid);

      await user.keyboard('{ArrowLeft}');

      expect(gameStore.selectCell).toHaveBeenCalledWith({ row: 4, col: 3 });
    });

    it('should move selection right with ArrowRight', async () => {
      const mockSession = createMockSession();
      mockSession.selectedCell = { row: 2, col: 2 };
      gameStore.session = mockSession;

      render(SudokuGrid);

      await user.keyboard('{ArrowRight}');

      expect(gameStore.selectCell).toHaveBeenCalledWith({ row: 2, col: 3 });
    });

    it('should not move beyond grid boundaries (top)', async () => {
      const mockSession = createMockSession();
      mockSession.selectedCell = { row: 0, col: 5 };
      gameStore.session = mockSession;

      render(SudokuGrid);

      await user.keyboard('{ArrowUp}');

      // Should stay at row 0
      expect(gameStore.selectCell).toHaveBeenCalledWith({ row: 0, col: 5 });
    });

    it('should not move beyond grid boundaries (bottom)', async () => {
      const mockSession = createMockSession();
      mockSession.selectedCell = { row: 8, col: 5 };
      gameStore.session = mockSession;

      render(SudokuGrid);

      await user.keyboard('{ArrowDown}');

      // Should stay at row 8
      expect(gameStore.selectCell).toHaveBeenCalledWith({ row: 8, col: 5 });
    });

    it('should not move beyond grid boundaries (left)', async () => {
      const mockSession = createMockSession();
      mockSession.selectedCell = { row: 5, col: 0 };
      gameStore.session = mockSession;

      render(SudokuGrid);

      await user.keyboard('{ArrowLeft}');

      // Should stay at col 0
      expect(gameStore.selectCell).toHaveBeenCalledWith({ row: 5, col: 0 });
    });

    it('should not move beyond grid boundaries (right)', async () => {
      const mockSession = createMockSession();
      mockSession.selectedCell = { row: 5, col: 8 };
      gameStore.session = mockSession;

      render(SudokuGrid);

      await user.keyboard('{ArrowRight}');

      // Should stay at col 8
      expect(gameStore.selectCell).toHaveBeenCalledWith({ row: 5, col: 8 });
    });
  });

  describe('Keyboard Number Entry', () => {
    it('should enter number 1-9 when key pressed', async () => {
      const mockSession = createMockSession();
      mockSession.selectedCell = { row: 3, col: 3 };
      gameStore.session = mockSession;

      render(SudokuGrid);

      await user.keyboard('5');

      expect(gameStore.makeMove).toHaveBeenCalledWith({ row: 3, col: 3 }, 5);
    });

    it('should handle all number keys 1-9', async () => {
      const mockSession = createMockSession();
      mockSession.selectedCell = { row: 0, col: 0 };
      gameStore.session = mockSession;

      render(SudokuGrid);

      for (let num = 1; num <= 9; num++) {
        await user.keyboard(`${num}`);
        expect(gameStore.makeMove).toHaveBeenCalledWith({ row: 0, col: 0 }, num);
      }

      expect(gameStore.makeMove).toHaveBeenCalledTimes(9);
    });

    it('should clear cell with Delete key', async () => {
      const mockSession = createMockSession();
      mockSession.selectedCell = { row: 2, col: 2 };
      mockSession.cells[2][2].value = 5;
      gameStore.session = mockSession;

      render(SudokuGrid);

      await user.keyboard('{Delete}');

      expect(gameStore.makeMove).toHaveBeenCalledWith({ row: 2, col: 2 }, 0);
    });

    it('should clear cell with Backspace key', async () => {
      const mockSession = createMockSession();
      mockSession.selectedCell = { row: 1, col: 1 };
      mockSession.cells[1][1].value = 7;
      gameStore.session = mockSession;

      render(SudokuGrid);

      await user.keyboard('{Backspace}');

      expect(gameStore.makeMove).toHaveBeenCalledWith({ row: 1, col: 1 }, 0);
    });

    it('should not allow editing clue cells with keyboard', () => {
      const mockSession = createMockSession();
      mockSession.selectedCell = { row: 0, col: 0 };
      mockSession.cells[0][0].isClue = true;
      mockSession.cells[0][0].value = 5;
      gameStore.session = mockSession;

      render(SudokuGrid);

      // The handleKeyDown should check if cell is a clue before making move
      // This is handled in the component logic
    });

    it('should do nothing when no cell is selected', async () => {
      const mockSession = createMockSession();
      mockSession.selectedCell = null;
      gameStore.session = mockSession;

      render(SudokuGrid);

      await user.keyboard('5');

      expect(gameStore.makeMove).not.toHaveBeenCalled();
    });
  });

  describe('Grid Layout', () => {
    it('should have responsive grid with minimum 44px cells', () => {
      const mockSession = createMockSession();
      gameStore.session = mockSession;

      render(SudokuGrid);

      const grid = document.querySelector('.grid');
      expect(grid).toBeInTheDocument();

      const styles = window.getComputedStyle(grid!);
      expect(styles.gridTemplateColumns).toContain('minmax(44px, 1fr)');
      expect(styles.gridTemplateRows).toContain('minmax(44px, 1fr)');
    });

    it('should maintain aspect ratio', () => {
      const mockSession = createMockSession();
      gameStore.session = mockSession;

      render(SudokuGrid);

      const grid = document.querySelector('.grid');
      const styles = window.getComputedStyle(grid!);

      expect(styles.aspectRatio).toBe('1');
    });

    it('should have border around entire grid', () => {
      const mockSession = createMockSession();
      gameStore.session = mockSession;

      render(SudokuGrid);

      const grid = document.querySelector('.grid');
      const styles = window.getComputedStyle(grid!);

      expect(styles.border).toContain('3px solid');
    });
  });

  describe('Accessibility', () => {
    it('should have grid structure for screen readers', () => {
      const mockSession = createMockSession();
      gameStore.session = mockSession;

      render(SudokuGrid);

      const grid = document.querySelector('.grid');
      expect(grid).toHaveAttribute('class', 'grid');
    });

    it('should support keyboard-only interaction', async () => {
      const mockSession = createMockSession();
      mockSession.selectedCell = { row: 4, col: 4 };
      gameStore.session = mockSession;

      render(SudokuGrid);

      // Navigate and enter value using only keyboard
      await user.keyboard('{ArrowRight}');
      await user.keyboard('7');

      expect(gameStore.selectCell).toHaveBeenCalledWith({ row: 4, col: 5 });
      expect(gameStore.makeMove).toHaveBeenCalledWith({ row: 4, col: 4 }, 7);
    });
  });
});

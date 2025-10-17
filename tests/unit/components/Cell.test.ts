/**
 * Cell Component Tests
 *
 * Tests for the individual Sudoku cell component with error highlighting,
 * row/column/box highlighting, and 44×44px minimum touch targets.
 */

import { describe, it, expect, _beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import Cell from '../../../src/components/Cell.svelte';
import type { Cell as CellType } from '../../../src/lib/models/types';

// Mock the gameStore
vi.mock('../../../src/lib/stores/gameStore.svelte.ts', () => ({
  gameStore: {
    session: null,
    isLoading: false,
    error: null,
    currentTime: Date.now(),
  }
}));

describe('Cell Component - Rendering', () => {

  const createMockCell = (overrides: Partial<CellType> = {}): CellType => ({
    row: 0,
    col: 0,
    value: 0,
    isClue: false,
    isError: false,
    manualCandidates: new Set<number>(),
    autoCandidates: null,
    ...overrides,
  });

  it('should render empty cell', () => {
    const cell = createMockCell();
    const onSelect = vi.fn();

    render(Cell, { cell, isSelected: false, isRelated: false, onSelect });

    const button = screen.getByRole('button');
    expect(button).toBeInTheDocument();
    expect(button).toHaveClass('cell');
    expect(button).not.toHaveClass('clue', 'selected', 'related', 'error');
  });

  it('should render cell with value', () => {
    const cell = createMockCell({ value: 5 });
    const onSelect = vi.fn();

    render(Cell, { cell, isSelected: false, isRelated: false, onSelect });

    const button = screen.getByRole('button');
    expect(button).toHaveTextContent('5');
  });

  it('should render clue cell with distinct styling', () => {
    const cell = createMockCell({ value: 7, isClue: true });
    const onSelect = vi.fn();

    render(Cell, { cell, isSelected: false, isRelated: false, onSelect });

    const button = screen.getByRole('button');
    expect(button).toHaveClass('clue');
    expect(button).toHaveTextContent('7');
  });

  it('should render selected cell with highlighting', () => {
    const cell = createMockCell({ value: 3 });
    const onSelect = vi.fn();

    render(Cell, { cell, isSelected: true, isRelated: false, onSelect });

    const button = screen.getByRole('button');
    expect(button).toHaveClass('selected');
  });

  it('should render related cell (same row/col/box) with highlighting', () => {
    const cell = createMockCell({ value: 2 });
    const onSelect = vi.fn();

    render(Cell, { cell, isSelected: false, isRelated: true, onSelect });

    const button = screen.getByRole('button');
    expect(button).toHaveClass('related');
  });

  it('should render error cell with error styling', () => {
    const cell = createMockCell({ value: 5, isError: true });
    const onSelect = vi.fn();

    render(Cell, { cell, isSelected: false, isRelated: false, onSelect });

    const button = screen.getByRole('button');
    expect(button).toHaveClass('error');
  });

  it('should render cell with multiple states', () => {
    const cell = createMockCell({ value: 8, isError: true });
    const onSelect = vi.fn();

    render(Cell, { cell, isSelected: true, isRelated: true, onSelect });

    const button = screen.getByRole('button');
    expect(button).toHaveClass('selected', 'related', 'error');
  });
});

describe('Cell Component - Data Attributes', () => {
  const createMockCell = (overrides: Partial<CellType> = {}): CellType => ({
    row: 0,
    col: 0,
    value: 0,
    isClue: false,
    isError: false,
    manualCandidates: new Set<number>(),
    autoCandidates: null,
    ...overrides,
  });

  it('should have correct data-row attribute', () => {
    const cell = createMockCell({ row: 5, col: 3 });
    const onSelect = vi.fn();

    render(Cell, { cell, isSelected: false, isRelated: false, onSelect });

    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('data-row', '5');
  });

  it('should have correct data-col attribute', () => {
    const cell = createMockCell({ row: 2, col: 7 });
    const onSelect = vi.fn();

    render(Cell, { cell, isSelected: false, isRelated: false, onSelect });

    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('data-col', '7');
  });
});

describe('Cell Component - Touch Targets (FR-020)', () => {
  const createMockCell = (overrides: Partial<CellType> = {}): CellType => ({
    row: 0,
    col: 0,
    value: 0,
    isClue: false,
    isError: false,
    manualCandidates: new Set<number>(),
    autoCandidates: null,
    ...overrides,
  });

  it('should meet minimum 44×44px touch target size', () => {
    const cell = createMockCell();
    const onSelect = vi.fn();

    render(Cell, { cell, isSelected: false, isRelated: false, onSelect });

    const button = screen.getByRole('button');
    const styles = window.getComputedStyle(button);

    // Check CSS min-width and min-height
    expect(styles.minWidth).toBe('44px');
    expect(styles.minHeight).toBe('44px');
  });
});

describe('Cell Component - Candidate Numbers', () => {
  const createMockCell = (overrides: Partial<CellType> = {}): CellType => ({
    row: 0,
    col: 0,
    value: 0,
    isClue: false,
    isError: false,
    manualCandidates: new Set<number>(),
    autoCandidates: null,
    ...overrides,
  });

  it('should render manual candidates in 3×3 grid', () => {
    const cell = createMockCell({
      value: 0,
      manualCandidates: new Set([1, 2, 5, 9]),
    });
    const onSelect = vi.fn();

    render(Cell, { cell, isSelected: false, isRelated: false, onSelect });

    // Check for candidates container
    const candidatesDiv = screen.getByTestId('candidates-container');
    expect(candidatesDiv).toBeInTheDocument();

    // Check specific manual candidates are displayed
    expect(screen.getByTestId('candidate-1')).toBeInTheDocument();
    expect(screen.getByTestId('candidate-2')).toBeInTheDocument();
    expect(screen.getByTestId('candidate-5')).toBeInTheDocument();
    expect(screen.getByTestId('candidate-9')).toBeInTheDocument();
  });

  it('should render auto candidates when enabled', async () => {
    const { gameStore } = await import('../../../src/lib/stores/gameStore.svelte.ts');
    gameStore.session = { showAutoCandidates: true } as any;

    const cell = createMockCell({
      value: 0,
      manualCandidates: new Set(),
      autoCandidates: new Set([3, 4, 6]),
    });
    const onSelect = vi.fn();

    render(Cell, { cell, isSelected: false, isRelated: false, onSelect });

    expect(screen.getByTestId('candidate-3')).toBeInTheDocument();
    expect(screen.getByTestId('candidate-4')).toBeInTheDocument();
    expect(screen.getByTestId('candidate-6')).toBeInTheDocument();

    gameStore.session = null;
  });

  it('should display both manual and auto candidates (manual takes precedence in styling)', async () => {
    const { gameStore } = await import('../../../src/lib/stores/gameStore.svelte.ts');
    gameStore.session = { showAutoCandidates: true } as any;

    const cell = createMockCell({
      value: 0,
      manualCandidates: new Set([1, 2]),
      autoCandidates: new Set([1, 2, 3, 4]),
    });
    const onSelect = vi.fn();

    render(Cell, { cell, isSelected: false, isRelated: false, onSelect });

    // Manual candidates should have distinct styling
    const candidate1 = screen.getByTestId('candidate-1');
    const candidate2 = screen.getByTestId('candidate-2');
    const candidate3 = screen.getByTestId('candidate-3');

    expect(candidate1).toHaveClass('manual-candidate');
    expect(candidate2).toHaveClass('manual-candidate');
    expect(candidate3).toHaveClass('auto-candidate');
    expect(candidate3).not.toHaveClass('manual-candidate');

    gameStore.session = null;
  });

  it('should render 3×3 grid with 9 positions (some empty)', () => {
    const cell = createMockCell({
      value: 0,
      manualCandidates: new Set([1, 5, 9]),
    });
    const onSelect = vi.fn();

    render(Cell, { cell, isSelected: false, isRelated: false, onSelect });

    // All 9 candidate positions should exist
    const candidateSpans = document.querySelectorAll('.candidate-number');
    expect(candidateSpans).toHaveLength(9);

    // Empty positions should be hidden
    const emptyCandidates = document.querySelectorAll('.candidate-number.empty');
    expect(emptyCandidates.length).toBeGreaterThan(0);
  });

  it('should not render candidates when cell has a value', () => {
    const cell = createMockCell({
      value: 7,
      manualCandidates: new Set([1, 2, 3]), // Should be ignored
    });
    const onSelect = vi.fn();

    render(Cell, { cell, isSelected: false, isRelated: false, onSelect });

    expect(screen.queryByText('1')).not.toBeInTheDocument();
    expect(screen.queryByText('2')).not.toBeInTheDocument();
    expect(screen.queryByText('3')).not.toBeInTheDocument();
  });
});

describe('Cell Component - Interaction', () => {
  const user = userEvent.setup();

  const createMockCell = (overrides: Partial<CellType> = {}): CellType => ({
    row: 0,
    col: 0,
    value: 0,
    isClue: false,
    isError: false,
    manualCandidates: new Set<number>(),
    autoCandidates: null,
    ...overrides,
  });

  it('should call onSelect when clicked', async () => {
    const cell = createMockCell();
    const onSelect = vi.fn();

    render(Cell, { cell, isSelected: false, isRelated: false, onSelect });

    const button = screen.getByRole('button');
    await user.click(button);

    expect(onSelect).toHaveBeenCalledTimes(1);
  });

  it('should call onSelect when clue cell is clicked', async () => {
    const cell = createMockCell({ value: 5, isClue: true });
    const onSelect = vi.fn();

    render(Cell, { cell, isSelected: false, isRelated: false, onSelect });

    const button = screen.getByRole('button');
    await user.click(button);

    // Even though it's a clue, click should still work (game logic decides if action is valid)
    expect(onSelect).toHaveBeenCalledTimes(1);
  });

  it('should support keyboard interaction (Enter/Space)', async () => {
    const cell = createMockCell();
    const onSelect = vi.fn();

    render(Cell, { cell, isSelected: false, isRelated: false, onSelect });

    const button = screen.getByRole('button');
    button.focus();

    await user.keyboard('{Enter}');
    expect(onSelect).toHaveBeenCalledTimes(1);

    await user.keyboard(' ');
    expect(onSelect).toHaveBeenCalledTimes(2);
  });
});

describe('Cell Component - Accessibility', () => {
  const createMockCell = (overrides: Partial<CellType> = {}): CellType => ({
    row: 0,
    col: 0,
    value: 0,
    isClue: false,
    isError: false,
    manualCandidates: new Set<number>(),
    autoCandidates: null,
    ...overrides,
  });

  it('should be a button element', () => {
    const cell = createMockCell();
    const onSelect = vi.fn();

    render(Cell, { cell, isSelected: false, isRelated: false, onSelect });

    const button = screen.getByRole('button');
    expect(button.tagName).toBe('BUTTON');
  });

  it('should have type="button"', () => {
    const cell = createMockCell();
    const onSelect = vi.fn();

    render(Cell, { cell, isSelected: false, isRelated: false, onSelect });

    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('type', 'button');
  });
});

describe('Cell Component - Visual Feedback', () => {
  const createMockCell = (overrides: Partial<CellType> = {}): CellType => ({
    row: 0,
    col: 0,
    value: 0,
    isClue: false,
    isError: false,
    manualCandidates: new Set<number>(),
    autoCandidates: null,
    ...overrides,
  });

  it('should have different styling for clue vs user-entered values', () => {
    const clueCell = createMockCell({ value: 5, isClue: true });
    const userCell = createMockCell({ value: 5, isClue: false });
    const onSelect = vi.fn();

    const { container: clueContainer } = render(Cell, {
      cell: clueCell,
      isSelected: false,
      isRelated: false,
      onSelect
    });

    const { container: userContainer } = render(Cell, {
      cell: userCell,
      isSelected: false,
      isRelated: false,
      onSelect
    });

    const clueButton = clueContainer.querySelector('.cell');
    const userButton = userContainer.querySelector('.cell');

    expect(clueButton).toHaveClass('clue');
    expect(userButton).not.toHaveClass('clue');
  });

  it('should show error styling when cell has error', () => {
    const cell = createMockCell({ value: 5, isError: true });
    const onSelect = vi.fn();

    render(Cell, { cell, isSelected: false, isRelated: false, onSelect });

    const button = screen.getByRole('button');
    expect(button).toHaveClass('error');
  });

  it('should combine selected and related styling', () => {
    const cell = createMockCell();
    const onSelect = vi.fn();

    render(Cell, { cell, isSelected: true, isRelated: true, onSelect });

    const button = screen.getByRole('button');
    expect(button).toHaveClass('selected');
    expect(button).toHaveClass('related');
  });
});

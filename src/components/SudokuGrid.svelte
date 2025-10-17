<script lang="ts">
  import Cell from './Cell.svelte';
  import { gameStore } from '../lib/stores/gameStore.svelte';
  import { getRelatedCells } from '../lib/utils/validation';

  function handleCellSelect(row: number, col: number): void {
    const cell = gameStore.session?.cells[row]?.[col];
    if (!cell) return;

    gameStore.selectCell({ row, col });
  }

  function isRelatedToSelected(row: number, col: number): boolean {
    if (!gameStore.session?.selectedCell) return false;

    const related = getRelatedCells(gameStore.session.selectedCell);
    return related.some(pos => pos.row === row && pos.col === col);
  }

  function toggleManualCandidate(row: number, col: number, value: number): void {
    if (!gameStore.session) return;

    const cell = gameStore.session.cells[row]?.[col];
    if (!cell || cell.value !== 0 || cell.isClue) return;

    const currentCandidates = new Set(cell.manualCandidates);

    if (currentCandidates.has(value)) {
      currentCandidates.delete(value);
    } else {
      currentCandidates.add(value);
    }

    gameStore.setManualCandidates({ row, col }, currentCandidates);
  }

  function shouldIgnoreKeyboardEvent(event: KeyboardEvent): boolean {
    // Don't interfere with input elements
    return event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement;
  }

  function canModifyCell(cell: { isClue: boolean }): boolean {
    return !cell.isClue;
  }

  function handleNumberInput(event: KeyboardEvent, row: number, col: number, cell: { isClue: boolean; value: number }): void {
    if (event.key >= '1' && event.key <= '9') {
      if (!canModifyCell(cell)) return;

      const value = parseInt(event.key);

      // Check if Shift or Alt is pressed, or if in notes mode
      const shouldToggleCandidate = event.shiftKey || event.altKey || gameStore.notesMode;

      if (shouldToggleCandidate) {
        // Toggle as candidate (only for empty cells)
        if (cell.value === 0) {
          toggleManualCandidate(row, col, value);
        }
      } else {
        // Normal cell value entry
        gameStore.makeMove({ row, col }, value);
      }
      event.preventDefault();
    }
  }

  function handleClearInput(event: KeyboardEvent, row: number, col: number, cell: { isClue: boolean; value: number }): void {
    if (event.key === 'Delete' || event.key === 'Backspace') {
      if (!canModifyCell(cell)) return;

      // Check if Shift is pressed, or if in notes mode
      const shouldClearCandidates = event.shiftKey || gameStore.notesMode;

      // In notes mode or with Shift, clear all manual candidates for empty cells
      if (shouldClearCandidates && cell.value === 0) {
        gameStore.setManualCandidates({ row, col }, new Set());
      } else {
        // Clear cell value (or do nothing if in notes mode and cell has value)
        if (!gameStore.notesMode) {
          gameStore.makeMove({ row, col }, 0);
        }
      }
      event.preventDefault();
    }
  }

  function handleNavigation(event: KeyboardEvent, row: number, col: number): void {
    let newRow = row;
    let newCol = col;

    switch (event.key) {
      case 'ArrowUp':
        newRow = Math.max(0, row - 1);
        break;
      case 'ArrowDown':
        newRow = Math.min(8, row + 1);
        break;
      case 'ArrowLeft':
        newCol = Math.max(0, col - 1);
        break;
      case 'ArrowRight':
        newCol = Math.min(8, col + 1);
        break;
      default:
        return;
    }

    if (newRow !== row || newCol !== col) {
      // Remove focus from any focused button to prevent border artifact
      if (document.activeElement instanceof HTMLElement) {
        document.activeElement.blur();
      }
      gameStore.selectCell({ row: newRow, col: newCol });
      event.preventDefault();
    }
  }

  function handleKeyDown(event: KeyboardEvent): void {
    if (!gameStore.session?.selectedCell) return;

    const { row, col } = gameStore.session.selectedCell;
    const cell = gameStore.session.cells[row]?.[col];
    if (!cell) return;

    if (shouldIgnoreKeyboardEvent(event)) return;

    handleNumberInput(event, row, col, cell);
    handleClearInput(event, row, col, cell);
    handleNavigation(event, row, col);
  }
</script>

<svelte:window on:keydown={handleKeyDown} />

<div class="grid-container">
  {#if gameStore.session}
    <div class="grid">
      {#each gameStore.session.cells as row, rowIndex}
        {#each row as cell, colIndex}
          <div
            class="cell-wrapper"
            class:thick-right={colIndex === 2 || colIndex === 5}
            class:thick-bottom={rowIndex === 2 || rowIndex === 5}
            class:selected={gameStore.session.selectedCell?.row === rowIndex &&
                          gameStore.session.selectedCell?.col === colIndex}
            class:related={isRelatedToSelected(rowIndex, colIndex)}
          >
            <Cell
              {cell}
              isSelected={gameStore.session.selectedCell?.row === rowIndex &&
                         gameStore.session.selectedCell?.col === colIndex}
              isRelated={isRelatedToSelected(rowIndex, colIndex)}
              onSelect={(): void => handleCellSelect(rowIndex, colIndex)}
            />
          </div>
        {/each}
      {/each}
    </div>
  {:else}
    <div class="empty-state">
      <p>No game in progress</p>
      <p>Click "New Game" to start</p>
    </div>
  {/if}
</div>

<style>
  .grid-container {
    display: flex;
    justify-content: center;
    align-items: center;
    padding: 1rem;
  }

  .grid {
    display: grid;
    grid-template-columns: repeat(9, minmax(60px, 1fr));
    grid-template-rows: repeat(9, minmax(60px, 1fr));
    gap: 0;
    max-width: 600px;
    aspect-ratio: 1;
    border: 4px solid #1a1a1a;
    background-color: #1a1a1a;
    border-radius: 8px;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
  }

  .cell-wrapper {
    border-right: 1px solid #ddd;
    border-bottom: 1px solid #ddd;
    background-color: white;
    transition: background-color 0.2s ease;
  }

  .cell-wrapper.thick-right {
    border-right: 3px solid #1a1a1a;
  }

  .cell-wrapper.thick-bottom {
    border-bottom: 3px solid #1a1a1a;
  }

  .cell-wrapper.selected {
    background-color: #e0f2fe !important;
    box-shadow: inset 0 0 0 2px #0ea5e9;
    position: relative;
  }

  .cell-wrapper.selected::before {
    content: '';
    position: absolute;
    inset: -2px;
    background: linear-gradient(45deg, #0ea5e9, #38bdf8);
    border-radius: 2px;
    z-index: -1;
    opacity: 0.3;
    animation: glow 2s ease-in-out infinite alternate;
  }

  .cell-wrapper.related {
    background-color: #fef3c7 !important;
  }

  .cell-wrapper.related:hover {
    background-color: #fde68a !important;
  }

  @keyframes glow {
    from {
      opacity: 0.2;
    }
    to {
      opacity: 0.4;
    }
  }

  .empty-state {
    text-align: center;
    padding: 4rem 2rem;
    color: #666;
  }

  .empty-state p {
    margin: 0.5rem 0;
  }

  @media (min-width: 768px) {
    .grid {
      max-width: 700px;
    }
  }
</style>

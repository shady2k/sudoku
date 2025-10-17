<script lang="ts">
  import { gameStore } from '../lib/stores/gameStore.svelte';
  import type { CellValue } from '../lib/models/types';

  interface Props {
    onNewGame: () => Promise<void>;
  }

  let { onNewGame }: Props = $props();

  function handlePause(): void {
    if (gameStore.session?.isPaused) {
      gameStore.resumeGame();
    } else {
      gameStore.pauseGame();
    }
  }

  function handleFillCandidates(): void {
    gameStore.fillCandidates();
  }

  function handleNumberPadClick(value: CellValue): void {
    if (!gameStore.session?.selectedCell) return;

    const { row, col } = gameStore.session.selectedCell;
    const cell = gameStore.session.cells[row]?.[col];

    // Don't allow editing clue cells
    if (cell?.isClue) return;

    // Check if in notes mode
    if (gameStore.notesMode && cell.value === 0) {
      // Toggle candidate
      const currentCandidates = new Set(cell.manualCandidates);
      if (currentCandidates.has(value)) {
        currentCandidates.delete(value);
      } else {
        currentCandidates.add(value);
      }
      gameStore.setManualCandidates({ row, col }, currentCandidates);
    } else {
      // Normal move
      gameStore.makeMove(gameStore.session.selectedCell, value);
    }
  }

  function handleClearCell(): void {
    if (!gameStore.session?.selectedCell) return;

    const { row, col } = gameStore.session.selectedCell;
    const cell = gameStore.session.cells[row]?.[col];

    // Don't allow editing clue cells
    if (cell?.isClue) return;

    gameStore.makeMove(gameStore.session.selectedCell, 0);
  }
</script>

<div class="controls">
  {#if gameStore.session && !gameStore.session.isCompleted}
    <div class="number-pad">
      <div class="number-pad-grid">
        {#each Array.from({ length: 9 }, (_, i) => i + 1) as num}
          <button
            type="button"
            class="num-btn"
            onclick={(): void => handleNumberPadClick(num as CellValue)}
            disabled={!gameStore.session?.selectedCell || gameStore.session.cells[gameStore.session.selectedCell.row]?.[gameStore.session.selectedCell.col]?.isClue}
            aria-label={`Enter number ${num}`}
          >
            {num}
          </button>
        {/each}
        <button
          type="button"
          class="num-btn clear-btn"
          onclick={handleClearCell}
          disabled={!gameStore.session?.selectedCell || gameStore.session.cells[gameStore.session.selectedCell.row]?.[gameStore.session.selectedCell.col]?.isClue}
          aria-label="Clear cell (Delete/Backspace)"
          title="Clear cell (Delete/Backspace)"
        >
          <span class="btn-text">Clear</span>
          <span class="hotkey">Del</span>
        </button>
      </div>
    </div>
  {/if}

  <div class="buttons">
    <button
      type="button"
      class="btn btn-primary"
      onclick={onNewGame}
      disabled={gameStore.isLoading}
      title="New Game (G)"
    >
      <span class="btn-text">{gameStore.isLoading ? 'Generating...' : 'New Game'}</span>
      {#if !gameStore.isLoading}
        <span class="hotkey">G</span>
      {/if}
    </button>

    {#if gameStore.session}
      <button
        type="button"
        class="btn"
        onclick={handlePause}
        disabled={gameStore.session.isCompleted}
        title={gameStore.session.isPaused ? 'Resume (Space)' : 'Pause (Space)'}
      >
        <span class="btn-text">{gameStore.session.isPaused ? 'Resume' : 'Pause'}</span>
        <span class="hotkey">Space</span>
      </button>

      <button
        type="button"
        class="btn"
        onclick={handleFillCandidates}
        title="Fill Candidates (C)"
      >
        <span class="btn-text">Fill Candidates</span>
        <span class="hotkey">C</span>
      </button>
    {/if}
  </div>
</div>

<style>
  .controls {
    display: flex;
    flex-direction: column;
    gap: 0.625rem;
    padding: 0;
    max-width: 100%;
  }

  .buttons {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .btn {
    width: 100%;
    padding: 0.875rem 1.25rem;
    border: 2px solid #e5e7eb;
    background: linear-gradient(135deg, #ffffff 0%, #f9fafb 100%);
    color: #374151;
    font-size: 0.9375rem;
    font-weight: 600;
    border-radius: 0.75rem;
    cursor: pointer;
    transition: all 0.15s cubic-bezier(0.4, 0, 0.2, 1);
    display: flex;
    align-items: center;
    gap: 0.5rem;
    justify-content: center;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
    text-align: center;
    min-height: 44px;
  }

  .btn-text {
    flex-shrink: 0;
  }

  .hotkey {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 0.125rem 0.5rem;
    background: rgba(0, 0, 0, 0.1);
    border-radius: 0.25rem;
    font-size: 0.75rem;
    font-weight: 600;
    font-family: monospace;
    color: #ffffff;
    min-width: 1.5rem;
  }

  .btn:hover:not(:disabled) {
    background: linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%);
    border-color: #d1d5db;
    transform: translateY(-1px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.08);
  }

  .btn:active:not(:disabled) {
    transform: translateY(0);
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
  }

  .btn:disabled {
    opacity: 0.4;
    cursor: not-allowed;
    transform: none;
  }

  .btn-primary {
    background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
    color: white;
    border-color: #2563eb;
    box-shadow: 0 2px 6px rgba(59, 130, 246, 0.2);
  }

  .btn-primary:hover:not(:disabled) {
    background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
    border-color: #1d4ed8;
    box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
  }

  .btn-primary .hotkey {
    background: rgba(255, 255, 255, 0.25);
    color: white;
  }


  .number-pad {
    display: flex;
    flex-direction: column;
    gap: 0;
  }

  .number-pad-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 0.5rem;
    max-width: 100%;
  }

  .num-btn {
    aspect-ratio: 1;
    min-width: 32px;
    min-height: 32px;
    padding: 0;
    border: 2px solid #3b82f6;
    background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
    color: #3b82f6;
    font-size: 1.125rem;
    font-weight: 800;
    border-radius: 0.5rem;
    cursor: pointer;
    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    display: flex;
    align-items: center;
    justify-content: center;
    touch-action: manipulation;
    -webkit-tap-highlight-color: transparent;
    box-shadow: 0 2px 8px rgba(59, 130, 246, 0.15);
    position: relative;
    overflow: hidden;
  }

  .num-btn::before {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
    opacity: 0;
    transition: opacity 0.2s ease;
    border-radius: inherit;
  }

  .num-btn:hover:not(:disabled) {
    transform: translateY(-3px) scale(1.05);
    box-shadow: 0 8px 20px rgba(59, 130, 246, 0.3);
    border-color: #2563eb;
  }

  .num-btn:hover:not(:disabled)::before {
    opacity: 0.1;
  }

  .num-btn:active:not(:disabled) {
    transform: translateY(-1px) scale(1.02);
    box-shadow: 0 4px 12px rgba(59, 130, 246, 0.25);
    transition: all 0.1s ease;
  }

  .num-btn:active:not(:disabled)::before {
    opacity: 0.2;
  }

  .num-btn:disabled {
    opacity: 0.25;
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
  }

  .clear-btn {
    grid-column: span 3;
    border-color: #ef4444;
    color: #ef4444;
    font-size: 0.75rem;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.25rem;
    background: linear-gradient(135deg, #ffffff 0%, #fef2f2 100%);
    box-shadow: 0 1px 3px rgba(239, 68, 68, 0.1);
    aspect-ratio: auto;
    min-height: 32px;
  }

  .clear-btn:hover:not(:disabled) {
    background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
    color: white;
    border-color: #dc2626;
    box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3);
  }

  .clear-btn:hover:not(:disabled) .hotkey {
    background: rgba(255, 255, 255, 0.25);
    color: white;
  }

  /* T080a: Hide number pad on mobile (<768px) per FR-020 clarification */
  @media (max-width: 767px) {
    .number-pad {
      display: none;
    }
  }

  @media (min-width: 768px) {
    .controls {
      max-width: 340px;
      height: 100%;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
    }

    .number-pad-grid {
      gap: 0.5rem;
    }

    .num-btn {
      min-width: 38px;
      min-height: 38px;
      font-size: 1.375rem;
    }

    .clear-btn {
      min-height: 36px;
      font-size: 0.875rem;
    }
  }
</style>
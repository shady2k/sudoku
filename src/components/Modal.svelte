<script lang="ts">
  /**
   * Modal Component
   *
   * Handles New Game modal dialog per FR-004:
   * - Shows when no saved game exists OR user presses Ctrl+N
   * - Includes difficulty slider and "Start New Game" button
   * - Shows "Cancel" button ONLY when active game exists
   * - Escape key closes modal (when Cancel available)
   */

  import type { DifficultyLevel } from '../lib/models/types';

  interface Props {
    isOpen: boolean;
    hasActiveGame: boolean;
    onStartGame: (difficulty: DifficultyLevel) => void;
    onCancel?: () => void;
  }

  let { isOpen = $bindable(false), hasActiveGame, onStartGame, onCancel }: Props = $props();

  let selectedDifficulty: DifficultyLevel = $state(50); // 50% = medium

  // Handle Escape key
  function handleKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape' && hasActiveGame && onCancel) {
      onCancel();
    }
  }

  // Handle Enter key on overlay button
  function handleOverlayKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      handleCancelClick();
    }
  }

  function handleStart(): void {
    onStartGame(selectedDifficulty);
    isOpen = false;
  }

  function handleCancelClick(): void {
    if (onCancel) {
      onCancel();
    }
    isOpen = false;
  }
</script>

<svelte:window on:keydown={handleKeydown} />

{#if isOpen}
  <div class="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="modal-title">
    {#if hasActiveGame}
      <button
        class="overlay-button"
        onclick={handleCancelClick}
        onkeydown={handleOverlayKeydown}
        aria-label="Close modal"
        tabindex="-1"
      ></button>
    {:else}
      <div class="overlay-inactive"></div>
    {/if}
    <div class="modal" role="document">
      <h2 id="modal-title">New Game</h2>

      {#if hasActiveGame}
        <p class="warning">⚠️ Starting a new game will lose your current progress.</p>
      {/if}

      <div class="difficulty-selector">
        <label for="modal-difficulty">Difficulty: {selectedDifficulty}%</label>
        <input
          id="modal-difficulty"
          type="range"
          min="0"
          max="100"
          bind:value={selectedDifficulty}
        />
        <div class="difficulty-labels">
          <span class="label-left">Hardest (0%)</span>
          <span class="label-right">Easiest (100%)</span>
        </div>
      </div>

      <div class="modal-actions">
        <button
          type="button"
          class="btn btn-primary"
          onclick={handleStart}
        >
          Start New Game
        </button>

        {#if hasActiveGame}
          <button
            type="button"
            class="btn btn-secondary"
            onclick={handleCancelClick}
          >
            Cancel
          </button>
        {/if}
      </div>
    </div>
  </div>
{/if}

<style>
  .modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    padding: 1rem;
  }

  .overlay-button,
  .overlay-inactive {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.6);
  }

  .overlay-button {
    cursor: pointer;
    border: none;
    padding: 0;
    margin: 0;
  }

  .overlay-inactive {
    cursor: default;
  }

  .modal {
    background: white;
    border-radius: 1rem;
    padding: 2rem;
    max-width: 500px;
    width: 100%;
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
  }

  h2 {
    margin: 0 0 1rem;
    font-size: 2rem;
    color: #333;
    text-align: center;
  }

  .warning {
    background: #fff3cd;
    border: 2px solid #ffc107;
    border-radius: 0.5rem;
    padding: 1rem;
    margin-bottom: 1.5rem;
    color: #856404;
    text-align: center;
    font-weight: 600;
  }

  .difficulty-selector {
    margin-bottom: 2rem;
  }

  .difficulty-selector label {
    display: block;
    font-weight: 600;
    margin-bottom: 0.5rem;
    color: #333;
    text-align: center;
    font-size: 1.125rem;
  }

  .difficulty-selector input[type="range"] {
    width: 100%;
    height: 8px;
    border-radius: 4px;
    background: linear-gradient(to right, #f44336 0%, #ffeb3b 50%, #4caf50 100%);
    outline: none;
    -webkit-appearance: none;
  }

  .difficulty-selector input[type="range"]::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 24px;
    height: 24px;
    border-radius: 50%;
    background: #2196f3;
    cursor: pointer;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
  }

  .difficulty-selector input[type="range"]::-moz-range-thumb {
    width: 24px;
    height: 24px;
    border-radius: 50%;
    background: #2196f3;
    cursor: pointer;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
    border: none;
  }

  .difficulty-labels {
    display: flex;
    justify-content: space-between;
    margin-top: 0.5rem;
    font-size: 0.875rem;
    color: #666;
  }

  .modal-actions {
    display: flex;
    gap: 1rem;
    justify-content: center;
    flex-wrap: wrap;
  }

  .btn {
    padding: 0.75rem 2rem;
    border: none;
    border-radius: 0.5rem;
    font-size: 1rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
  }

  .btn-primary {
    background: #2196f3;
    color: white;
  }

  .btn-primary:hover {
    background: #1976d2;
  }

  .btn-secondary {
    background: #e0e0e0;
    color: #333;
  }

  .btn-secondary:hover {
    background: #bdbdbd;
  }

  @media (max-width: 480px) {
    .modal {
      padding: 1.5rem;
    }

    h2 {
      font-size: 1.5rem;
    }

    .btn {
      width: 100%;
    }
  }
</style>
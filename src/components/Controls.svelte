<script lang="ts">
  import { session, isLoading } from '../lib/stores/gameStore';
  import { gameStore } from '../lib/stores/gameStore';
  import type { DifficultyLevel } from '../lib/models/types';

  let selectedDifficulty: DifficultyLevel = 5;

  function handleNewGame(): void {
    gameStore.newGame(selectedDifficulty);
  }

  function handlePause(): void {
    if ($session?.isPaused) {
      gameStore.resumeGame();
    } else {
      gameStore.pauseGame();
    }
  }

  function handleToggleCandidates(): void {
    gameStore.toggleCandidates();
  }
</script>

<div class="controls">
  <div class="difficulty-selector">
    <label for="difficulty">Difficulty:</label>
    <input
      id="difficulty"
      type="range"
      min="1"
      max="10"
      bind:value={selectedDifficulty}
      disabled={$isLoading}
    />
    <span class="difficulty-value">{selectedDifficulty}</span>
  </div>

  <div class="buttons">
    <button
      type="button"
      class="btn btn-primary"
      on:click={handleNewGame}
      disabled={$isLoading}
    >
      {$isLoading ? 'Generating...' : 'New Game'}
    </button>

    {#if $session}
      <button
        type="button"
        class="btn"
        on:click={handlePause}
        disabled={$session.isCompleted}
      >
        {$session.isPaused ? 'Resume' : 'Pause'}
      </button>

      <button
        type="button"
        class="btn"
        on:click={handleToggleCandidates}
        class:active={$session.showAutoCandidates}
      >
        {$session.showAutoCandidates ? 'Hide' : 'Show'} Candidates
      </button>
    {/if}
  </div>
</div>

<style>
  .controls {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
    padding: 1rem;
    max-width: 600px;
    margin: 0 auto;
  }

  .difficulty-selector {
    display: flex;
    align-items: center;
    gap: 1rem;
  }

  .difficulty-selector label {
    font-weight: 600;
    color: #333;
  }

  .difficulty-selector input[type="range"] {
    flex: 1;
    min-width: 150px;
  }

  .difficulty-value {
    font-weight: 700;
    color: #2196f3;
    min-width: 2ch;
    text-align: center;
  }

  .buttons {
    display: flex;
    gap: 0.75rem;
    flex-wrap: wrap;
    justify-content: center;
  }

  .btn {
    padding: 0.75rem 1.5rem;
    border: 2px solid #ccc;
    background: white;
    color: #333;
    font-size: 1rem;
    font-weight: 600;
    border-radius: 0.5rem;
    cursor: pointer;
    transition: all 0.2s;
  }

  .btn:hover:not(:disabled) {
    background-color: #f5f5f5;
    border-color: #999;
  }

  .btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .btn-primary {
    background-color: #2196f3;
    color: white;
    border-color: #2196f3;
  }

  .btn-primary:hover:not(:disabled) {
    background-color: #1976d2;
    border-color: #1976d2;
  }

  .btn.active {
    background-color: #4caf50;
    color: white;
    border-color: #4caf50;
  }

  .btn.active:hover:not(:disabled) {
    background-color: #388e3c;
    border-color: #388e3c;
  }
</style>

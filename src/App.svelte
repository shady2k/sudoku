<script lang="ts">
  import SudokuGrid from './components/SudokuGrid.svelte';
  import Timer from './components/Timer.svelte';
  import Statistics from './components/Statistics.svelte';
  import Controls from './components/Controls.svelte';
  import ResumeModal from './components/ResumeModal.svelte';
  import { gameStore } from './lib/stores/gameStore.svelte';
  import { onMount } from 'svelte';
  import { hasSavedGame } from './lib/services/StorageService';
  import type { DifficultyLevel } from './lib/models/types';

  // State for resume modal (T066: Resume or New Game modal)
  let showResumeModal = $state(false);

  onMount(async () => {
    // T065: Check if there's a saved game
    const hasGame = hasSavedGame();

    if (hasGame) {
      // Show modal with Resume or New Game options (FR-004)
      showResumeModal = true;
    } else {
      // No saved game, start with a medium difficulty game (50% difficulty)
      await gameStore.newGame(50);
    }
  });

  async function handleResume() {
    showResumeModal = false;
    await gameStore.loadSavedGame();
  }

  async function handleNewGameFromResume(difficulty: DifficultyLevel) {
    showResumeModal = false;
    await gameStore.newGame(difficulty);
  }

  // Global keyboard shortcuts (FR-007)
  function handleGlobalKeyboard(event: KeyboardEvent): void {
    // Don't interfere with input elements
    if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
      return;
    }

    // Don't handle if modal is open
    if (showResumeModal) return;

    // 'C' or 'c' - Toggle candidates
    if (event.key === 'c' || event.key === 'C') {
      if (gameStore.session && !gameStore.session.isCompleted) {
        gameStore.toggleCandidates();
        event.preventDefault();
      }
    }

    // Space - Pause/Resume
    if (event.key === ' ') {
      if (gameStore.session && !gameStore.session.isCompleted) {
        if (gameStore.session.isPaused) {
          gameStore.resumeGame();
        } else {
          gameStore.pauseGame();
        }
        event.preventDefault();
      }
    }

    // 'Z' or 'z' - Undo (if implemented)
    if (event.key === 'z' || event.key === 'Z') {
      // Undo functionality not yet implemented (Phase 11)
      // This is a placeholder for future implementation
    }
  }
</script>

<svelte:window on:keydown={handleGlobalKeyboard} />

<main class:hidden={showResumeModal}>
  <header>
    <h1>Sudoku</h1>
    <p class="subtitle">Offline Puzzle Game</p>
  </header>

  <div class="game-container">
    <!-- T080b: Desktop layout with grid on left and number pad on right -->
    <div class="game-layout">
      <SudokuGrid />
      <div class="right-panel">
        <!-- Compact stats row inspired by reference -->
        <div class="stats-row">
          <div class="stat-item">
            <div class="stat-label">
              {#if gameStore.session?.isPaused}⏸{/if} Time
            </div>
            <div class="stat-value">{gameStore.formattedTime}</div>
          </div>
          {#if gameStore.session}
            <div class="stat-item">
              <div class="stat-label">Difficulty</div>
              <div class="stat-value">{gameStore.session.difficultyLevel}%</div>
            </div>
            <div class="stat-item">
              <div class="stat-label">Errors</div>
              <div class="stat-value" class:error={gameStore.session.errorCount > 0}>
                {gameStore.session.errorCount}
              </div>
            </div>
          {/if}
        </div>
        <Controls />
      </div>
    </div>

    {#if gameStore.error}
      <div class="error-message">
        <p>⚠️ {gameStore.error}</p>
      </div>
    {/if}
  </div>

  <footer>
    <p>Use arrow keys to navigate • Number keys (1-9) to fill • Backspace to clear</p>
  </footer>
</main>

<!-- T066: Resume or New Game modal (FR-004) -->
<ResumeModal
  bind:isOpen={showResumeModal}
  onResume={handleResume}
  onNewGame={handleNewGameFromResume}
/>

<style>
  main {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  }

  main.hidden {
    visibility: hidden;
  }

  header {
    text-align: center;
    padding: 2rem 1rem 1rem;
    color: white;
  }

  h1 {
    font-size: 3rem;
    font-weight: 800;
    margin: 0;
    text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.2);
  }

  .subtitle {
    font-size: 1.125rem;
    margin: 0.5rem 0 0;
    opacity: 0.9;
  }

  .game-container {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
    padding: 1.5rem 1rem;
    background: white;
    border-radius: 1.5rem 1.5rem 0 0;
    box-shadow: 0 -8px 24px rgba(0, 0, 0, 0.08);
  }

  /* T080b: Game layout wrapper for grid + number pad positioning */
  .game-layout {
    display: flex;
    flex-direction: column;
    gap: 2rem;
    align-items: center;
  }

  .right-panel {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    width: 100%;
    max-width: 400px;
  }

  /* Modern stats row with card design */
  .stats-row {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 0.625rem;
    padding: 0;
    max-width: 340px;
  }

  .stat-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.125rem;
    padding: 0.5rem 0.375rem;
    background: #f8f9fa;
    border-radius: 0.5rem;
    border: 2px solid #e9ecef;
    transition: all 0.2s ease;
  }

  .stat-item:hover {
    border-color: #dee2e6;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  }

  .stat-label {
    font-size: 0.6875rem;
    color: #7f8c8d;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    font-weight: 600;
    order: -1;
  }

  .stat-value {
    font-size: 1.375rem;
    font-weight: 800;
    color: #2c3e50;
    font-variant-numeric: tabular-nums;
    line-height: 1.1;
  }

  .stat-value.error {
    color: #e74c3c;
  }

  .error-message {
    background-color: #ffebee;
    border: 2px solid #d32f2f;
    border-radius: 0.5rem;
    padding: 1rem;
    text-align: center;
    color: #d32f2f;
    font-weight: 600;
  }

  .error-message p {
    margin: 0;
  }

  footer {
    padding: 1.5rem;
    text-align: center;
    color: white;
    font-size: 0.875rem;
    opacity: 0.9;
  }

  footer p {
    margin: 0;
  }

  @media (min-width: 768px) {
    .game-container {
      max-width: 1200px;
      margin: 0 auto;
      width: 100%;
      padding: 2rem;
    }

    /* T080b: Position grid on left and number pad on right on desktop (≥768px) per FR-020 */
    .game-layout {
      display: grid;
      grid-template-columns: auto auto;
      gap: 2.5rem;
      align-items: start;
      justify-content: center;
    }

    .right-panel {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      /* Match the grid's height using flex */
      height: 100%;
      justify-content: space-between;
    }
  }

  @media (min-width: 1024px) {
    .game-layout {
      gap: 3rem;
    }
  }
</style>

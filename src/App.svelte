<script lang="ts">
  import SudokuGrid from './components/SudokuGrid.svelte';
  import Timer from './components/Timer.svelte';
  import Statistics from './components/Statistics.svelte';
  import Controls from './components/Controls.svelte';
  import { error } from './lib/stores/gameStore';
  import { gameStore } from './lib/stores/gameStore';
  import { onMount } from 'svelte';

  onMount(() => {
    // Start with a medium difficulty game
    gameStore.newGame(5);
  });
</script>

<main>
  <header>
    <h1>Sudoku</h1>
    <p class="subtitle">Offline Puzzle Game</p>
  </header>

  <div class="game-container">
    <div class="stats-section">
      <Timer />
      <Statistics />
    </div>

    <SudokuGrid />

    <Controls />

    {#if $error}
      <div class="error-message">
        <p>⚠️ {$error}</p>
      </div>
    {/if}
  </div>

  <footer>
    <p>Use arrow keys to navigate • Number keys (1-9) to fill • Backspace to clear</p>
  </footer>
</main>

<style>
  main {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
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
    padding: 1rem;
    background: white;
    border-radius: 1rem 1rem 0 0;
    box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.1);
  }

  .stats-section {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    align-items: center;
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
      max-width: 800px;
      margin: 0 auto;
      width: 100%;
    }

    .stats-section {
      flex-direction: row;
      justify-content: space-around;
    }
  }
</style>

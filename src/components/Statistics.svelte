<script lang="ts">
  import { gameStore } from '../lib/stores/gameStore.svelte';
</script>

{#if gameStore.session}
  <div class="stats">
    <div class="stat">
      <span class="label">Difficulty:</span>
      <span class="value">{gameStore.session.difficultyLevel}%</span>
    </div>
    <div class="stat">
      <span class="label">Mistakes:</span>
      <span class="value" class:has-mistakes={gameStore.session.mistakeCount > 0}>
        {gameStore.session.mistakeCount}
      </span>
    </div>
    {#if gameStore.session.isCompleted}
      <div class="stat completed">
        <span class="label">🎉 Completed!</span>
      </div>
    {/if}
  </div>
{/if}

<style>
  .stats {
    display: flex;
    gap: 1.5rem;
    justify-content: center;
    align-items: center;
    flex-wrap: wrap;
  }

  .stat {
    display: flex;
    align-items: baseline;
    gap: 0.5rem;
  }

  .label {
    font-size: 0.75rem;
    color: #666;
    font-weight: 600;
  }

  .value {
    font-size: 1rem;
    font-weight: 700;
    color: #333;
  }

  .value.has-mistakes {
    color: #d32f2f;
  }

  .stat.completed {
    color: #4caf50;
    font-weight: 700;
  }
</style>

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
      <span class="label">Errors:</span>
      <span class="value" class:has-errors={gameStore.session.errorCount > 0}>
        {gameStore.session.errorCount}
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
    gap: 2rem;
    justify-content: center;
    flex-wrap: wrap;
  }

  .stat {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.25rem;
  }

  .label {
    font-size: 0.875rem;
    color: #666;
    font-weight: 500;
  }

  .value {
    font-size: 1.5rem;
    font-weight: 700;
    color: #333;
  }

  .value.has-errors {
    color: #d32f2f;
  }

  .stat.completed {
    color: #4caf50;
    font-weight: 700;
  }
</style>

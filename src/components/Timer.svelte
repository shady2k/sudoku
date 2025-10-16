<script lang="ts">
  import { gameStore } from '../lib/stores/gameStore.svelte';
  import { onMount, onDestroy } from 'svelte';

  let intervalId: ReturnType<typeof setInterval> | null = null;

  onMount(() => {
    intervalId = setInterval(() => {
      gameStore.updateTime();
    }, 100);
  });

  onDestroy(() => {
    if (intervalId) {
      clearInterval(intervalId);
    }
  });
</script>

<div class="timer">
  <div class="time-display">
    {#if gameStore.session?.isPaused}
      <span class="pause-icon">⏸</span>
    {/if}
    {gameStore.formattedTime}
  </div>
</div>

<style>
  .timer {
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  .time-display {
    font-size: 1.75rem;
    font-weight: 700;
    font-variant-numeric: tabular-nums;
    color: #333;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .pause-icon {
    color: #ff9800;
    font-size: 1.5rem;
  }
</style>

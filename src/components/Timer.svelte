<script lang="ts">
  import { gameStore } from '../lib/stores/gameStore.svelte';
  import { onMount, onDestroy } from 'svelte';

  let intervalId: ReturnType<typeof setInterval> | null = null;

  // Derived: Check if pause was due to idle (auto-pause)
  let isIdlePause = $derived(
    gameStore.session?.isAutoPaused === true
  );

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
  {#if isIdlePause}
    <div class="idle-indicator">Paused (idle)</div>
  {/if}
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

  .idle-indicator {
    font-size: 0.875rem;
    color: #ff9800;
    font-weight: 500;
    margin-top: 0.25rem;
    text-align: center;
  }
</style>

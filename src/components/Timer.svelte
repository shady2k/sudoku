<script lang="ts">
  import { session, formattedTime } from '../lib/stores/gameStore';
  import { gameStore } from '../lib/stores/gameStore';
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
  <div class="time-display">{$formattedTime}</div>
  {#if $session?.isPaused}
    <div class="paused-indicator">⏸ Paused</div>
  {/if}
</div>

<style>
  .timer {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.5rem;
  }

  .time-display {
    font-size: 2rem;
    font-weight: 700;
    font-variant-numeric: tabular-nums;
    color: #333;
  }

  .paused-indicator {
    font-size: 0.875rem;
    color: #ff9800;
    font-weight: 600;
  }
</style>

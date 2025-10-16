<script lang="ts">
  import type { Cell as CellType } from '../lib/models/types';
  import CandidateNumbers from '../lib/components/CandidateNumbers.svelte';
  import { gameStore } from '../lib/stores/gameStore.svelte.ts';

  interface Props {
    cell: CellType;
    isSelected: boolean;
    isRelated: boolean;
    onSelect: () => void;
  }

  let { cell, isSelected, isRelated, onSelect }: Props = $props();

  // Touch event handling for mobile devices (T079)
  function handleTouchEnd(event: TouchEvent): void {
    // Prevent default to avoid double-triggering with click event
    event.preventDefault();
    onSelect();
  }

  // Check if candidates should be shown (global setting from gameStore)
  const showCandidates = $derived(gameStore.session?.showAutoCandidates ?? false);
</script>

<button
  type="button"
  class="cell"
  class:clue={cell.isClue}
  class:selected={isSelected}
  class:related={isRelated}
  class:error={cell.isError}
  onclick={onSelect}
  ontouchend={handleTouchEnd}
  data-row={cell.row}
  data-col={cell.col}
  style="min-width: 44px; min-height: 44px;"
>
  {#if cell.value !== 0}
    <span class="value">{cell.value}</span>
  {:else}
    <CandidateNumbers {cell} showAutoCandidates={showCandidates} />
  {/if}
</button>

<style>
  .cell {
    width: 100%;
    height: 100%;
    min-width: 44px;
    min-height: 44px;
    border: 1px solid #ccc;
    background: white;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    font-size: 1.5rem;
    font-weight: 500;
    padding: 0;
    transition: background-color 0.1s, border-color 0.1s;
    touch-action: manipulation; /* Prevents double-tap zoom on mobile */
    -webkit-tap-highlight-color: transparent; /* Removes tap highlight on iOS */
  }

  .cell:hover:not(.clue) {
    background-color: #f0f0f0;
  }

  .cell:focus {
    outline: none;
  }

  .cell:focus-visible {
    outline: none;
  }

  .cell.clue {
    background-color: #f5f5f5;
    font-weight: 700;
    cursor: default;
  }

  .cell.selected {
    background-color: #bbdefb;
    border-color: #2196f3;
    border-width: 2px;
  }

  .cell.related {
    background-color: #e3f2fd;
  }

  .cell.error {
    background-color: #fee2e2;
    color: #dc2626;
    position: relative;
    animation: shake 0.5s ease-in-out;
  }

  .cell.error::before {
    content: '';
    position: absolute;
    inset: 0;
    background: radial-gradient(circle, rgba(220, 38, 38, 0.1) 0%, transparent 70%);
    animation: pulse-red 1s ease-in-out;
  }

  @keyframes shake {
    0%, 100% {
      transform: translateX(0);
    }
    10%, 30%, 50%, 70%, 90% {
      transform: translateX(-2px);
    }
    20%, 40%, 60%, 80% {
      transform: translateX(2px);
    }
  }

  @keyframes pulse-red {
    0% {
      opacity: 0;
      transform: scale(0.8);
    }
    50% {
      opacity: 1;
      transform: scale(1.1);
    }
    100% {
      opacity: 0;
      transform: scale(1.2);
    }
  }

  .value {
    font-size: 2rem;
  }
</style>

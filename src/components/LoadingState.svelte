<script lang="ts">
  /**
   * Loading State Component
   *
   * Displays an animated 3×3 mini Sudoku grid that fills progressively
   * while a puzzle is being generated. Shows for minimum 1 second.
   */

  import { onMount } from 'svelte';
  import { fade } from 'svelte/transition';

  // Sample numbers that will fill the mini grid in a pattern
  const miniGridNumbers = [
    [5, 8, 2],
    [3, 1, 7],
    [9, 4, 6]
  ];

  // Fill pattern: center first, then corners, then edges
  const fillSequence = [
    { row: 1, col: 1 }, // center (1)
    { row: 0, col: 0 }, // top-left (5)
    { row: 0, col: 2 }, // top-right (2)
    { row: 2, col: 0 }, // bottom-left (9)
    { row: 2, col: 2 }, // bottom-right (6)
    { row: 0, col: 1 }, // top-middle (8)
    { row: 1, col: 0 }, // middle-left (3)
    { row: 1, col: 2 }, // middle-right (7)
    { row: 2, col: 1 }, // bottom-middle (4)
  ];

  let visibleCells = $state<Set<string>>(new Set());
  let _animationCycle = 0;

  onMount(() => {
    let currentIndex = 0;
    const intervalId = setInterval(() => {
      // Add next cell in sequence
      if (currentIndex < fillSequence.length) {
        const cell = fillSequence[currentIndex];
        if (cell) {
          visibleCells.add(`${cell.row}-${cell.col}`);
          visibleCells = new Set(visibleCells); // Trigger reactivity
          currentIndex++;
        }
      } else {
        // Reset and start over
        visibleCells = new Set();
        currentIndex = 0;
        _animationCycle++;
      }
    }, 150); // Each cell appears every 150ms

    return (): void => {
      clearInterval(intervalId);
    };
  });

  function isCellVisible(row: number, col: number): boolean {
    return visibleCells.has(`${row}-${col}`);
  }
</script>

<div class="loading-state" transition:fade={{ duration: 300 }}>
  <div class="mini-grid" role="status" aria-live="polite" aria-busy="true">
    {#each miniGridNumbers as row, rowIndex}
      <div class="mini-row">
        {#each row as num, colIndex}
          <div
            class="mini-cell"
            class:visible={isCellVisible(rowIndex, colIndex)}
          >
            {#if isCellVisible(rowIndex, colIndex)}
              <span class="mini-number">{num}</span>
            {/if}
          </div>
        {/each}
      </div>
    {/each}
  </div>

  <div class="loading-text">
    <span class="sr-only">Generating puzzle. Please wait.</span>
    <span aria-hidden="true">Generating puzzle<span class="ellipsis">...</span></span>
  </div>
</div>

<style>
  .loading-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 1.5rem;
    padding: 2rem;
  }

  .mini-grid {
    display: flex;
    flex-direction: column;
    gap: 2px;
    background: #cbd5e1;
    border: 3px solid #475569;
    border-radius: 0.5rem;
    padding: 2px;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
  }

  .mini-row {
    display: flex;
    gap: 2px;
  }

  .mini-cell {
    width: 40px;
    height: 40px;
    background: white;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 20px;
    font-weight: 700;
    color: #1e293b;
    border-radius: 2px;
    position: relative;
    overflow: hidden;
  }

  .mini-cell.visible .mini-number {
    animation: fillCell 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55) forwards;
  }

  @keyframes fillCell {
    0% {
      opacity: 0;
      transform: scale(0.5);
    }
    100% {
      opacity: 1;
      transform: scale(1);
    }
  }

  .loading-text {
    font-size: 1rem;
    color: #64748b;
    font-weight: 500;
    text-align: center;
  }

  .ellipsis {
    display: inline-block;
    animation: pulse 1.5s ease-in-out infinite;
  }

  @keyframes pulse {
    0%, 100% {
      opacity: 1;
    }
    50% {
      opacity: 0.3;
    }
  }

  /* Screen reader only text */
  .sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border-width: 0;
  }

  /* Reduced motion support */
  @media (prefers-reduced-motion: reduce) {
    .mini-cell.visible .mini-number {
      animation: none;
      opacity: 1;
      transform: scale(1);
    }

    .ellipsis {
      animation: none;
      opacity: 1;
    }
  }

  /* Responsive sizing */
  @media (max-width: 480px) {
    .mini-cell {
      width: 32px;
      height: 32px;
      font-size: 16px;
    }
  }
</style>

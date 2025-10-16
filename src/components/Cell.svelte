<script lang="ts">
  import type { Cell as CellType } from '../lib/models/types';

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
  {:else if cell.manualCandidates.size > 0 || cell.autoCandidates}
    <div class="candidates">
      {#each Array.from({ length: 9 }, (_, i) => i + 1) as num}
        {#if cell.manualCandidates.has(num) || cell.autoCandidates?.has(num)}
          <span class="candidate" class:manual={cell.manualCandidates.has(num)}>
            {num}
          </span>
        {:else}
          <span class="candidate empty"></span>
        {/if}
      {/each}
    </div>
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
    background-color: #ffebee;
    color: #d32f2f;
  }

  .value {
    font-size: 1.5rem;
  }

  .candidates {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    grid-template-rows: repeat(3, 1fr);
    gap: 1px;
    width: 100%;
    height: 100%;
    padding: 2px;
  }

  .candidate {
    font-size: 0.6rem;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #666;
  }

  .candidate.manual {
    color: #2196f3;
    font-weight: 600;
  }

  .candidate.empty {
    visibility: hidden;
  }
</style>

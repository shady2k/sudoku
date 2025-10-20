<!--
  CandidateNumbers Component

  Displays manual and auto-generated candidate numbers for a Sudoku cell.
  Shows manual candidates (user pencil marks) and auto-candidates (system-generated).
-->

<script lang="ts">
  import type { Cell } from '../models/types';
  import { gameStore } from '../stores/gameStore.svelte.ts';

  export interface Props {
    /** The cell to display candidates for */
    cell: Cell;
  }

  const { cell }: Props = $props();

  // Compute candidates reactively
  const manualCandidates = $derived(Array.from(cell.manualCandidates).sort());
  const autoCandidates = $derived(
    cell.autoCandidates ? Array.from(cell.autoCandidates).sort() : []
  );

  // Show auto candidates when enabled in session
  const showAutoCandidates = $derived(
    gameStore.session?.showAutoCandidates && autoCandidates.length > 0
  );

  // Combined candidates for display (union of manual and auto)
  const displayCandidates = $derived.by(() => {
    if (manualCandidates.length > 0 && showAutoCandidates) {
      // Show union of both (all unique candidates)
      const combined = new Set([...manualCandidates, ...autoCandidates]);
      return Array.from(combined).sort();
    } else if (manualCandidates.length > 0) {
      // Only manual candidates
      return manualCandidates;
    } else if (showAutoCandidates) {
      // Only auto candidates
      return autoCandidates;
    }
    return [];
  });

  const hasCandidates = $derived(displayCandidates.length > 0);
  const isEmpty = $derived(cell.value === 0 && !cell.isClue);

  // Helper to check if a candidate is manual (for styling)
  const isManualCandidate = (num: number): boolean => {
    return manualCandidates.includes(num);
  };
</script>

{#if isEmpty}
  <div class="candidates-container" data-testid="candidates-container" aria-label="Candidate numbers: {displayCandidates.join(', ')}">
    {#if hasCandidates}
      <div class="candidates-grid">
        <!-- Row 1 -->
        {#each [1, 2, 3] as num}
          {#if displayCandidates.includes(num)}
            <span
              class="candidate-number"
              class:manual-candidate={isManualCandidate(num)}
              class:auto-candidate={!isManualCandidate(num)}
              data-testid={`candidate-${num}`}
              aria-label={`Candidate number ${num}`}
            >
              {num}
            </span>
          {:else}
            <span class="candidate-number empty"></span>
          {/if}
        {/each}
        <!-- Row 2 -->
        {#each [4, 5, 6] as num}
          {#if displayCandidates.includes(num)}
            <span
              class="candidate-number"
              class:manual-candidate={isManualCandidate(num)}
              class:auto-candidate={!isManualCandidate(num)}
              data-testid={`candidate-${num}`}
              aria-label={`Candidate number ${num}`}
            >
              {num}
            </span>
          {:else}
            <span class="candidate-number empty"></span>
          {/if}
        {/each}
        <!-- Row 3 -->
        {#each [7, 8, 9] as num}
          {#if displayCandidates.includes(num)}
            <span
              class="candidate-number"
              class:manual-candidate={isManualCandidate(num)}
              class:auto-candidate={!isManualCandidate(num)}
              data-testid={`candidate-${num}`}
              aria-label={`Candidate number ${num}`}
            >
              {num}
            </span>
          {:else}
            <span class="candidate-number empty"></span>
          {/if}
        {/each}
      </div>
    {/if}
  </div>
{/if}

<style>
  .candidates-container {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    pointer-events: none;
  }

  .candidates-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    grid-template-rows: repeat(3, 1fr);
    gap: 2px;
    width: 100%;
    height: 100%;
    padding: 2px;
  }

  .candidate-number {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 100%;
    font-size: 0.85rem;
    line-height: 1;
    font-weight: 400;
    user-select: none;
    cursor: default;
    box-sizing: border-box;
    letter-spacing: 0;
    text-align: center;
    transition: opacity 0.2s ease;
  }

  .candidate-number.empty {
    visibility: hidden;
  }

  /* Manual candidates - darker and bolder */
  .candidate-number.manual-candidate {
    color: #000;
    font-weight: 600;
  }

  /* Auto candidates - lighter and grayed out */
  .candidate-number.auto-candidate {
    color: #999;
    font-weight: 400;
  }

  /* Mobile responsive - ensure touch targets */
  @media (max-width: 768px) {
    .candidate-number {
      font-size: 0.85rem;
    }
  }
</style>
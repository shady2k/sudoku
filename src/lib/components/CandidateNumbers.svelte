<!--
  CandidateNumbers Component

  Displays manual and auto-generated candidate numbers for a Sudoku cell.
  Shows manual candidates (user pencil marks) and auto-candidates (system-generated).
-->

<script lang="ts">
  import type { Cell } from '../models/types';

  export interface Props {
    /** The cell to display candidates for */
    cell: Cell;
    /** Whether auto-candidates should be shown (global setting) */
    showAutoCandidates: boolean;
  }

  const { cell, showAutoCandidates }: Props = $props();

  // Compute candidates reactively
  const manualCandidates = $derived(cell.manualCandidates);
  const autoCandidates = $derived(
    showAutoCandidates && cell.autoCandidates
      ? Array.from(cell.autoCandidates)
      : []
  );
  const allCandidates = $derived([...new Set([...Array.from(manualCandidates), ...autoCandidates])].sort());
  const hasCandidates = $derived(allCandidates.length > 0);
  const isEmpty = $derived(cell.value === 0 && !cell.isClue);
</script>

{#if isEmpty}
  <div class="candidates-container" data-testid="candidates-container" aria-label="Candidate numbers: {allCandidates.join(', ')}">
    {#if hasCandidates}
      <div class="candidates-grid">
        <!-- Row 1 -->
        {#each [1, 2, 3] as num}
          {#if allCandidates.includes(num)}
            <span
              class="candidate-number"
              class:auto-candidate={autoCandidates.includes(num)}
              class:manual-candidate={manualCandidates.has(num)}
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
          {#if allCandidates.includes(num)}
            <span
              class="candidate-number"
              class:auto-candidate={autoCandidates.includes(num)}
              class:manual-candidate={manualCandidates.has(num)}
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
          {#if allCandidates.includes(num)}
            <span
              class="candidate-number"
              class:auto-candidate={autoCandidates.includes(num)}
              class:manual-candidate={manualCandidates.has(num)}
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

  /* Manual candidates (user pencil marks) */
  .candidate-number.manual-candidate {
    color: #000;
    font-weight: 500;
  }

  /* Auto-generated candidates (system-generated) */
  .candidate-number.auto-candidate {
    color: #000;
    font-weight: 400;
    opacity: 0.9;
  }

  /* When a number is both manual and auto (shouldn't happen, but handle gracefully) */
  .candidate-number.manual-candidate.auto-candidate {
    color: #000;
    font-weight: 500;
  }

  /* Mobile responsive - ensure touch targets */
  @media (max-width: 768px) {
    .candidate-number {
      font-size: 0.85rem;
    }
  }
</style>
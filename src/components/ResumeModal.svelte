<script lang="ts">
  /**
   * Resume Modal Component
   *
   * T066: Resume or New Game modal per FR-004
   * Shows when returning to a saved game with options to:
   * - Resume existing game
   * - Start a new game (with difficulty selection)
   */

  import { onMount } from 'svelte';
  import type { DifficultyLevel } from '../lib/models/types';
  import { loadPreferences } from '../lib/services/StorageService';
  import LoadingState from './LoadingState.svelte';

  // Skip loading delay in test environment
  // Check for both Vitest (unit tests) and Playwright (E2E tests)
  const isTestEnv = import.meta.env.MODE === 'test' ||
                    (typeof window !== 'undefined' &&
                     ((window as { __VITEST__?: boolean }).__VITEST__ ||
                      (window as { __PLAYWRIGHT__?: boolean }).__PLAYWRIGHT__ ||
                      navigator.webdriver));

  interface Props {
    isOpen: boolean;
    onResume?: () => void;
    onNewGame: (difficulty: DifficultyLevel) => void;
    showResumeOption?: boolean;
  }

  let {
    isOpen = $bindable(false),
    onResume,
    onNewGame,
    showResumeOption = true
  }: Props = $props();

  let showDifficultySelector = $state(false);
  let showLoadingState = $state(false);
  let puzzleReady = $state(false);
  let selectedDifficulty: DifficultyLevel = $state(50); // 50% = medium (default)

  // Load saved difficulty preference on mount
  onMount(async () => {
    const preferences = await loadPreferences();
    selectedDifficulty = preferences.defaultDifficulty;
  });

  // Auto-show difficulty selector for new game modal
  $effect(() => {
    if (!showResumeOption) {
      // For new game modal, always show difficulty selector directly
      showDifficultySelector = true;
    }
  });

  function handleResumeClick(): void {
    if (onResume) {
      onResume();
    }
    isOpen = false;
  }

  function handleShowNewGame(): void {
    showDifficultySelector = true;
  }

  async function handleStartNewGame(): Promise<void> {
    // Show loading state first
    showLoadingState = true;
    puzzleReady = false;

    // Give browser time to render the animation by yielding to event loop
    // This allows the loading state to appear and animate smoothly
    // Skip this in test environment for faster tests
    if (!isTestEnv) {
      await new Promise(resolve => requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setTimeout(resolve, 0);
        });
      }));
    }

    const startTime = Date.now();

    // NOW start puzzle generation (after animation is rendering)
    const puzzlePromise = onNewGame(selectedDifficulty);

    // Wait for minimum 1 second total (skip in tests)
    const minDelay = isTestEnv ? 0 : 1000;
    const minTimePromise = new Promise(resolve => setTimeout(resolve, minDelay));

    // Wait for both to complete
    await Promise.all([puzzlePromise, minTimePromise]);

    // Ensure at least minimum time has elapsed (skip in tests)
    if (!isTestEnv) {
      const elapsed = Date.now() - startTime;
      if (elapsed < 1000) {
        await new Promise(resolve => setTimeout(resolve, 1000 - elapsed));
      }
    }

    // Announce puzzle is ready for screen readers
    puzzleReady = true;

    // Small delay to allow screen reader announcement (skip in tests)
    if (!isTestEnv) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    // Hide loading and close modal
    showLoadingState = false;
    isOpen = false;
    showDifficultySelector = false;
    puzzleReady = false;
  }

  function handleBack(): void {
    showDifficultySelector = false;
  }

  // Handle Escape key
  function handleKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      if (showDifficultySelector) {
        handleBack();
      }
    }
  }
</script>

<svelte:window on:keydown={handleKeydown} />

{#if isOpen}
  <div class="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="modal-title">
    <div class="modal" role="document">
      {#if showLoadingState}
        <!-- Loading state while generating puzzle -->
        <LoadingState />

        <!-- Screen reader announcement when puzzle is ready -->
        {#if puzzleReady}
          <div role="status" aria-live="polite" class="sr-only">
            Puzzle generated. Game ready.
          </div>
        {/if}
      {:else if showResumeOption}
        {#if !showDifficultySelector}
          <h2 id="modal-title">Welcome Back!</h2>
          <p class="info">You have a game in progress. Would you like to continue?</p>

          <div class="modal-actions">
            <button
              type="button"
              class="btn btn-primary"
              onclick={handleResumeClick}
            >
              Resume Game
            </button>

            <button
              type="button"
              class="btn btn-secondary"
              onclick={handleShowNewGame}
            >
              Start New Game
            </button>
          </div>
        {:else}
          <h2 id="modal-title">New Game</h2>
          <p class="warning">⚠️ Starting a new game will replace your saved progress.</p>

          <div class="difficulty-selector">
            <label for="resume-difficulty">Difficulty: {selectedDifficulty}%</label>
            <input
              id="resume-difficulty"
              type="range"
              min="0"
              max="100"
              bind:value={selectedDifficulty}
            />
            <div class="difficulty-labels">
              <span class="label-left">Easiest (0%)</span>
              <span class="label-right">Hardest (100%)</span>
            </div>
          </div>

          <div class="modal-actions">
            <button
              type="button"
              class="btn btn-primary"
              onclick={handleStartNewGame}
            >
              Start New Game
            </button>

            <button
              type="button"
              class="btn btn-secondary"
              onclick={handleBack}
            >
              Back
            </button>
          </div>
        {/if}
      {:else}
        <!-- New Game modal - always show difficulty selector directly -->
        <h2 id="modal-title">New Game</h2>
        <p class="info">Select your preferred difficulty level.</p>

        <div class="difficulty-selector">
          <label for="new-game-difficulty">Difficulty: {selectedDifficulty}%</label>
          <input
            id="new-game-difficulty"
            type="range"
            min="0"
            max="100"
            bind:value={selectedDifficulty}
          />
          <div class="difficulty-labels">
            <span class="label-left">Easiest (0%)</span>
            <span class="label-right">Hardest (100%)</span>
          </div>
        </div>

        <div class="modal-actions">
          <button
            type="button"
            class="btn btn-primary"
            onclick={handleStartNewGame}
          >
            Start New Game
          </button>
        </div>
      {/if}
    </div>
  </div>
{/if}

<style>
  .modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    padding: 1rem;
  }

  .modal {
    background: white;
    border-radius: 1rem;
    padding: 2rem;
    max-width: 500px;
    width: 100%;
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
  }

  h2 {
    margin: 0 0 1rem;
    font-size: 2rem;
    color: #333;
    text-align: center;
  }

  .info {
    text-align: center;
    color: #666;
    margin-bottom: 2rem;
    font-size: 1.125rem;
  }

  .warning {
    background: #fff3cd;
    border: 2px solid #ffc107;
    border-radius: 0.5rem;
    padding: 1rem;
    margin-bottom: 1.5rem;
    color: #856404;
    text-align: center;
    font-weight: 600;
  }

  .difficulty-selector {
    margin-bottom: 2rem;
  }

  .difficulty-selector label {
    display: block;
    font-weight: 600;
    margin-bottom: 0.5rem;
    color: #333;
    text-align: center;
    font-size: 1.125rem;
  }

  .difficulty-selector input[type="range"] {
    width: 100%;
    height: 8px;
    border-radius: 4px;
    background: linear-gradient(to right, #4caf50 0%, #ffeb3b 50%, #f44336 100%);
    outline: none;
    -webkit-appearance: none;
  }

  .difficulty-selector input[type="range"]::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 24px;
    height: 24px;
    border-radius: 50%;
    background: #2196f3;
    cursor: pointer;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
  }

  .difficulty-selector input[type="range"]::-moz-range-thumb {
    width: 24px;
    height: 24px;
    border-radius: 50%;
    background: #2196f3;
    cursor: pointer;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
    border: none;
  }

  .difficulty-labels {
    display: flex;
    justify-content: space-between;
    margin-top: 0.5rem;
    font-size: 0.875rem;
    color: #666;
  }

  .modal-actions {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    justify-content: center;
  }

  .btn {
    padding: 0.75rem 2rem;
    border: none;
    border-radius: 0.5rem;
    font-size: 1rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
    width: 100%;
  }

  .btn-primary {
    background: #2196f3;
    color: white;
  }

  .btn-primary:hover {
    background: #1976d2;
  }

  .btn-secondary {
    background: #e0e0e0;
    color: #333;
  }

  .btn-secondary:hover {
    background: #bdbdbd;
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

  @media (max-width: 480px) {
    .modal {
      padding: 1.5rem;
    }

    h2 {
      font-size: 1.5rem;
    }
  }
</style>

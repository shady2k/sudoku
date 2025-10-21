<script lang="ts">
  import SudokuGrid from './components/SudokuGrid.svelte';
  import Controls from './components/Controls.svelte';
  import ResumeModal from './components/ResumeModal.svelte';
  import CongratulationsModal from './components/CongratulationsModal.svelte';
  import NotesModeToggle from './components/NotesModeToggle.svelte';
  import { gameStore } from './lib/stores/gameStore.svelte';
  import { onMount, onDestroy } from 'svelte';
  import { hasSavedGame, loadPreferences, loadGameSession } from './lib/services/StorageService';
  import type { DifficultyLevel } from './lib/models/types';

  // State for modals
  let showResumeModal = $state(false);
  let showNewGameModal = $state(false);
  let showCongratulationsModal = $state(false);

  // Timer interval
  let intervalId: ReturnType<typeof setInterval> | null = null;

  onMount(async () => {
    // Start timer interval
    intervalId = setInterval(() => {
      gameStore.updateTime();

      // Check if game just completed (FR-014)
      if (gameStore.session?.isCompleted && !showCongratulationsModal && !showNewGameModal) {
        showCongratulationsModal = true;
      }
    }, 100);

    // Flush pending saves before page unload
    const handleBeforeUnload = (): void => {
      if (gameStore.session) {
        gameStore.forceSave();
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);

    // T065: Check if there's a saved game (FR-003, FR-004)
    const hasGame = hasSavedGame();

    if (hasGame) {
      // Load the saved game to check if it's completed
      const result = await loadGameSession();

      if (result.success && result.data.isCompleted) {
        // Game is completed - show New Game modal instead of loading it (FR-003)
        showNewGameModal = true;
      } else if (result.success) {
        // Game is in progress - show Resume modal (FR-004)
        showResumeModal = true;
      } else {
        // Error loading game - start new game
        const preferences = await loadPreferences();
        await gameStore.newGame(preferences.defaultDifficulty);
      }
    } else {
      // No saved game - show New Game modal (FR-004)
      showNewGameModal = true;
    }

    // Cleanup beforeunload listener
    return (): void => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  });

  onDestroy(() => {
    if (intervalId) {
      clearInterval(intervalId);
    }
    // Cleanup throttled save to prevent memory leaks
    gameStore.destroy();
  });

  async function handleResume(): Promise<void> {
    showResumeModal = false;
    await gameStore.loadSavedGame();
    // If loaded game is paused, resume it (user clicked "Resume Game")
    if (gameStore.session?.isPaused) {
      gameStore.resumeGame();
    }
  }

  async function handleNewGameFromResume(difficulty: DifficultyLevel): Promise<void> {
    // Don't close modal here - let ResumeModal handle it after showing loading animation
    await gameStore.newGame(difficulty);
  }

  async function handleNewGame(): Promise<void> {
    showNewGameModal = true;
  }

  async function handleNewGameFromModal(difficulty: DifficultyLevel): Promise<void> {
    // Don't close modal here - let ResumeModal handle it after showing loading animation
    await gameStore.newGame(difficulty);
  }

  function handleCongratulationsStartNewGame(): void {
    // Close congratulations modal and open New Game modal (FR-014)
    showCongratulationsModal = false;
    showNewGameModal = true;
  }

  function shouldIgnoreKeyboardEvent(event: KeyboardEvent): boolean {
    // Don't interfere with input elements
    if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
      return true;
    }

    // Don't handle if modal is open
    return showResumeModal;
  }

  function canInteractWithGame(): boolean {
    return !!(gameStore.session && !gameStore.session.isCompleted);
  }

  // Check if game is paused (manual or auto)
  let isPaused = $derived(
    gameStore.session?.isPaused === true
  );

  function handleCandidateToggle(event: KeyboardEvent): void {
    if (event.key === 'c' || event.key === 'C') {
      if (canInteractWithGame()) {
        gameStore.fillCandidates();
        event.preventDefault();
      }
    }
  }

  function handlePauseResume(event: KeyboardEvent): void {
    if (event.key === ' ') {
      if (canInteractWithGame() && gameStore.session) {
        // Toggle pause/resume
        if (gameStore.session.isPaused) {
          gameStore.resumeGame();
        } else {
          gameStore.pauseGame();
        }
        event.preventDefault();
      }
    }
  }

  function handleNewGameShortcut(event: KeyboardEvent): void {
    if (event.key === 'g' || event.key === 'G') {
      handleNewGame();
      event.preventDefault();
    }
  }

  function handleUndoShortcut(event: KeyboardEvent): void {
    // U key for undo (FR-022)
    if (event.key === 'u' || event.key === 'U') {
      if (canInteractWithGame() && gameStore.canUndo) {
        gameStore.undo();
        event.preventDefault();
      }
    }
  }

  function handleRedoShortcut(event: KeyboardEvent): void {
    // R key for redo (FR-022)
    if (event.key === 'r' || event.key === 'R') {
      if (canInteractWithGame() && gameStore.canRedo) {
        gameStore.redo();
        event.preventDefault();
      }
    }
  }

  // Global keyboard shortcuts (FR-007)
  function handleGlobalKeyboard(event: KeyboardEvent): void {
    if (shouldIgnoreKeyboardEvent(event)) return;

    // Resume game if paused (any key resumes)
    if (isPaused) {
      gameStore.resumeGame();
      event.preventDefault();
      return;
    }

    handleCandidateToggle(event);
    handlePauseResume(event);
    handleNewGameShortcut(event);
    handleUndoShortcut(event);
    handleRedoShortcut(event);
  }

  // Handle pause overlay interaction to resume
  function handlePauseOverlayClick(event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    if (gameStore.session?.isPaused) {
      gameStore.resumeGame();
    }
  }

  // Auto-resume on window focus (when returning from another window)
  let pauseOverlayRef = $state<HTMLDivElement | null>(null);
  let wasWindowBlurred = false;
  let hadFirstInteraction = false;

  $effect(() => {
    if (isPaused) {
      hadFirstInteraction = false; // Reset when pause overlay appears

      // Focus the overlay when it first appears
      if (pauseOverlayRef) {
        setTimeout((): void => {
          pauseOverlayRef?.focus();
        }, 10);
      }

      // Track when window loses focus (user switched away)
      const handleWindowBlur = (): void => {
        wasWindowBlurred = true;
      };

      // When window regains focus, resume if user had switched away
      const handleWindowFocus = (): void => {
        // If window was blurred OR this is the first interaction with the pause overlay
        if ((wasWindowBlurred || !hadFirstInteraction) && gameStore.session?.isPaused) {
          // User clicked back on the window - resume immediately
          gameStore.resumeGame();
          wasWindowBlurred = false;
          hadFirstInteraction = true;
        } else {
          // Just focus the overlay for regular interactions
          pauseOverlayRef?.focus();
        }
      };

      window.addEventListener('blur', handleWindowBlur);
      window.addEventListener('focus', handleWindowFocus);

      return (): void => {
        window.removeEventListener('blur', handleWindowBlur);
        window.removeEventListener('focus', handleWindowFocus);
        wasWindowBlurred = false;
        hadFirstInteraction = false;
      };
    }
  });
</script>

<svelte:window on:keydown={handleGlobalKeyboard} />

<main class:hidden={showResumeModal}>
  <header>
    <h1>Sudoku</h1>
    <p class="subtitle">Offline Puzzle Game</p>
  </header>

  <div class="game-container" class:auto-paused={isPaused}>
    <!-- T080b: Desktop layout with grid on left and number pad on right -->
    <div class="game-layout">
      <div class="left-panel">
        {#if gameStore.session && !gameStore.session.isCompleted}
          <NotesModeToggle />
        {/if}
        <SudokuGrid />
        {#if gameStore.session && !gameStore.session.isCompleted}
          <div class="undo-redo-group">
            <button
              type="button"
              class="btn btn-undo"
              onclick={(): void => gameStore.undo()}
              disabled={!gameStore.canUndo}
              title="Undo (U)"
            >
              <span class="btn-text">Undo</span>
              <span class="hotkey">U</span>
            </button>
            <button
              type="button"
              class="btn btn-redo"
              onclick={(): void => gameStore.redo()}
              disabled={!gameStore.canRedo}
              title="Redo (R)"
            >
              <span class="btn-text">Redo</span>
              <span class="hotkey">R</span>
            </button>
          </div>
        {/if}
      </div>
      <div class="right-panel">
        <!-- Compact stats row inspired by reference -->
        <div class="stats-row">
          <div class="stat-item">
            <div class="stat-label">
              {#if gameStore.session?.isPaused}⏸{/if} Time
            </div>
            <div class="stat-value">{gameStore.formattedTime}</div>
          </div>
          {#if gameStore.session}
            <div class="stat-item">
              <div class="stat-label">Difficulty</div>
              <div class="stat-value">{gameStore.session.difficultyLevel}%</div>
            </div>
            <div class="stat-item">
              <div class="stat-label">Mistakes</div>
              <div class="stat-value" class:error={gameStore.session.mistakeCount > 0}>
                {gameStore.session.mistakeCount}
              </div>
            </div>
          {/if}
        </div>
        <Controls onNewGame={handleNewGame} />
      </div>
    </div>

    {#if gameStore.error}
      <div class="error-message">
        <p>⚠️ {gameStore.error}</p>
      </div>
    {/if}
  </div>

  <!-- Pause overlay to prevent interaction and provide visual feedback -->
  {#if isPaused}
    <div
      bind:this={pauseOverlayRef}
      class="auto-pause-overlay"
      role="button"
      tabindex="0"
      onclick={handlePauseOverlayClick}
      onmousedown={handlePauseOverlayClick}
      onkeydown={(e): void => { if (e.key === 'Enter' || e.key === ' ') handlePauseOverlayClick(e); }}
    >
      <div class="auto-pause-content">
        <div class="auto-pause-icon">⏸</div>
        <div class="auto-pause-message">
          {#if gameStore.session?.isAutoPaused}
            Game Paused (Idle)
          {:else}
            Game Paused
          {/if}
        </div>
        <div class="auto-pause-hint">Click anywhere or press any key to resume</div>
      </div>
    </div>
  {/if}

  <footer>
    <p>Use arrow keys to navigate • Number keys (1-9) to fill • Shift/Alt+1-9 for candidates • U/R for undo/redo • Press C to fill candidates</p>
  </footer>
</main>

<!-- T066: Resume or New Game modal (FR-004) -->
<ResumeModal
  bind:isOpen={showResumeModal}
  onResume={handleResume}
  onNewGame={handleNewGameFromResume}
  showResumeOption={true}
/>

<!-- New Game modal without resume option -->
<ResumeModal
  bind:isOpen={showNewGameModal}
  onNewGame={handleNewGameFromModal}
  showResumeOption={false}
/>

<!-- Congratulations modal (FR-014) -->
<CongratulationsModal
  bind:isOpen={showCongratulationsModal}
  formattedTime={gameStore.formattedTime}
  mistakeCount={gameStore.session?.mistakeCount ?? 0}
  onStartNewGame={handleCongratulationsStartNewGame}
/>

<style>
  main {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  }

  main.hidden {
    visibility: hidden;
  }

  header {
    text-align: center;
    padding: 2rem 1rem 1rem;
    color: white;
  }

  h1 {
    font-size: 3rem;
    font-weight: 800;
    margin: 0;
    text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.2);
  }

  .subtitle {
    font-size: 1.125rem;
    margin: 0.5rem 0 0;
    opacity: 0.9;
  }

  .game-container {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
    padding: 1.5rem 1rem;
    background: white;
    border-radius: 1.5rem;
    box-shadow: 0 -8px 24px rgba(0, 0, 0, 0.08);
    transition: filter 0.3s ease, transform 0.3s ease;
  }

  .game-container.auto-paused {
    filter: blur(8px);
    transform: scale(0.98);
    pointer-events: none;
  }

  /* T080b: Game layout wrapper for grid + number pad positioning */
  .game-layout {
    display: flex;
    flex-direction: column;
    gap: 2rem;
    align-items: center;
    justify-content: center;
    min-height: 500px;
  }

  .left-panel {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    width: 100%;
    align-items: center;
  }

  .undo-redo-group {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0.75rem;
    width: 100%;
    max-width: 400px;
    margin-top: 0.5rem;
  }

  .btn {
    padding: 0.75rem 1rem;
    border: 2px solid #e5e7eb;
    background: linear-gradient(135deg, #ffffff 0%, #f9fafb 100%);
    color: #374151;
    font-size: 0.875rem;
    font-weight: 600;
    border-radius: 0.75rem;
    cursor: pointer;
    transition: all 0.15s cubic-bezier(0.4, 0, 0.2, 1);
    display: flex;
    align-items: center;
    gap: 0.5rem;
    justify-content: center;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
    min-height: 44px;
  }

  .btn:hover:not(:disabled) {
    background: linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%);
    border-color: #d1d5db;
    transform: translateY(-1px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.08);
  }

  .btn:active:not(:disabled) {
    transform: translateY(0);
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
  }

  .btn:disabled {
    opacity: 0.4;
    cursor: not-allowed;
    transform: none;
  }

  .btn-text {
    flex-shrink: 0;
  }

  .hotkey {
    display: inline-block;
    padding: 0.125rem 0.375rem;
    background: rgba(59, 130, 246, 0.1);
    border: 1px solid rgba(59, 130, 246, 0.2);
    border-radius: 0.25rem;
    font-size: 0.625rem;
    font-weight: 700;
    color: #3b82f6;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .right-panel {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    width: 100%;
    max-width: 400px;
  }

  /* Modern stats row with card design */
  .stats-row {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 0.75rem;
    padding: 0;
    max-width: 340px;
  }

  .stat-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.25rem;
    padding: 0.75rem 0.5rem;
    background: linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%);
    border-radius: 0.75rem;
    border: 2px solid #e9ecef;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    position: relative;
    overflow: hidden;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  }

  .stat-item::before {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(135deg, rgba(59, 130, 246, 0.05) 0%, rgba(59, 130, 246, 0.02) 100%);
    opacity: 0;
    transition: opacity 0.3s ease;
  }

  .stat-item:hover {
    border-color: #3b82f6;
    box-shadow: 0 4px 16px rgba(59, 130, 246, 0.15);
    transform: translateY(-2px);
  }

  .stat-item:hover::before {
    opacity: 1;
  }

  .stat-label {
    font-size: 0.625rem;
    color: #64748b;
    text-transform: uppercase;
    letter-spacing: 0.75px;
    font-weight: 700;
    order: -1;
    position: relative;
    z-index: 1;
  }

  .stat-value {
    font-size: 1.5rem;
    font-weight: 900;
    color: #1e293b;
    font-variant-numeric: tabular-nums;
    line-height: 1.1;
    position: relative;
    z-index: 1;
    transition: color 0.3s ease;
  }

  .stat-value.error {
    color: #dc2626;
    animation: pulse-red 2s ease-in-out infinite;
  }

  @keyframes pulse-red {
    0%, 100% {
      opacity: 1;
    }
    50% {
      opacity: 0.8;
    }
  }

  .error-message {
    background-color: #ffebee;
    border: 2px solid #d32f2f;
    border-radius: 0.5rem;
    padding: 1rem;
    text-align: center;
    color: #d32f2f;
    font-weight: 600;
  }

  .error-message p {
    margin: 0;
  }

  footer {
    padding: 1.5rem;
    text-align: center;
    color: white;
    font-size: 0.875rem;
    opacity: 0.9;
  }

  footer p {
    margin: 0;
  }

  @media (min-width: 768px) {
    .game-container {
      max-width: 1200px;
      margin: 0 auto;
      width: 100%;
      padding: 2rem;
    }

    /* T080b: Position grid on left and number pad on right on desktop (≥768px) per FR-020 */
    .game-layout {
      display: grid;
      grid-template-columns: auto auto;
      gap: 2.5rem;
      align-items: start;
      justify-content: center;
      min-height: auto;
    }

    .left-panel {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      align-items: center;
    }

    .right-panel {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      /* Match the grid's height using flex */
      height: 100%;
      justify-content: space-between;
    }
  }

  @media (min-width: 1024px) {
    .game-layout {
      gap: 3rem;
    }
  }

  /* Auto-pause overlay styles */
  .auto-pause-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.4);
    backdrop-filter: blur(4px);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    animation: fadeIn 0.3s ease;
    cursor: pointer;
  }

  .auto-pause-content {
    background: white;
    border-radius: 1.5rem;
    padding: 2.5rem;
    text-align: center;
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
    animation: slideUp 0.4s ease;
    max-width: 400px;
    margin: 0 1rem;
  }

  .auto-pause-icon {
    font-size: 4rem;
    margin-bottom: 1rem;
    opacity: 0.9;
  }

  .auto-pause-message {
    font-size: 1.5rem;
    font-weight: 700;
    color: #1e293b;
    margin-bottom: 0.5rem;
  }

  .auto-pause-hint {
    font-size: 1rem;
    color: #64748b;
    opacity: 0.8;
  }

  @keyframes fadeIn {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }

  @keyframes slideUp {
    from {
      transform: translateY(20px);
      opacity: 0;
    }
    to {
      transform: translateY(0);
      opacity: 1;
    }
  }
</style>
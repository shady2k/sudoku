<script lang="ts">
  /**
   * Congratulations Modal Component
   *
   * Shows when player completes the puzzle (FR-014):
   * - Displays congratulations message with final time and errors
   * - Shows ONLY "Start New Game" button (no close/cancel option)
   * - Clicking button opens New Game modal with difficulty slider
   */

  interface Props {
    isOpen: boolean;
    formattedTime: string;
    errorCount: number;
    onStartNewGame: () => void;
  }

  let { isOpen = $bindable(false), formattedTime, errorCount, onStartNewGame }: Props = $props();

  function handleStartNewGame(): void {
    onStartNewGame();
    isOpen = false;
  }
</script>

{#if isOpen}
  <div class="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="congrats-title">
    <div class="overlay-inactive"></div>
    <div class="modal" role="document">
      <div class="icon">🎉</div>
      <h2 id="congrats-title">Congratulations!</h2>
      <p class="message">You've successfully completed the puzzle!</p>

      <div class="stats">
        <div class="stat-item">
          <div class="stat-label">Time</div>
          <div class="stat-value">{formattedTime}</div>
        </div>
        <div class="stat-item">
          <div class="stat-label">Errors</div>
          <div class="stat-value" class:perfect={errorCount === 0}>{errorCount}</div>
        </div>
      </div>

      {#if errorCount === 0}
        <p class="perfect-message">Perfect! No errors!</p>
      {/if}

      <div class="modal-actions">
        <button
          type="button"
          class="btn btn-primary"
          onclick={handleStartNewGame}
        >
          Start New Game
        </button>
      </div>
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
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    padding: 1rem;
  }

  .overlay-inactive {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.7);
    backdrop-filter: blur(8px);
    -webkit-backdrop-filter: blur(8px);
    cursor: default;
  }

  .modal {
    background: white;
    border-radius: 1.5rem;
    padding: 2.5rem 2rem;
    max-width: 450px;
    width: 100%;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.4);
    position: relative;
    z-index: 1;
    text-align: center;
  }

  .icon {
    font-size: 4rem;
    margin-bottom: 1rem;
    animation: bounce 1s ease-in-out;
  }

  @keyframes bounce {
    0%, 100% {
      transform: translateY(0);
    }
    50% {
      transform: translateY(-20px);
    }
  }

  h2 {
    margin: 0 0 0.5rem;
    font-size: 2.5rem;
    color: #1e293b;
    font-weight: 800;
  }

  .message {
    color: #64748b;
    font-size: 1.125rem;
    margin: 0 0 2rem;
  }

  .stats {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 1rem;
    margin-bottom: 1.5rem;
  }

  .stat-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.5rem;
    padding: 1rem;
    background: linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%);
    border-radius: 1rem;
    border: 2px solid #e9ecef;
  }

  .stat-label {
    font-size: 0.75rem;
    color: #64748b;
    text-transform: uppercase;
    letter-spacing: 1px;
    font-weight: 700;
  }

  .stat-value {
    font-size: 2rem;
    font-weight: 900;
    color: #1e293b;
    font-variant-numeric: tabular-nums;
  }

  .stat-value.perfect {
    color: #10b981;
  }

  .perfect-message {
    color: #10b981;
    font-weight: 700;
    font-size: 1.125rem;
    margin: 0 0 1.5rem;
  }

  .modal-actions {
    display: flex;
    justify-content: center;
  }

  .btn {
    padding: 1rem 2.5rem;
    border: none;
    border-radius: 0.75rem;
    font-size: 1.125rem;
    font-weight: 700;
    cursor: pointer;
    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  }

  .btn-primary {
    background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
    color: white;
    box-shadow: 0 4px 16px rgba(59, 130, 246, 0.3);
  }

  .btn-primary:hover {
    background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
    transform: translateY(-2px);
    box-shadow: 0 8px 24px rgba(59, 130, 246, 0.4);
  }

  .btn-primary:active {
    transform: translateY(0);
    box-shadow: 0 4px 16px rgba(59, 130, 246, 0.3);
  }

  @media (max-width: 480px) {
    .modal {
      padding: 2rem 1.5rem;
    }

    h2 {
      font-size: 2rem;
    }

    .icon {
      font-size: 3rem;
    }

    .btn {
      width: 100%;
    }
  }
</style>

<script lang="ts">
  import { gameStore } from '../lib/stores/gameStore.svelte';

  function handleToggle(mode: 'fill' | 'notes'): void {
    const shouldBeNotesMode = mode === 'notes';
    if (gameStore.notesMode !== shouldBeNotesMode) {
      gameStore.toggleNotesMode();
    }
  }

  function handleKeyDown(event: KeyboardEvent): void {
    // 'N' key toggles notes mode globally
    if (event.key === 'n' || event.key === 'N') {
      // Don't interfere with input fields
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
        return;
      }
      event.preventDefault();
      gameStore.toggleNotesMode();

      // Remove focus from any toggle button to prevent focus ring
      if (document.activeElement instanceof HTMLElement) {
        document.activeElement.blur();
      }
    }
  }
</script>

<svelte:window on:keydown={handleKeyDown} />

<div class="notes-mode-toggle">
  <label for="notes-mode-switch" class="toggle-label">
    NOTES MODE <kbd>N</kbd>
  </label>
  <div id="notes-mode-switch"
       class="toggle-switch"
       role="radiogroup"
       aria-label="Input mode selection">
    <button type="button"
            role="radio"
            aria-checked={!gameStore.notesMode}
            class="toggle-option"
            class:active={!gameStore.notesMode}
            data-mode="fill"
            onclick={(): void => handleToggle('fill')}
            aria-label="Fill mode - enter numbers directly">
      <span>FILL</span>
    </button>
    <button type="button"
            role="radio"
            aria-checked={gameStore.notesMode}
            class="toggle-option"
            class:active={gameStore.notesMode}
            data-mode="notes"
            onclick={(): void => handleToggle('notes')}
            aria-label="Notes mode - enter candidate marks">
      <span>NOTES</span>
    </button>
  </div>
</div>

<style>
  .notes-mode-toggle {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    margin-bottom: 0.75rem;
  }

  .toggle-label {
    font-size: 0.75rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: #6b7280;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .toggle-label kbd {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 0.125rem 0.375rem;
    background: #f3f4f6;
    border: 1px solid #d1d5db;
    border-radius: 0.25rem;
    font-size: 0.625rem;
    font-weight: 600;
    font-family: monospace;
    color: #374151;
  }

  .toggle-switch {
    display: flex;
    background: white;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    padding: 2px;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
    gap: 2px;
  }

  .toggle-option {
    flex: 1;
    padding: 0.5rem 1rem;
    border: none;
    background: transparent;
    color: #6b7280;
    font-size: 0.875rem;
    font-weight: 500;
    border-radius: 6px;
    cursor: pointer;
    transition: all 150ms cubic-bezier(0.4, 0, 0.2, 1);
    min-height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .toggle-option:hover:not(.active) {
    background: #f9fafb;
  }

  .toggle-option:focus {
    outline: none;
  }

  /* Only show focus ring when navigating with keyboard (Tab), not when clicking */
  .toggle-option:focus-visible {
    outline: 2px solid #2563eb;
    outline-offset: 2px;
  }

  /* Remove focus ring when button becomes focused via JavaScript/programmatic focus */
  .toggle-option:focus:not(:focus-visible) {
    outline: none;
  }

  /* Fill mode active (blue) */
  .toggle-option[data-mode="fill"].active {
    background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
    color: white;
    font-weight: 700;
    box-shadow: 0 1px 3px rgba(59, 130, 246, 0.3);
  }

  /* Notes mode active (purple) */
  .toggle-option[data-mode="notes"].active {
    background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
    color: white;
    font-weight: 700;
    box-shadow: 0 1px 3px rgba(139, 92, 246, 0.3);
  }

  @media (max-width: 767px) {
    .notes-mode-toggle {
      margin-bottom: 1rem;
    }

    .toggle-option {
      min-height: 48px;
      font-size: 0.9375rem;
    }
  }
</style>

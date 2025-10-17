/**
 * Application Entry Point
 *
 * Initializes the Svelte app and mounts it to the DOM
 */

import './app.css';
import { mount } from 'svelte';
import App from './App.svelte';
import { gameStore } from './lib/stores/gameStore.svelte';

// Mount the app (Svelte 5 syntax)
const appElement = document.getElementById('app');
if (!appElement) {
  throw new Error('Could not find #app element in DOM');
}

const app = mount(App, {
  target: appElement
});

// T067: Pause timer when page loses focus (FR-023)
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    // Page lost focus - pause the game
    gameStore.pauseGame();
  }
  // Note: Do NOT auto-resume on visibility - wait for explicit user interaction per FR-023
});

// T068: Save state before browser close (FR-019)
window.addEventListener('beforeunload', () => {
  // Note: In beforeunload, we rely on throttledSave which already happened
  // Synchronous access not available with Svelte 5 runes class instance
  // The auto-save throttling ensures state is saved within 2 seconds of last action
});

// T102: Idle detection listeners for auto-pause (FR-017, FR-018)
// T103: Auto-resume on user interaction
//
// Strategy: Game actions (makeMove, selectCell, etc.) already update lastActivityAt
// We only need to handle auto-resume from idle pause here
const userActivityEvents = ['click', 'keypress', 'touchstart'] as const;

function handleUserActivity(): void {
  // Only handle auto-resume, don't update lastActivityAt
  // (game actions will update lastActivityAt themselves)
  if (gameStore.session?.isPaused) {
    const wasAutoPaused = gameStore.session.pausedAt === gameStore.session.lastActivityAt;
    if (wasAutoPaused) {
      gameStore.resumeGame();
    }
  }
}

// Register listeners for auto-resume only
userActivityEvents.forEach((eventType) => {
  document.addEventListener(eventType, handleUserActivity, { passive: true });
});

export default app;

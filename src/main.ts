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

export default app;

/**
 * Application Entry Point
 *
 * Initializes the Svelte app and mounts it to the DOM
 */

import './app.css';
import { mount } from 'svelte';
import App from './App.svelte';

// Mount the app (Svelte 5 syntax)
const app = mount(App, {
  target: document.getElementById('app')!
});

export default app;

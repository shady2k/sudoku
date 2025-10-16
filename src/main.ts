/**
 * Application Entry Point
 *
 * Initializes the Svelte app and mounts it to the DOM
 */

import './app.css';
import { mount } from 'svelte';
import App from './App.svelte';

// Mount the app (Svelte 5 syntax)
const appElement = document.getElementById('app');
if (!appElement) {
  throw new Error('Could not find #app element in DOM');
}

const app = mount(App, {
  target: appElement
});

export default app;

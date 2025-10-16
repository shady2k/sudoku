/**
 * Integration Test: Auto-Save and Resume Flow
 *
 * Debug test to verify the complete auto-save and resume workflow
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { gameStore } from '../../src/lib/stores/gameStore.svelte';
import { hasSavedGame } from '../../src/lib/services/StorageService';

describe('Auto-Save and Resume Flow Debug', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should save game automatically after creating new game', async () => {
    console.log('Step 1: Check initial state - no saved game');
    expect(hasSavedGame()).toBe(false);

    console.log('Step 2: Create new game');
    await gameStore.newGame(50);

    console.log('Step 3: Wait for throttled save to complete');
    // The throttledSave is called immediately for new games
    // But it might be async, so let's wait a bit
    await new Promise(resolve => setTimeout(resolve, 100));

    console.log('Step 4: Check if game was saved');
    const savedAfterNewGame = hasSavedGame();
    console.log('hasSavedGame() after newGame:', savedAfterNewGame);

    // Check localStorage directly
    const rawData = localStorage.getItem('sudoku:current-session');
    console.log('Raw localStorage data:', rawData ? 'EXISTS' : 'NULL');

    if (rawData) {
      const parsed = JSON.parse(rawData);
      console.log('Parsed data has version:', parsed.version);
      console.log('Parsed data has data field:', !!parsed.data);
      console.log('Session ID:', parsed.data?.sessionId);
    }

    expect(savedAfterNewGame).toBe(true);
  });

  it('should make a move and auto-save', async () => {
    console.log('Step 1: Create new game');
    await gameStore.newGame(50);

    // Wait for initial save
    await new Promise(resolve => setTimeout(resolve, 100));

    console.log('Step 2: Get initial session ID');
    const initialSessionId = gameStore.session?.sessionId;
    console.log('Initial session ID:', initialSessionId);

    console.log('Step 3: Find an empty cell and make a move');
    const session = gameStore.session;
    expect(session).toBeTruthy();

    if (!session) return;

    // Find first empty cell
    let emptyCellFound = false;
    for (let row = 0; row < 9 && !emptyCellFound; row++) {
      for (let col = 0; col < 9 && !emptyCellFound; col++) {
        const cell = session.cells[row]?.[col];
        if (cell && !cell.isClue) {
          console.log(`Found empty cell at [${row}, ${col}]`);
          gameStore.makeMove({ row, col }, 5);
          emptyCellFound = true;
        }
      }
    }

    expect(emptyCellFound).toBe(true);

    console.log('Step 4: Wait for throttled save');
    await new Promise(resolve => setTimeout(resolve, 2500));

    console.log('Step 5: Check if move was saved');
    const savedAfterMove = hasSavedGame();
    console.log('hasSavedGame() after move:', savedAfterMove);

    // Load from localStorage and verify
    const rawData = localStorage.getItem('sudoku:current-session');
    if (rawData) {
      const parsed = JSON.parse(rawData);
      console.log('Saved session ID:', parsed.data?.sessionId);
      expect(parsed.data?.sessionId).toBe(initialSessionId);
    }

    expect(savedAfterMove).toBe(true);
  });

  it('should load saved game on resume', async () => {
    console.log('Step 1: Create and save a game');
    await gameStore.newGame(50);
    await new Promise(resolve => setTimeout(resolve, 100));

    const originalSessionId = gameStore.session?.sessionId;
    const originalDifficulty = gameStore.session?.difficultyLevel;
    console.log('Original session ID:', originalSessionId);
    console.log('Original difficulty:', originalDifficulty);

    // Make a move
    const session = gameStore.session;
    if (session) {
      for (let row = 0; row < 9; row++) {
        for (let col = 0; col < 9; col++) {
          const cell = session.cells[row]?.[col];
          if (cell && !cell.isClue) {
            gameStore.makeMove({ row, col }, 7);
            break;
          }
        }
        break;
      }
    }

    await new Promise(resolve => setTimeout(resolve, 2500));

    console.log('Step 2: Verify saved');
    expect(hasSavedGame()).toBe(true);

    console.log('Step 3: Simulate page reload by creating new store instance');
    // In a real scenario, the store would be recreated
    // For testing, we'll clear the session and reload
    (gameStore as any).session = null;

    console.log('Step 4: Check hasSavedGame before loading');
    const hasGameBeforeLoad = hasSavedGame();
    console.log('hasSavedGame() before load:', hasGameBeforeLoad);
    expect(hasGameBeforeLoad).toBe(true);

    console.log('Step 5: Load saved game');
    const loaded = await gameStore.loadSavedGame();
    console.log('loadSavedGame() returned:', loaded);

    console.log('Step 6: Verify loaded session');
    expect(loaded).toBe(true);
    expect(gameStore.session).toBeTruthy();
    expect(gameStore.session?.sessionId).toBe(originalSessionId);
    expect(gameStore.session?.difficultyLevel).toBe(originalDifficulty);
  });

  it('should detect saved game exists before loading', async () => {
    console.log('Step 1: Initially no saved game');
    expect(hasSavedGame()).toBe(false);

    console.log('Step 2: Create new game');
    await gameStore.newGame(75);
    await new Promise(resolve => setTimeout(resolve, 100));

    console.log('Step 3: Check hasSavedGame');
    const hasSaved = hasSavedGame();
    console.log('hasSavedGame() result:', hasSaved);

    // Debug localStorage directly
    const keys = Object.keys(localStorage);
    console.log('All localStorage keys:', keys);
    console.log('sudoku:current-session exists:', keys.includes('sudoku:current-session'));

    const rawValue = localStorage.getItem('sudoku:current-session');
    console.log('Raw value is null?', rawValue === null);
    console.log('Raw value length:', rawValue?.length);

    expect(hasSaved).toBe(true);
  });

  it('should trace the complete save/reload/resume cycle', async () => {
    console.log('\n=== COMPLETE CYCLE TEST ===\n');

    console.log('[INITIAL] localStorage keys:', Object.keys(localStorage));
    console.log('[INITIAL] hasSavedGame:', hasSavedGame());

    console.log('\n[ACTION] Creating new game at 60% difficulty...');
    await gameStore.newGame(60);

    console.log('[WAIT] Waiting 200ms for save...');
    await new Promise(resolve => setTimeout(resolve, 200));

    console.log('[CHECK] After newGame:');
    console.log('  - hasSavedGame:', hasSavedGame());
    console.log('  - localStorage keys:', Object.keys(localStorage));
    console.log('  - session exists:', !!gameStore.session);
    console.log('  - session ID:', gameStore.session?.sessionId);

    const savedSessionId = gameStore.session?.sessionId;
    const savedDifficulty = gameStore.session?.difficultyLevel;

    console.log('\n[ACTION] Making a move...');
    if (gameStore.session) {
      // Find first empty cell and make move
      outer: for (let row = 0; row < 9; row++) {
        for (let col = 0; col < 9; col++) {
          const cell = gameStore.session.cells[row]?.[col];
          if (cell && !cell.isClue) {
            console.log(`  - Moving to cell [${row}, ${col}] with value 9`);
            gameStore.makeMove({ row, col }, 9);
            break outer;
          }
        }
      }
    }

    console.log('[WAIT] Waiting 2500ms for throttled save...');
    await new Promise(resolve => setTimeout(resolve, 2500));

    console.log('[CHECK] After move:');
    console.log('  - hasSavedGame:', hasSavedGame());

    // Check the actual saved data
    const savedData = localStorage.getItem('sudoku:current-session');
    if (savedData) {
      const parsed = JSON.parse(savedData);
      console.log('  - Saved data version:', parsed.version);
      console.log('  - Saved session ID:', parsed.data?.sessionId);
      console.log('  - Saved difficulty:', parsed.data?.difficultyLevel);
    }

    console.log('\n[SIMULATE RELOAD] Clearing in-memory session...');
    (gameStore as any).session = null;
    console.log('  - session cleared:', gameStore.session === null);

    console.log('\n[CHECK] After simulated reload:');
    console.log('  - hasSavedGame:', hasSavedGame());
    console.log('  - This should return TRUE for modal to show');

    console.log('\n[ACTION] User clicks "Resume Game"...');
    const loadResult = await gameStore.loadSavedGame();
    console.log('  - loadSavedGame returned:', loadResult);

    console.log('\n[VERIFY] After resume:');
    console.log('  - session exists:', !!gameStore.session);
    console.log('  - session ID matches:', gameStore.session?.sessionId === savedSessionId);
    console.log('  - difficulty matches:', gameStore.session?.difficultyLevel === savedDifficulty);

    expect(loadResult).toBe(true);
    expect(gameStore.session?.sessionId).toBe(savedSessionId);
    expect(gameStore.session?.difficultyLevel).toBe(savedDifficulty);

    console.log('\n=== CYCLE TEST COMPLETE ===\n');
  });
});

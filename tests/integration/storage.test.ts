/**
 * Integration Tests: Storage Service
 *
 * Tests the complete storage workflow including:
 * - Game session save/load cycle
 * - Data integrity across serialization
 * - Error handling and recovery
 * - Performance benchmarks
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  saveGameSession,
  loadGameSession,
  deleteGameSession,
  hasSavedGame,
  saveGameRecord,
  loadGameHistory,
  archiveOldRecords,
  savePreferences,
  loadPreferences,
  getDefaultPreferences,
  isLocalStorageAvailable,
  SCHEMA_VERSION
} from '../../src/lib/services/StorageService';
import { createGameSession } from '../../src/lib/services/GameSession';
import type { GameRecord, UserPreferences } from '../../src/lib/models/types';

describe('Storage Service Integration', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
  });

  afterEach(() => {
    // Clean up after each test
    localStorage.clear();
  });

  describe('LocalStorage Availability', () => {
    it('should detect LocalStorage availability', () => {
      expect(isLocalStorageAvailable()).toBe(true);
    });
  });

  describe('Game Session Persistence', () => {
    it('should save and load complete game session', async () => {
      // Create a new game session
      const sessionResult = await createGameSession(50);
      expect(sessionResult.success).toBe(true);

      if (!sessionResult.success) return;
      const originalSession = sessionResult.data;

      // Save the session
      const saveResult = await saveGameSession(originalSession);
      expect(saveResult.success).toBe(true);

      // Verify hasSavedGame returns true
      expect(hasSavedGame()).toBe(true);

      // Load the session
      const loadResult = await loadGameSession();
      expect(loadResult.success).toBe(true);

      if (!loadResult.success) return;
      const loadedSession = loadResult.data;

      // Verify core session data
      expect(loadedSession.sessionId).toBe(originalSession.sessionId);
      expect(loadedSession.difficultyLevel).toBe(originalSession.difficultyLevel);
      expect(loadedSession.startTime).toBe(originalSession.startTime);
      expect(loadedSession.elapsedTime).toBe(originalSession.elapsedTime);
      expect(loadedSession.mistakeCount).toBe(originalSession.mistakeCount);
      expect(loadedSession.isCompleted).toBe(originalSession.isCompleted);
      expect(loadedSession.isPaused).toBe(originalSession.isPaused);

      // Verify puzzle data
      expect(loadedSession.puzzle.puzzleId).toBe(originalSession.puzzle.puzzleId);
      expect(loadedSession.puzzle.grid).toEqual(originalSession.puzzle.grid);
      expect(loadedSession.puzzle.solution).toEqual(originalSession.puzzle.solution);
      expect(loadedSession.puzzle.clues).toEqual(originalSession.puzzle.clues);

      // Verify board state
      expect(loadedSession.board).toEqual(originalSession.board);

      // Verify cells (including Sets)
      for (let row = 0; row < 9; row++) {
        for (let col = 0; col < 9; col++) {
          const originalCell = originalSession.cells[row]?.[col];
          const loadedCell = loadedSession.cells[row]?.[col];

          expect(loadedCell?.value).toBe(originalCell?.value);
          expect(loadedCell?.isClue).toBe(originalCell?.isClue);
          expect(loadedCell?.isMistake).toBe(originalCell?.isMistake);

          // Verify Sets were restored correctly
          expect(loadedCell?.manualCandidates).toBeInstanceOf(Set);
          expect(Array.from(loadedCell?.manualCandidates || [])).toEqual(
            Array.from(originalCell?.manualCandidates || [])
          );
        }
      }
    });

    it('should handle game session with manual candidates', async () => {
      // Create session
      const sessionResult = await createGameSession(50);
      expect(sessionResult.success).toBe(true);
      if (!sessionResult.success) return;

      const session = sessionResult.data;

      // Find first empty cell (not a clue)
      let emptyCell = null;
      let targetRow = 0, targetCol = 0;

      outer: for (let row = 0; row < 9; row++) {
        for (let col = 0; col < 9; col++) {
          const cell = session.cells[row]?.[col];
          if (cell && !cell.isClue) {
            emptyCell = cell;
            targetRow = row;
            targetCol = col;
            break outer;
          }
        }
      }

      expect(emptyCell).toBeTruthy();
      if (!emptyCell) return;

      // Add some manual candidates
      emptyCell.manualCandidates = new Set([1, 2, 3]);

      // Save and load
      await saveGameSession(session);
      const loadResult = await loadGameSession();
      expect(loadResult.success).toBe(true);

      if (!loadResult.success) return;
      const loadedSession = loadResult.data;

      // Verify candidates were restored
      const loadedCell = loadedSession.cells[targetRow]?.[targetCol];
      expect(loadedCell?.manualCandidates).toBeInstanceOf(Set);
      expect(Array.from(loadedCell?.manualCandidates || [])).toEqual([1, 2, 3]);
    });

    it('should delete game session', async () => {
      // Create and save a session
      const sessionResult = await createGameSession(50);
      expect(sessionResult.success).toBe(true);
      if (!sessionResult.success) return;

      await saveGameSession(sessionResult.data);
      expect(hasSavedGame()).toBe(true);

      // Delete the session
      const deleteResult = deleteGameSession();
      expect(deleteResult.success).toBe(true);
      expect(hasSavedGame()).toBe(false);

      // Verify loading returns failure
      const loadResult = await loadGameSession();
      expect(loadResult.success).toBe(false);
      if (!loadResult.success) {
        expect(loadResult.error.code).toBe('NO_SAVED_GAME');
      }
    });

    it('should handle missing saved game gracefully', async () => {
      // Try to load when no game is saved
      expect(hasSavedGame()).toBe(false);

      const loadResult = await loadGameSession();
      expect(loadResult.success).toBe(false);

      if (!loadResult.success) {
        expect(loadResult.error.code).toBe('NO_SAVED_GAME');
      }
    });

    it('should handle corrupted session data', async () => {
      // Save corrupted data to localStorage
      localStorage.setItem('sudoku:current-session', 'invalid json{{{');

      // Try to load
      const loadResult = await loadGameSession();
      expect(loadResult.success).toBe(false);

      if (!loadResult.success) {
        expect(loadResult.error.code).toBe('CORRUPTED_DATA');
      }
    });

    it('should meet save performance target (<500ms)', async () => {
      const sessionResult = await createGameSession(50);
      expect(sessionResult.success).toBe(true);
      if (!sessionResult.success) return;

      const start = performance.now();
      await saveGameSession(sessionResult.data);
      const elapsed = performance.now() - start;

      // SC-011: Save should complete in <500ms
      expect(elapsed).toBeLessThan(500);
    });

    it('should meet load performance target (<1s)', async () => {
      const sessionResult = await createGameSession(50);
      expect(sessionResult.success).toBe(true);
      if (!sessionResult.success) return;

      await saveGameSession(sessionResult.data);

      const start = performance.now();
      await loadGameSession();
      const elapsed = performance.now() - start;

      // SC-002: Load should complete in <1s
      expect(elapsed).toBeLessThan(1000);
    });
  });

  describe('Game History Persistence', () => {
    it('should save and load game records', async () => {
      const record: GameRecord = {
        recordId: 'test-123',
        completedAt: Date.now(),
        totalTime: 300000, // 5 minutes
        mistakeCount: 3,
        difficultyLevel: 50,
        puzzleId: 'puzzle-123',
        isPersonalBest: {
          fastestTime: false,
          fewestMistakes: false
        }
      };

      // Save record
      const saveResult = await saveGameRecord(record);
      expect(saveResult.success).toBe(true);

      // Load history
      const history = await loadGameHistory();
      expect(history.length).toBe(1);
      expect(history[0]?.recordId).toBe('test-123');
      expect(history[0]?.totalTime).toBe(300000);
      expect(history[0]?.mistakeCount).toBe(3);
    });

    it('should calculate personal bests correctly', async () => {
      // Save first record at difficulty 50
      const record1: GameRecord = {
        recordId: 'record-1',
        completedAt: Date.now(),
        totalTime: 300000,
        mistakeCount: 5,
        difficultyLevel: 50,
        puzzleId: 'puzzle-1',
        isPersonalBest: { fastestTime: false, fewestErrors: false }
      };
      await saveGameRecord(record1);

      // Save better record at same difficulty
      const record2: GameRecord = {
        recordId: 'record-2',
        completedAt: Date.now() + 1000,
        totalTime: 240000, // Faster
        mistakeCount: 3, // Fewer errors
        difficultyLevel: 50,
        puzzleId: 'puzzle-2',
        isPersonalBest: { fastestTime: false, fewestErrors: false }
      };
      await saveGameRecord(record2);

      // Load and verify
      const history = await loadGameHistory();
      expect(history.length).toBe(2);

      const latest = history[0];
      expect(latest?.isPersonalBest.fastestTime).toBe(true);
      expect(latest?.isPersonalBest.fewestMistakes).toBe(true);
    });

    it('should maintain max 1000 records', async () => {
      // Save 1005 records
      for (let i = 0; i < 1005; i++) {
        const record: GameRecord = {
          recordId: `record-${i}`,
          completedAt: Date.now() + i,
          totalTime: 300000,
          mistakeCount: 0,
          difficultyLevel: 50,
          puzzleId: `puzzle-${i}`,
          isPersonalBest: { fastestTime: false, fewestErrors: false }
        };
        await saveGameRecord(record);
      }

      // Load and verify only 1000 records kept
      const history = await loadGameHistory();
      expect(history.length).toBe(1000);

      // Verify most recent records were kept
      expect(history[0]?.recordId).toBe('record-1004');
      expect(history[999]?.recordId).toBe('record-5');
    });

    it('should archive old records', async () => {
      // Save 150 records
      for (let i = 0; i < 150; i++) {
        const record: GameRecord = {
          recordId: `record-${i}`,
          completedAt: Date.now() + i,
          totalTime: 300000,
          mistakeCount: 0,
          difficultyLevel: 50,
          puzzleId: `puzzle-${i}`,
          isPersonalBest: { fastestTime: false, fewestErrors: false }
        };
        await saveGameRecord(record);
      }

      // Archive, keeping only 100
      const archiveResult = await archiveOldRecords(100);
      expect(archiveResult.success).toBe(true);

      if (archiveResult.success) {
        expect(archiveResult.data.archivedCount).toBe(50);
      }

      // Verify only 100 records remain
      const history = await loadGameHistory();
      expect(history.length).toBe(100);
    });

    it('should handle empty history', async () => {
      const history = await loadGameHistory();
      expect(history).toEqual([]);
    });
  });

  describe('User Preferences Persistence', () => {
    it('should load default preferences when none exist', async () => {
      const preferences = await loadPreferences();
      const defaults = getDefaultPreferences();

      expect(preferences).toEqual(defaults);
      expect(preferences.defaultDifficulty).toBe(50);
      expect(preferences.candidateMode).toBe('manual');
      expect(preferences.autoPauseTimeout).toBe(3);
    });

    it('should save and load custom preferences', async () => {
      const customPreferences: UserPreferences = {
        defaultDifficulty: 75,
        candidateMode: 'auto',
        theme: {
          darkMode: true,
          highlightColor: '#fff3e0',
          mistakeColor: '#ffab91'
        },
        keyboardShortcuts: {
          undo: 'u',
          redo: 'r',
          newGame: 'ctrl+g',
          toggleCandidates: 't'
        },
        historyPreferences: {
          sortBy: 'time',
          sortOrder: 'asc',
          filterDifficulty: 50
        },
        autoPauseTimeout: 5
      };

      // Save preferences
      const saveResult = await savePreferences(customPreferences);
      expect(saveResult.success).toBe(true);

      // Load preferences
      const loadedPreferences = await loadPreferences();
      expect(loadedPreferences).toEqual(customPreferences);
      expect(loadedPreferences.defaultDifficulty).toBe(75);
      expect(loadedPreferences.candidateMode).toBe('auto');
      expect(loadedPreferences.theme.darkMode).toBe(true);
      expect(loadedPreferences.autoPauseTimeout).toBe(5);
    });

    it('should merge with defaults for missing fields', async () => {
      // Save partial preferences (simulating old schema)
      localStorage.setItem('sudoku:preferences', JSON.stringify({
        defaultDifficulty: 80
      }));

      const loadedPreferences = await loadPreferences();
      const defaults = getDefaultPreferences();

      // Should have custom value for defaultDifficulty
      expect(loadedPreferences.defaultDifficulty).toBe(80);

      // But defaults for everything else
      expect(loadedPreferences.candidateMode).toBe(defaults.candidateMode);
      expect(loadedPreferences.autoPauseTimeout).toBe(defaults.autoPauseTimeout);
      expect(loadedPreferences.theme).toEqual(defaults.theme);
    });
  });

  describe('Schema Version Handling', () => {
    it('should include schema version in saved data', async () => {
      const sessionResult = await createGameSession(50);
      expect(sessionResult.success).toBe(true);
      if (!sessionResult.success) return;

      await saveGameSession(sessionResult.data);

      // Read raw data from localStorage
      const raw = localStorage.getItem('sudoku:current-session');
      expect(raw).toBeTruthy();

      if (raw) {
        const parsed = JSON.parse(raw);
        expect(parsed.version).toBe(SCHEMA_VERSION);
      }
    });

    it('should reject unsupported schema versions', async () => {
      // Save data with future schema version
      localStorage.setItem('sudoku:current-session', JSON.stringify({
        version: 999,
        data: {}
      }));

      const loadResult = await loadGameSession();
      expect(loadResult.success).toBe(false);

      if (!loadResult.success) {
        expect(loadResult.error.code).toBe('CORRUPTED_DATA');
        expect(loadResult.error.message).toContain('schema version');
      }
    });
  });

  describe('Data Integrity', () => {
    it('should preserve complex nested structures', async () => {
      const sessionResult = await createGameSession(50);
      expect(sessionResult.success).toBe(true);
      if (!sessionResult.success) return;

      const session = sessionResult.data;

      // Find first two empty cells (not clues)
      let emptyCell1 = null;
      let emptyCell2 = null;
      let cell1Row = 0, cell1Col = 0;
      let cell2Row = 0, cell2Col = 0;

      for (let row = 0; row < 9 && (!emptyCell1 || !emptyCell2); row++) {
        for (let col = 0; col < 9 && (!emptyCell1 || !emptyCell2); col++) {
          const cell = session.cells[row]?.[col];
          if (cell && !cell.isClue) {
            if (!emptyCell1) {
              emptyCell1 = cell;
              cell1Row = row;
              cell1Col = col;
            } else if (!emptyCell2) {
              emptyCell2 = cell;
              cell2Row = row;
              cell2Col = col;
              break;
            }
          }
        }
      }

      // This should always be true for difficulty 50
      expect(emptyCell1).toBeTruthy();
      expect(emptyCell2).toBeTruthy();

      if (!emptyCell1 || !emptyCell2) return;

      // Add complex data
      emptyCell1.manualCandidates = new Set([1, 5, 9]);
      emptyCell1.autoCandidates = new Set([1, 3, 5, 7, 9]);
      emptyCell2.manualCandidates = new Set([2, 4, 6, 8]);

      // Save and load
      await saveGameSession(session);
      const loadResult = await loadGameSession();
      expect(loadResult.success).toBe(true);

      if (!loadResult.success) return;
      const loadedSession = loadResult.data;

      // Verify complex data preserved
      const loadedCell1 = loadedSession.cells[cell1Row]?.[cell1Col];
      const loadedCell2 = loadedSession.cells[cell2Row]?.[cell2Col];

      expect(Array.from(loadedCell1?.manualCandidates || [])).toEqual([1, 5, 9]);
      expect(Array.from(loadedCell1?.autoCandidates || [])).toEqual([1, 3, 5, 7, 9]);
      expect(Array.from(loadedCell2?.manualCandidates || [])).toEqual([2, 4, 6, 8]);
    });

    it('should preserve null vs undefined vs empty Set', async () => {
      const sessionResult = await createGameSession(50);
      expect(sessionResult.success).toBe(true);
      if (!sessionResult.success) return;

      const session = sessionResult.data;

      // Set different candidate states
      const cells = session.cells[0];
      if (cells && cells[0] && !cells[0].isClue) {
        cells[0].manualCandidates = new Set(); // Empty Set
        cells[0].autoCandidates = null; // Explicitly null
      }

      // Save and load
      await saveGameSession(session);
      const loadResult = await loadGameSession();
      expect(loadResult.success).toBe(true);

      if (!loadResult.success) return;
      const loadedSession = loadResult.data;

      const loadedCell = loadedSession.cells[0]?.[0];
      expect(loadedCell?.manualCandidates).toBeInstanceOf(Set);
      expect(loadedCell?.manualCandidates.size).toBe(0);
      expect(loadedCell?.autoCandidates).toBeNull();
    });
  });
});

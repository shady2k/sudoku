/**
 * StorageService Tests
 *
 * Tests for game state persistence to LocalStorage
 * Performance targets: <500ms save, <1s load (SC-011, SC-002)
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import type { GameSession } from '../../../src/lib/models/types';

// Mock localStorage
const mockLocalStorage = ((): Storage => {
  let store: Record<string, string> = {};

  return {
    getItem: (key: string): string | null => store[key] || null,
    setItem: (key: string, value: string): void => {
      store[key] = value;
    },
    removeItem: (key: string): void => {
      delete store[key];
    },
    clear: (): void => {
      store = {};
    },
    get length(): number {
      return Object.keys(store).length;
    },
    key: (index: number): string | null => Object.keys(store)[index] || null
  };
})();

// Replace global localStorage with mock
global.localStorage = mockLocalStorage as Storage;

// Import after mocking
import {
  saveGameSession,
  loadGameSession,
  deleteGameSession,
  hasSavedGame,
  isLocalStorageAvailable
} from '../../../src/lib/services/StorageService';

// Helper function to create mock game session
function createMockSession(): GameSession {
  const cells = Array.from({ length: 9 }, (_, row) =>
    Array.from({ length: 9 }, (_, col) => ({
      row,
      col,
      value: 0,
      isClue: false,
      isError: false,
      manualCandidates: new Set<number>(),
      autoCandidates: null
    }))
  );

  return {
    sessionId: 'test-session-123',
    puzzle: {
      grid: Array.from({ length: 9 }, () => Array(9).fill(0)),
      solution: Array.from({ length: 9 }, () => Array(9).fill(1)),
      clues: Array.from({ length: 9 }, () => Array(9).fill(false)),
      difficultyRating: 35,
      puzzleId: 'test-puzzle-123',
      generatedAt: Date.now()
    },
    board: Array.from({ length: 9 }, () => Array(9).fill(0)),
    cells,
    startTime: Date.now(),
    elapsedTime: 0,
    isPaused: false,
    pausedAt: null,
    difficultyLevel: 50,
    errorCount: 0,
    isCompleted: false,
    lastActivityAt: Date.now(),
    selectedCell: null,
    showAutoCandidates: false,
    history: {
      actions: [],
      currentIndex: 0,
      maxSize: 50
    }
  };
}

describe('StorageService', () => {
  beforeEach(() => {
    mockLocalStorage.clear();
    vi.restoreAllMocks();
  });

  afterEach(() => {
    mockLocalStorage.clear();
    vi.restoreAllMocks();
  });

  describe('isLocalStorageAvailable', () => {
    it('should return true when localStorage is available', () => {
      expect(isLocalStorageAvailable()).toBe(true);
    });
  });

  describe('saveGameSession', () => {
    it('should save game session to localStorage', async () => {
      const mockSession: GameSession = createMockSession();

      const result = await saveGameSession(mockSession);

      expect(result.success).toBe(true);

      const stored = mockLocalStorage.getItem('sudoku:current-session');
      expect(stored).toBeTruthy();
    });

    it('should complete save in <500ms (SC-011)', async () => {
      const mockSession: GameSession = createMockSession();

      const start = performance.now();
      await saveGameSession(mockSession);
      const elapsed = performance.now() - start;

      expect(elapsed).toBeLessThan(500);
    });

    it('should serialize Sets to Arrays', async () => {
      const mockSession: GameSession = createMockSession();
      mockSession.cells[0]![0]!.manualCandidates = new Set([1, 2, 3]);

      await saveGameSession(mockSession);

      const stored = mockLocalStorage.getItem('sudoku:current-session');
      expect(stored).toBeTruthy();

      if (stored) {
        const parsed = JSON.parse(stored);
        // Check that Set was converted to Array (data is wrapped in {version, data})
        expect(Array.isArray(parsed.data.cells[0][0].manualCandidates)).toBe(true);
      }
    });

    it('should handle quota exceeded error gracefully', async () => {
      const mockSession: GameSession = createMockSession();

      // Mock setItem to throw QuotaExceededError
      vi.spyOn(mockLocalStorage, 'setItem').mockImplementation(() => {
        const error = new Error('QuotaExceededError');
        error.name = 'QuotaExceededError';
        throw error;
      });

      const result = await saveGameSession(mockSession);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('STORAGE_QUOTA_EXCEEDED');
      }
    });
  });

  describe('loadGameSession - basic operations', () => {
    it('should load saved game session from localStorage', async () => {
      const mockSession: GameSession = createMockSession();
      await saveGameSession(mockSession);

      const result = await loadGameSession();

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.sessionId).toBe(mockSession.sessionId);
        expect(result.data.difficultyLevel).toBe(mockSession.difficultyLevel);
      }
    });

    it('should complete load in <1s (SC-002)', async () => {
      const mockSession: GameSession = createMockSession();
      await saveGameSession(mockSession);

      const start = performance.now();
      await loadGameSession();
      const elapsed = performance.now() - start;

      expect(elapsed).toBeLessThan(1000);
    });

    it('should deserialize Arrays back to Sets', async () => {
      const mockSession: GameSession = createMockSession();
      mockSession.cells[0]![0]!.manualCandidates = new Set([1, 2, 3]);
      await saveGameSession(mockSession);

      const result = await loadGameSession();

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.cells[0]![0]!.manualCandidates).toBeInstanceOf(Set);
        expect(result.data.cells[0]![0]!.manualCandidates.size).toBe(3);
      }
    });
  });

  describe('loadGameSession - error handling', () => {
    it('should return failure when no saved game exists', async () => {
      const result = await loadGameSession();

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('NO_SAVED_GAME');
      }
    });

    it('should handle corrupted data gracefully', async () => {
      // Store invalid JSON
      mockLocalStorage.setItem('sudoku:current-session', 'invalid json {');

      const result = await loadGameSession();

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('CORRUPTED_DATA');
      }
    });
  });

  describe('deleteGameSession', () => {
    it('should delete saved game session', async () => {
      const mockSession: GameSession = createMockSession();
      await saveGameSession(mockSession);

      expect(hasSavedGame()).toBe(true);

      const result = deleteGameSession();

      expect(result.success).toBe(true);
      expect(hasSavedGame()).toBe(false);
    });
  });

  describe('hasSavedGame', () => {
    it('should return true when saved game exists', async () => {
      const mockSession: GameSession = createMockSession();
      await saveGameSession(mockSession);

      expect(hasSavedGame()).toBe(true);
    });

    it('should return false when no saved game exists', () => {
      expect(hasSavedGame()).toBe(false);
    });
  });
});

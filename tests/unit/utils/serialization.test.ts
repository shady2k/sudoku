import { describe, it, expect } from 'vitest';
import {
  serializeSet,
  deserializeSet,
  serializeGameSession,
  deserializeGameSession,
  isValidGameSessionData
} from '../../../src/lib/utils/serialization';
import type { GameSession, Cell } from '../../../src/lib/models/types';

describe('serialization utilities', () => {
  describe('Set serialization', () => {
    it('should serialize Set to Array', () => {
      const set = new Set([1, 2, 3, 4, 5]);
      const array = serializeSet(set);

      expect(Array.isArray(array)).toBe(true);
      expect(array).toEqual([1, 2, 3, 4, 5]);
    });

    it('should deserialize Array to Set', () => {
      const array = [1, 2, 3, 4, 5];
      const set = deserializeSet(array);

      expect(set instanceof Set).toBe(true);
      expect(set.size).toBe(5);
      expect(set.has(1)).toBe(true);
      expect(set.has(5)).toBe(true);
    });

    it('should handle empty Set', () => {
      const set = new Set<number>();
      const array = serializeSet(set);
      const restored = deserializeSet(array);

      expect(array).toEqual([]);
      expect(restored.size).toBe(0);
    });

    it('should roundtrip correctly', () => {
      const original = new Set([1, 3, 5, 7, 9]);
      const serialized = serializeSet(original);
      const deserialized = deserializeSet(serialized);

      expect(deserialized).toEqual(original);
    });
  });

  describe('GameSession serialization', () => {
    const createTestGameSession = (): GameSession => {
      const grid = Array.from({ length: 9 }, () => Array(9).fill(0));
      const solution = Array.from({ length: 9 }, () => Array(9).fill(0));
      const clues = Array.from({ length: 9 }, () => Array(9).fill(false));

      // Create cells array
      const cells: Cell[][] = [];
      for (let row = 0; row < 9; row++) {
        cells[row] = [];
        for (let col = 0; col < 9; col++) {
          cells[row]![col] = {
            row,
            col,
            value: 0,
            isClue: false,
            isError: false,
            manualCandidates: new Set([1, 2, 3]),
            autoCandidates: new Set([4, 5, 6])
          };
        }
      }

      return {
        sessionId: 'test-session-123',
        puzzle: {
          grid,
          solution,
          clues,
          difficultyRating: 35,
          puzzleId: 'puzzle-123',
          generatedAt: Date.now()
        },
        board: grid,
        cells,
        startTime: Date.now(),
        elapsedTime: 12345,
        isPaused: false,
        pausedAt: null,
        difficultyLevel: 5,
        errorCount: 2,
        isCompleted: false,
        lastActivityAt: Date.now(),
        selectedCell: { row: 3, col: 4 },
        showAutoCandidates: true,
        history: {
          actions: [],
          currentIndex: 0,
          maxSize: 50
        }
      };
    };

    it('should serialize GameSession to JSON-compatible object', () => {
      const session = createTestGameSession();
      const serialized = serializeGameSession(session);

      expect(serialized).toBeDefined();
      expect(typeof serialized).toBe('object');

      // Check that Sets are converted to arrays
      const cell00 = (serialized.cells as any)[0][0];
      expect(Array.isArray(cell00.manualCandidates)).toBe(true);
      expect(Array.isArray(cell00.autoCandidates)).toBe(true);
    });

    it('should be JSON-stringify-able', () => {
      const session = createTestGameSession();
      const serialized = serializeGameSession(session);

      expect(() => JSON.stringify(serialized)).not.toThrow();
    });

    it('should deserialize back to GameSession', () => {
      const session = createTestGameSession();
      const serialized = serializeGameSession(session);
      const jsonString = JSON.stringify(serialized);
      const parsed = JSON.parse(jsonString);
      const result = deserializeGameSession(parsed);

      expect(result.success).toBe(true);
      if (result.success) {
        const deserialized = result.data;

        expect(deserialized.sessionId).toBe(session.sessionId);
        expect(deserialized.difficultyLevel).toBe(session.difficultyLevel);
        expect(deserialized.errorCount).toBe(session.errorCount);

        // Check Sets are restored
        const cell = deserialized.cells[0]?.[0];
        expect(cell).toBeDefined();
        if (cell) {
          expect(cell.manualCandidates instanceof Set).toBe(true);
          expect(cell.autoCandidates instanceof Set).toBe(true);
          expect(cell.manualCandidates.size).toBe(3);
          expect(cell.autoCandidates!.size).toBe(3);
        }
      }
    });

    it('should handle null autoCandidates', () => {
      const session = createTestGameSession();
      session.cells[0]![0]!.autoCandidates = null;

      const serialized = serializeGameSession(session);
      const result = deserializeGameSession(serialized);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.cells[0]?.[0]?.autoCandidates).toBeNull();
      }
    });

    it('should handle null selectedCell', () => {
      const session = createTestGameSession();
      session.selectedCell = null;

      const serialized = serializeGameSession(session);
      const result = deserializeGameSession(session);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.selectedCell).toBeNull();
      }
    });

    it('should fail on invalid data structure', () => {
      const invalid = { foo: 'bar' };
      const result = deserializeGameSession(invalid);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('CORRUPTED_DATA');
      }
    });

    it('should fail on missing required fields', () => {
      const incomplete = {
        sessionId: 'test',
        // missing other required fields
      };
      const result = deserializeGameSession(incomplete);

      expect(result.success).toBe(false);
    });
  });

  describe('isValidGameSessionData', () => {
    it('should validate valid session data', () => {
      const grid = Array.from({ length: 9 }, () => Array(9).fill(0));
      const cells: any[][] = [];
      for (let r = 0; r < 9; r++) {
        cells[r] = [];
        for (let c = 0; c < 9; c++) {
          cells[r]![c] = {
            row: r,
            col: c,
            value: 0,
            isClue: false,
            isError: false,
            manualCandidates: [],
            autoCandidates: null
          };
        }
      }

      const data = {
        sessionId: 'test',
        puzzle: {
          grid,
          solution: grid,
          clues: Array.from({ length: 9 }, () => Array(9).fill(false)),
          difficultyRating: 35,
          puzzleId: 'test',
          generatedAt: Date.now()
        },
        board: grid,
        cells,
        startTime: Date.now(),
        elapsedTime: 0,
        isPaused: false,
        pausedAt: null,
        difficultyLevel: 5,
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

      expect(isValidGameSessionData(data)).toBe(true);
    });

    it('should reject invalid data types', () => {
      expect(isValidGameSessionData(null)).toBe(false);
      expect(isValidGameSessionData(undefined)).toBe(false);
      expect(isValidGameSessionData('string')).toBe(false);
      expect(isValidGameSessionData(123)).toBe(false);
      expect(isValidGameSessionData([])).toBe(false);
    });

    it('should reject missing required fields', () => {
      const data = {
        sessionId: 'test'
        // missing other fields
      };

      expect(isValidGameSessionData(data)).toBe(false);
    });
  });
});

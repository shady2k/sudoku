/**
 * Difficulty Mapping Tests
 *
 * Tests the difficultyToClues function per T090 in tasks.md.
 * Validates the 0-100% difficulty scale maps to 17-50 clue range.
 */

import { describe, it, expect } from 'vitest';
import { difficultyToClues } from '../../../src/lib/utils/validation';

describe('Difficulty Mapping', () => {
  describe('difficultyToClues', () => {
    it('should map 0% difficulty to 50 clues (easiest)', () => {
      const clues = difficultyToClues(0);
      expect(clues).toBe(50);
    });

    it('should map 100% difficulty to 17 clues (hardest)', () => {
      const clues = difficultyToClues(100);
      expect(clues).toBe(17);
    });

    it('should map intermediate difficulty values correctly', () => {
      // Test some key points in the linear interpolation
      expect(difficultyToClues(25)).toBe(42); // 25% = 50 - 25*0.33 = 50 - 8.25 = 41.75 ≈ 42
      expect(difficultyToClues(50)).toBe(34); // 50% = 50 - 50*0.33 = 50 - 16.5 = 33.5 ≈ 34 (rounds up)
      expect(difficultyToClues(75)).toBe(25); // 75% = 50 - 75*0.33 = 50 - 24.75 = 25.25 ≈ 25
    });

    it('should return values within valid range for all valid inputs', () => {
      // Test the entire valid range
      for (let difficulty = 0; difficulty <= 100; difficulty += 5) {
        const clues = difficultyToClues(difficulty);
        expect(clues).toBeGreaterThanOrEqual(17);
        expect(clues).toBeLessThanOrEqual(50);
      }
    });

    it('should throw error for negative difficulty', () => {
      expect(() => difficultyToClues(-1)).toThrow('Invalid difficulty: -1%. Must be 0-100.');
      expect(() => difficultyToClues(-50)).toThrow('Invalid difficulty: -50%. Must be 0-100.');
    });

    it('should throw error for difficulty greater than 100', () => {
      expect(() => difficultyToClues(101)).toThrow('Invalid difficulty: 101%. Must be 0-100.');
      expect(() => difficultyToClues(150)).toThrow('Invalid difficulty: 150%. Must be 0-100.');
    });

    it('should handle boundary values correctly', () => {
      // Test exact boundaries
      expect(difficultyToClues(0)).toBe(50);
      expect(difficultyToClues(100)).toBe(17);

      // Test values that would round to boundaries
      expect(difficultyToClues(1)).toBe(50); // 50 - 1*0.33 = 49.67 ≈ 50
      expect(difficultyToClues(99)).toBe(17); // 50 - 99*0.33 = 17.33 ≈ 17
    });

    it('should be monotonic decreasing (higher difficulty = fewer clues)', () => {
      let previousClues = 51; // Start with value higher than maximum

      for (let difficulty = 0; difficulty <= 100; difficulty++) {
        const clues = difficultyToClues(difficulty);
        expect(clues).toBeLessThanOrEqual(previousClues);
        previousClues = clues;
      }
    });

    it('should work with floating point difficulty values', () => {
      // Test decimal values
      expect(difficultyToClues(33.3)).toBe(39); // 50 - 33.3*0.33 ≈ 39
      expect(difficultyToClues(66.6)).toBe(28); // 50 - 66.6*0.33 ≈ 28
      expect(difficultyToClues(12.5)).toBe(46); // 50 - 12.5*0.33 ≈ 46
    });

    it('should handle mathematical edge cases correctly', () => {
      // Test values that would result in exact .5 rounding
      expect(difficultyToClues(50)).toBe(34); // 50 - 50*0.33 = 16.5, 50-16.5 = 33.5 ≈ 34 (rounds up)

      // Test values near mathematical boundaries
      expect(difficultyToClues(3)).toBe(49); // 50 - 3*0.33 = 49.01 ≈ 49
      expect(difficultyToClues(97)).toBe(18); // 50 - 97*0.33 = 17.99 ≈ 18
    });
  });

  describe('Practical Difficulty Ranges', () => {
    it('should provide reasonable clue counts for common difficulty levels', () => {
      // Common difficulty levels based on typical Sudoku difficulty classifications
      const commonLevels = [
        { difficulty: 10, expectedClues: 47, description: 'Very Easy' },
        { difficulty: 20, expectedClues: 43, description: 'Easy' },
        { difficulty: 35, expectedClues: 38, description: 'Medium' },
        { difficulty: 50, expectedClues: 34, description: 'Hard' },
        { difficulty: 70, expectedClues: 27, description: 'Expert' },
        { difficulty: 85, expectedClues: 22, description: 'Master' },
        { difficulty: 100, expectedClues: 17, description: 'Genius' }
      ];

      commonLevels.forEach(({ difficulty, expectedClues, description }) => {
        const actualClues = difficultyToClues(difficulty);
        expect(actualClues).toBeCloseTo(expectedClues, 0,
          `${description} (${difficulty}% difficulty) should have ~${expectedClues} clues`);
      });
    });
  });
});
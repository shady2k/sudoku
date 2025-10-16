import { describe, it, expect } from 'vitest';
import { SeededRandom } from '../../../src/lib/utils/seededRandom';

describe('SeededRandom', () => {
  describe('constructor', () => {
    it('should create instance with given seed', () => {
      const rng = new SeededRandom(12345);
      expect(rng).toBeDefined();
    });

    it('should use Date.now() as default seed', () => {
      const rng = new SeededRandom();
      expect(rng).toBeDefined();
    });
  });

  describe('next', () => {
    it('should generate reproducible sequence with same seed', () => {
      const rng1 = new SeededRandom(42);
      const rng2 = new SeededRandom(42);

      const sequence1 = Array.from({ length: 10 }, () => rng1.next());
      const sequence2 = Array.from({ length: 10 }, () => rng2.next());

      expect(sequence1).toEqual(sequence2);
    });

    it('should generate different sequence with different seed', () => {
      const rng1 = new SeededRandom(42);
      const rng2 = new SeededRandom(123);

      const sequence1 = Array.from({ length: 10 }, () => rng1.next());
      const sequence2 = Array.from({ length: 10 }, () => rng2.next());

      expect(sequence1).not.toEqual(sequence2);
    });

    it('should generate numbers between 0 and 1', () => {
      const rng = new SeededRandom(42);

      for (let i = 0; i < 100; i++) {
        const value = rng.next();
        expect(value).toBeGreaterThanOrEqual(0);
        expect(value).toBeLessThan(1);
      }
    });

    it('should generate uniform distribution', () => {
      const rng = new SeededRandom(42);
      const samples = 10000;
      const buckets = new Array(10).fill(0);

      for (let i = 0; i < samples; i++) {
        const value = rng.next();
        const bucket = Math.floor(value * 10);
        buckets[bucket]++;
      }

      // Each bucket should have roughly 10% of samples (1000 ± 200)
      buckets.forEach(count => {
        expect(count).toBeGreaterThan(800);
        expect(count).toBeLessThan(1200);
      });
    });
  });

  describe('nextInt', () => {
    it('should generate integer in range [0, max)', () => {
      const rng = new SeededRandom(42);

      for (let i = 0; i < 100; i++) {
        const value = rng.nextInt(10);
        expect(value).toBeGreaterThanOrEqual(0);
        expect(value).toBeLessThan(10);
        expect(Number.isInteger(value)).toBe(true);
      }
    });

    it('should generate reproducible integers', () => {
      const rng1 = new SeededRandom(42);
      const rng2 = new SeededRandom(42);

      const sequence1 = Array.from({ length: 10 }, () => rng1.nextInt(100));
      const sequence2 = Array.from({ length: 10 }, () => rng2.nextInt(100));

      expect(sequence1).toEqual(sequence2);
    });
  });

  describe('shuffle', () => {
    it('should shuffle array in place', () => {
      const rng = new SeededRandom(42);
      const original = [1, 2, 3, 4, 5, 6, 7, 8, 9];
      const array = [...original];

      rng.shuffle(array);

      // Array should be different from original
      expect(array).not.toEqual(original);

      // But should contain same elements
      expect(array.sort((a, b) => a - b)).toEqual(original);
    });

    it('should produce reproducible shuffle', () => {
      const rng1 = new SeededRandom(42);
      const rng2 = new SeededRandom(42);

      const array1 = [1, 2, 3, 4, 5, 6, 7, 8, 9];
      const array2 = [1, 2, 3, 4, 5, 6, 7, 8, 9];

      rng1.shuffle(array1);
      rng2.shuffle(array2);

      expect(array1).toEqual(array2);
    });

    it('should handle empty array', () => {
      const rng = new SeededRandom(42);
      const array: number[] = [];

      expect(() => rng.shuffle(array)).not.toThrow();
      expect(array).toEqual([]);
    });

    it('should handle single element array', () => {
      const rng = new SeededRandom(42);
      const array = [1];

      rng.shuffle(array);
      expect(array).toEqual([1]);
    });
  });

  describe('choice', () => {
    it('should pick random element from array', () => {
      const rng = new SeededRandom(42);
      const array = [1, 2, 3, 4, 5];

      for (let i = 0; i < 10; i++) {
        const element = rng.choice(array);
        expect(array).toContain(element);
      }
    });

    it('should pick reproducible element', () => {
      const rng1 = new SeededRandom(42);
      const rng2 = new SeededRandom(42);
      const array = [1, 2, 3, 4, 5];

      const choices1 = Array.from({ length: 10 }, () => rng1.choice(array));
      const choices2 = Array.from({ length: 10 }, () => rng2.choice(array));

      expect(choices1).toEqual(choices2);
    });

    it('should throw on empty array', () => {
      const rng = new SeededRandom(42);
      const array: number[] = [];

      expect(() => rng.choice(array)).toThrow();
    });
  });

  describe('getSeed', () => {
    it('should return the current seed', () => {
      const rng = new SeededRandom(12345);
      expect(rng.getSeed()).toBe(12345);
    });
  });

  describe('reset', () => {
    it('should reset to original seed', () => {
      const rng = new SeededRandom(42);

      const sequence1 = Array.from({ length: 5 }, () => rng.next());
      rng.reset();
      const sequence2 = Array.from({ length: 5 }, () => rng.next());

      expect(sequence1).toEqual(sequence2);
    });

    it('should reset to new seed if provided', () => {
      const rng = new SeededRandom(42);

      Array.from({ length: 5 }, () => rng.next());
      rng.reset(123);

      const sequence1 = Array.from({ length: 5 }, () => rng.next());

      const rng2 = new SeededRandom(123);
      const sequence2 = Array.from({ length: 5 }, () => rng2.next());

      expect(sequence1).toEqual(sequence2);
    });
  });
});

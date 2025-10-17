/**
 * Seeded Random Number Generator
 *
 * Provides deterministic pseudo-random number generation for reproducible puzzle creation.
 * Uses Linear Congruential Generator (LCG) algorithm.
 *
 * Benefits:
 * - Reproducible puzzles from seed
 * - Share puzzles via seed number
 * - Consistent testing
 * - Debug reported issues
 */

/**
 * Seeded random number generator using LCG algorithm
 *
 * LCG Formula: X(n+1) = (a * X(n) + c) mod m
 * Parameters chosen for good distribution:
 * - a = 1664525 (multiplier)
 * - c = 1013904223 (increment)
 * - m = 2^32 (modulus)
 *
 * These are the same parameters used in Numerical Recipes and glibc
 */
export class SeededRandom {
  private seed: number;
  private initialSeed: number;

  /**
   * Creates a new seeded random number generator
   * @param seed - Initial seed value (defaults to Date.now())
   */
  constructor(seed?: number) {
    this.initialSeed = seed ?? Date.now();
    this.seed = this.initialSeed;
  }

  /**
   * Generates the next random number in [0, 1)
   * @returns A pseudo-random float between 0 (inclusive) and 1 (exclusive)
   */
  next(): number {
    // LCG formula: X(n+1) = (a * X(n) + c) mod m
    // a = 1664525, c = 1013904223, m = 2^32
    this.seed = (this.seed * 1664525 + 1013904223) >>> 0; // >>> 0 ensures 32-bit unsigned integer

    // Convert to [0, 1) range
    return this.seed / 0x100000000; // 2^32
  }

  /**
   * Generates a random integer in [0, max)
   * @param max - Upper bound (exclusive)
   * @returns Integer between 0 (inclusive) and max (exclusive)
   */
  nextInt(max: number): number {
    if (max <= 0 || !Number.isInteger(max)) {
      throw new Error(`Invalid max: ${max}. Must be a positive integer.`);
    }

    return Math.floor(this.next() * max);
  }

  /**
   * Shuffles an array in place using Fisher-Yates algorithm
   * @param array - Array to shuffle (modified in place)
   * @returns The same array reference (for chaining)
   *
   * Time complexity: O(n)
   * Space complexity: O(1)
   */
  shuffle<T>(array: T[]): T[] {
    for (let i = array.length - 1; i > 0; i--) {
      const j = this.nextInt(i + 1);
      // Swap elements i and j
      const temp = array[i];
      const elemJ = array[j];
      if (temp !== undefined && elemJ !== undefined) {
        array[i] = elemJ;
        array[j] = temp;
      }
    }
    return array;
  }

  /**
   * Picks a random element from an array
   * @param array - Array to pick from
   * @returns Random element from the array
   * @throws Error if array is empty
   */
  choice<T>(array: readonly T[]): T {
    if (array.length === 0) {
      throw new Error('Cannot choose from empty array');
    }

    const index = this.nextInt(array.length);
    const element = array[index];
    if (element === undefined) {
      throw new Error(`Array element at index ${index} is undefined`);
    }
    return element;
  }

  /**
   * Gets the current seed value
   * Useful for saving/sharing puzzle seeds
   */
  getSeed(): number {
    return this.initialSeed;
  }

  /**
   * Resets the generator to initial seed or a new seed
   * @param newSeed - Optional new seed to use
   */
  reset(newSeed?: number): void {
    if (newSeed !== undefined) {
      this.initialSeed = newSeed;
    }
    this.seed = this.initialSeed;
  }

  /**
   * Creates a copy of this RNG with the same initial seed
   * Useful for branching random sequences
   */
  clone(): SeededRandom {
    return new SeededRandom(this.initialSeed);
  }

  /**
   * Generates a random float in [min, max)
   * @param min - Lower bound (inclusive)
   * @param max - Upper bound (exclusive)
   */
  nextFloat(min: number, max: number): number {
    if (min >= max) {
      throw new Error(`Invalid range: [${min}, ${max}). Min must be less than max.`);
    }

    return min + this.next() * (max - min);
  }

  /**
   * Generates a random integer in [min, max]
   * @param min - Lower bound (inclusive)
   * @param max - Upper bound (inclusive)
   */
  nextIntRange(min: number, max: number): number {
    if (min > max || !Number.isInteger(min) || !Number.isInteger(max)) {
      throw new Error(`Invalid range: [${min}, ${max}]. Both must be integers and min <= max.`);
    }

    return min + this.nextInt(max - min + 1);
  }

  /**
   * Generates a random boolean with given probability
   * @param probability - Probability of true (0-1)
   * @returns true with given probability
   */
  nextBoolean(probability = 0.5): boolean {
    if (probability < 0 || probability > 1) {
      throw new Error(`Invalid probability: ${probability}. Must be between 0 and 1.`);
    }

    return this.next() < probability;
  }
}

/**
 * Creates a seeded random number generator
 * @param seed - Optional seed value
 */
export function createSeededRandom(seed?: number): SeededRandom {
  return new SeededRandom(seed);
}

/**
 * Generates a random seed value for puzzle generation
 * Uses timestamp combined with random noise for uniqueness
 */
export function generatePuzzleSeed(): number {
  // Combine timestamp with Math.random() for additional entropy
  // This ensures unique seeds even when called multiple times in same millisecond
  return (Date.now() * 1000 + Math.floor(Math.random() * 1000)) >>> 0;
}
/**
 * Game Validator Tests
 *
 * Test-first development for candidate generation and validation logic.
 * Tests per T081 in tasks.md.
 */

import { describe, it, expect } from 'vitest';
import { generateCandidates } from '../../../src/lib/services/GameValidator';

describe('GameValidator - generateCandidates', () => {
  // Test data setup
  const emptyBoard = Array(9).fill(null).map(() => Array(9).fill(0));

  const partiallyFilledBoard = [
    [5, 3, 0, 0, 7, 0, 0, 0, 0],
    [6, 0, 0, 1, 9, 5, 0, 0, 0],
    [0, 9, 8, 0, 0, 0, 0, 6, 0],
    [8, 0, 0, 0, 6, 0, 0, 0, 3],
    [4, 0, 0, 8, 0, 3, 0, 0, 1],
    [7, 0, 0, 0, 2, 0, 0, 0, 6],
    [0, 6, 0, 0, 0, 0, 2, 8, 0],
    [0, 0, 0, 4, 1, 9, 0, 0, 5],
    [0, 0, 0, 0, 8, 0, 0, 7, 9]
  ];

  const filledBoard = [
    [5, 3, 4, 6, 7, 8, 9, 1, 2],
    [6, 7, 2, 1, 9, 5, 3, 4, 8],
    [1, 9, 8, 3, 4, 2, 5, 6, 7],
    [8, 5, 9, 7, 6, 1, 4, 2, 3],
    [4, 2, 6, 8, 5, 3, 7, 9, 1],
    [7, 1, 3, 9, 2, 4, 8, 5, 6],
    [9, 6, 1, 5, 3, 7, 2, 8, 4],
    [2, 8, 7, 4, 1, 9, 6, 3, 5],
    [3, 4, 5, 2, 8, 6, 1, 7, 9]
  ];

  it('should return empty candidates for completely filled board', () => {
    const candidates = generateCandidates(filledBoard);
    expect(candidates.size).toBe(0);
  });

  it('should return all candidates (1-9) for completely empty board', () => {
    const candidates = generateCandidates(emptyBoard);

    // All 81 cells should be empty with all possible candidates
    expect(candidates.size).toBe(81);

    // Check first cell has all candidates
    const firstCellKey = '0,0';
    expect(candidates.get(firstCellKey)).toEqual(new Set([1, 2, 3, 4, 5, 6, 7, 8, 9]));

    // Check middle cell has all candidates
    const middleCellKey = '4,4';
    expect(candidates.get(middleCellKey)).toEqual(new Set([1, 2, 3, 4, 5, 6, 7, 8, 9]));
  });

  it('should correctly calculate candidates for partially filled board', () => {
    const candidates = generateCandidates(partiallyFilledBoard);

    // Should have candidates for empty cells only
    expect(candidates.size).toBeGreaterThan(0);
    expect(candidates.size).toBeLessThan(81);

    // Cell (0,2) should exclude row values: 5, 3, 7
    // And box values: 5, 3, 6, 9, 8
    const cell02Key = '0,2';
    const cell02Candidates = candidates.get(cell02Key);
    expect(cell02Candidates).toBeDefined();
    expect(cell02Candidates).not.toContain(5);
    expect(cell02Candidates).not.toContain(3);
    expect(cell02Candidates).not.toContain(7);
    expect(cell02Candidates).not.toContain(6);
    expect(cell02Candidates).not.toContain(9);
    expect(cell02Candidates).not.toContain(8);
  });

  it('should handle edge case - top-left corner cell', () => {
    const testBoard = [
      [1, 0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0, 0]
    ];

    const candidates = generateCandidates(testBoard);

    // Cell (0,1) should exclude 1 (row), nothing else in column or box
    const cell01Key = '0,1';
    const cell01Candidates = candidates.get(cell01Key);
    expect(cell01Candidates).toEqual(new Set([2, 3, 4, 5, 6, 7, 8, 9]));
  });

  it('should handle edge case - center cell (4,4)', () => {
    const testBoard = [
      [0, 0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 1, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0, 0]
    ];

    const candidates = generateCandidates(testBoard);

    // Cell (4,4) should be empty (value 1)
    // Adjacent cells should exclude 1
    const cell44Key = '4,4';
    const cell44Candidates = candidates.get(cell44Key);
    expect(cell44Candidates).toBeUndefined(); // Cell is filled with 1

    // Cell (3,3) should exclude 1 from box
    const cell33Key = '3,3';
    const cell33Candidates = candidates.get(cell33Key);
    expect(cell33Candidates).toBeDefined();
    expect(cell33Candidates).not.toContain(1);
  });

  it('should return empty Set for filled cells', () => {
    const candidates = generateCandidates(partiallyFilledBoard);

    // Filled cells should not be in the candidates map
    const filledCellKey = '0,0'; // Contains 5
    expect(candidates.get(filledCellKey)).toBeUndefined();

    const anotherFilledKey = '1,3'; // Contains 1
    expect(candidates.get(anotherFilledKey)).toBeUndefined();
  });

  it('should correctly handle complex Sudoku constraints', () => {
    // This test ensures all three Sudoku rules are applied
    const complexBoard = [
      [5, 3, 0, 0, 7, 0, 0, 0, 0],
      [6, 0, 0, 1, 9, 5, 0, 0, 0],
      [0, 9, 8, 0, 0, 0, 0, 6, 0],
      [8, 0, 0, 0, 6, 0, 0, 0, 3],
      [4, 0, 0, 8, 0, 3, 0, 0, 1],
      [7, 0, 0, 0, 2, 0, 0, 0, 6],
      [0, 6, 0, 0, 0, 0, 2, 8, 0],
      [0, 0, 0, 4, 1, 9, 0, 0, 5],
      [0, 0, 0, 0, 8, 0, 0, 7, 9]
    ];

    const candidates = generateCandidates(complexBoard);

    // Check cell (2,0) - should exclude from row: 9,8,6; col: 5,6,8,4,7; box: 5,3,6,9,8
    const cell20Key = '2,0';
    const cell20Candidates = candidates.get(cell20Key);
    expect(cell20Candidates).toBeDefined();

    const excludedFromRow = new Set([9, 8, 6]);
    const excludedFromCol = new Set([5, 6, 8, 4, 7]);
    const excludedFromBox = new Set([5, 3, 6, 9, 8]);

    const allExcluded = new Set([...excludedFromRow, ...excludedFromCol, ...excludedFromBox]);
    const expectedCandidates = new Set([1, 2, 3, 4, 5, 6, 7, 8, 9].filter(n => !allExcluded.has(n)));

    expect(cell20Candidates).toEqual(expectedCandidates);
  });

  it('should be performant - complete in under 10ms', () => {
    const startTime = performance.now();

    // Run multiple times to check performance
    for (let i = 0; i < 10; i++) {
      generateCandidates(partiallyFilledBoard);
    }

    const endTime = performance.now();
    const averageTime = (endTime - startTime) / 10;

    // Should complete in under 10ms per Constitution Principle II
    expect(averageTime).toBeLessThan(10);
  });

  it('should handle invalid input gracefully', () => {
    // Test with malformed board
    const invalidBoard = [
      [5, 3, 10], // Invalid value > 9
      [6], // Too short row
      [] as any, // Missing row
      // Missing rows 3-8
    ] as any;

    expect(() => {
      generateCandidates(invalidBoard);
    }).not.toThrow();
  });
});

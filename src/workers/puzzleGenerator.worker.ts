/**
 * Web Worker for Puzzle Generation
 *
 * Runs puzzle generation in a background thread to keep UI responsive
 */

import { generatePuzzle } from '../lib/services/PuzzleGenerator';
import type { DifficultyLevel, Puzzle, Result } from '../lib/models/types';

// Message types
interface GenerateMessage {
  type: 'generate';
  difficulty: DifficultyLevel;
  seed?: number;
}

interface GenerateResponse {
  type: 'result';
  result: Result<Puzzle>;
}

// Worker message handler
self.onmessage = async (e: MessageEvent<GenerateMessage>): Promise<void> => {
  if (e.data.type === 'generate') {
    const { difficulty, seed } = e.data;

    // Generate puzzle in worker thread (non-blocking)
    const result = await generatePuzzle(difficulty, seed);

    // Send result back to main thread
    const response: GenerateResponse = {
      type: 'result',
      result
    };

    self.postMessage(response);
  }
};

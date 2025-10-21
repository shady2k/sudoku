/**
 * Puzzle Generator Worker Service
 *
 * Provides a non-blocking interface to puzzle generation using Web Workers
 * Falls back to direct generation in test environments
 */

import type { DifficultyLevel, Puzzle, Result } from '../models/types';

let worker: Worker | null = null;
let PuzzleWorker: { new(): Worker } | null = null;

// Check if we're in a browser environment with Worker support
const isWorkerSupported = typeof Worker !== 'undefined';

/**
 * Generate a puzzle using a Web Worker (non-blocking) or fallback
 */
export async function generatePuzzleInWorker(
  difficulty: DifficultyLevel,
  seed?: number
): Promise<Result<Puzzle>> {
  // Fallback for test environment or when Workers aren't supported
  if (!isWorkerSupported) {
    const { generatePuzzle } = await import('./PuzzleGenerator');
    return generatePuzzle(difficulty, seed);
  }

  // Lazy load the worker module
  if (!PuzzleWorker) {
    try {
      const workerModule = await import('../../workers/puzzleGenerator.worker?worker');
      PuzzleWorker = workerModule.default;
    } catch {
      // Fallback if worker import fails
      const { generatePuzzle } = await import('./PuzzleGenerator');
      return generatePuzzle(difficulty, seed);
    }
  }

  // Create worker if not already created
  if (!worker && PuzzleWorker) {
    try {
      worker = new PuzzleWorker();
    } catch {
      // Fallback if worker creation fails
      const { generatePuzzle } = await import('./PuzzleGenerator');
      return generatePuzzle(difficulty, seed);
    }
  }

  return new Promise((resolve) => {
    if (!worker) {
      // Fallback
      import('./PuzzleGenerator').then(({ generatePuzzle }) => {
        generatePuzzle(difficulty, seed).then(resolve);
      });
      return;
    }

    // Set up one-time message listener
    const handleMessage = (e: MessageEvent): void => {
      if (e.data.type === 'result') {
        worker?.removeEventListener('message', handleMessage);
        resolve(e.data.result);
      }
    };

    worker.addEventListener('message', handleMessage);

    // Send generation request to worker
    worker.postMessage({
      type: 'generate',
      difficulty,
      seed
    });
  });
}

/**
 * Terminate the worker (cleanup)
 */
export function terminateWorker(): void {
  if (worker) {
    worker.terminate();
    worker = null;
  }
}

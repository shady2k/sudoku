/**
 * TimerService Tests
 *
 * Tests for timer-related functions including idle detection
 */

import { describe, it, expect } from 'vitest';
import { updateTimer, pauseTimer, resumeTimer, shouldAutoPause, formatTime } from '../../../src/lib/services/TimerService';
import type { GameSession } from '../../../src/lib/models/types';

// Helper to create minimal test session
function createTestSession(overrides?: Partial<GameSession>): GameSession {
  const now = Date.now();

  return {
    sessionId: 'test-session',
    puzzle: {
      grid: Array(9).fill(null).map(() => Array(9).fill(0)),
      solution: Array(9).fill(null).map(() => Array(9).fill(1)),
      clues: Array(9).fill(null).map(() => Array(9).fill(false)),
      difficultyRating: 40,
      puzzleId: 'test-puzzle',
      generatedAt: now
    },
    board: Array(9).fill(null).map(() => Array(9).fill(0)),
    cells: Array(9).fill(null).map(() =>
      Array(9).fill(null).map(() => ({
        row: 0,
        col: 0,
        value: 0,
        isClue: false,
        isError: false,
        manualCandidates: new Set(),
        autoCandidates: null
      }))
    ),
    startTime: now,
    elapsedTime: 0,
    isPaused: false,
    pausedAt: null,
    difficultyLevel: 50,
    errorCount: 0,
    isCompleted: false,
    lastActivityAt: now,
    lastTimerUpdate: now,
    selectedCell: null,
    showAutoCandidates: false,
    highlightedNumber: null,
    history: {
      actions: [],
      currentIndex: 0,
      maxSize: 50
    },
    ...overrides
  };
}

describe('TimerService', () => {
  describe('updateTimer', () => {
    it('should update elapsed time when not paused', () => {
      const session = createTestSession({ elapsedTime: 0 });
      const currentTime = session.lastActivityAt + 5000; // 5 seconds later

      const updated = updateTimer(session, currentTime);

      expect(updated.elapsedTime).toBe(5000);
      expect(updated.lastActivityAt).toBe(session.lastActivityAt); // Unchanged - only user actions update this
    });

    it('should not update elapsed time when paused', () => {
      const session = createTestSession({
        elapsedTime: 10000,
        isPaused: true,
        pausedAt: Date.now()
      });
      const currentTime = session.lastActivityAt + 5000;

      const updated = updateTimer(session, currentTime);

      expect(updated.elapsedTime).toBe(10000); // Unchanged
      expect(updated.lastActivityAt).toBe(session.lastActivityAt); // Unchanged
    });

    it('should not update elapsed time when completed', () => {
      const session = createTestSession({
        elapsedTime: 30000,
        isCompleted: true
      });
      const currentTime = session.lastActivityAt + 5000;

      const updated = updateTimer(session, currentTime);

      expect(updated.elapsedTime).toBe(30000); // Unchanged
    });

    it('should accumulate elapsed time correctly', () => {
      const session = createTestSession({ elapsedTime: 10000 });
      const time1 = session.lastActivityAt + 3000;
      const time2 = time1 + 2000;

      const updated1 = updateTimer(session, time1);
      const updated2 = updateTimer(updated1, time2);

      // With the fix: each update calculates delta from lastTimerUpdate
      // First update: 10000 + 3000 = 13000
      // Second update: 13000 + 2000 = 15000 (time2 - lastTimerUpdate)
      expect(updated2.elapsedTime).toBe(15000); // 10000 + 3000 + 2000
    });
  });

  describe('pauseTimer', () => {
    it('should pause timer and set pausedAt', () => {
      const session = createTestSession({ elapsedTime: 5000 });
      const pauseTime = session.lastActivityAt + 2000;

      const paused = pauseTimer(session, pauseTime);

      expect(paused.isPaused).toBe(true);
      expect(paused.pausedAt).toBe(pauseTime);
      expect(paused.elapsedTime).toBe(7000); // Updated before pausing
    });

    it('should be idempotent when already paused', () => {
      const session = createTestSession({
        elapsedTime: 10000,
        isPaused: true,
        pausedAt: Date.now()
      });
      const pauseTime = session.pausedAt! + 5000;

      const paused = pauseTimer(session, pauseTime);

      expect(paused.isPaused).toBe(true);
      expect(paused.pausedAt).toBe(session.pausedAt); // Unchanged
      expect(paused.elapsedTime).toBe(10000); // Unchanged
    });

    it('should update elapsed time before pausing', () => {
      const now = Date.now();
      const session = createTestSession({
        elapsedTime: 0,
        lastActivityAt: now
      });
      const pauseTime = now + 10000; // 10 seconds later

      const paused = pauseTimer(session, pauseTime);

      expect(paused.elapsedTime).toBe(10000);
      expect(paused.isPaused).toBe(true);
    });
  });

  describe('resumeTimer', () => {
    it('should resume timer and clear pausedAt', () => {
      const pausedSession = createTestSession({
        elapsedTime: 15000,
        isPaused: true,
        pausedAt: Date.now()
      });
      const resumeTime = pausedSession.pausedAt! + 60000; // 1 minute later

      const resumed = resumeTimer(pausedSession, resumeTime);

      expect(resumed.isPaused).toBe(false);
      expect(resumed.pausedAt).toBe(null);
      expect(resumed.lastActivityAt).toBe(resumeTime);
      expect(resumed.elapsedTime).toBe(15000); // Unchanged during pause
    });

    it('should be idempotent when not paused', () => {
      const session = createTestSession({
        elapsedTime: 20000,
        isPaused: false
      });
      const resumeTime = session.lastActivityAt + 5000;

      const resumed = resumeTimer(session, resumeTime);

      expect(resumed.isPaused).toBe(false);
      expect(resumed.pausedAt).toBe(null);
      expect(resumed.lastActivityAt).toBe(session.lastActivityAt); // Unchanged
    });
  });

  describe('shouldAutoPause (idle detection)', () => {
    it('should return true when inactive for 3 minutes (default)', () => {
      const now = Date.now();
      const session = createTestSession({
        lastActivityAt: now,
        isPaused: false
      });
      const currentTime = now + (3 * 60 * 1000); // Exactly 3 minutes

      expect(shouldAutoPause(session, currentTime)).toBe(true);
    });

    it('should return true when inactive for more than 3 minutes', () => {
      const now = Date.now();
      const session = createTestSession({
        lastActivityAt: now,
        isPaused: false
      });
      const currentTime = now + (5 * 60 * 1000); // 5 minutes

      expect(shouldAutoPause(session, currentTime)).toBe(true);
    });

    it('should return false when inactive for less than 3 minutes', () => {
      const now = Date.now();
      const session = createTestSession({
        lastActivityAt: now,
        isPaused: false
      });
      const currentTime = now + (2 * 60 * 1000) + (59 * 1000); // 2:59

      expect(shouldAutoPause(session, currentTime)).toBe(false);
    });

    it('should return false when already paused', () => {
      const now = Date.now();
      const session = createTestSession({
        lastActivityAt: now,
        isPaused: true,
        pausedAt: now
      });
      const currentTime = now + (5 * 60 * 1000); // 5 minutes

      expect(shouldAutoPause(session, currentTime)).toBe(false);
    });

    it('should return false when game is completed', () => {
      const now = Date.now();
      const session = createTestSession({
        lastActivityAt: now,
        isCompleted: true
      });
      const currentTime = now + (5 * 60 * 1000); // 5 minutes

      expect(shouldAutoPause(session, currentTime)).toBe(false);
    });

    it('should support custom auto-pause timeout', () => {
      const now = Date.now();
      const session = createTestSession({
        lastActivityAt: now,
        isPaused: false
      });
      const currentTime = now + (5 * 60 * 1000); // 5 minutes
      const customTimeout = 5; // 5 minutes

      expect(shouldAutoPause(session, currentTime, customTimeout)).toBe(true);
    });

    it('should not auto-pause before custom timeout', () => {
      const now = Date.now();
      const session = createTestSession({
        lastActivityAt: now,
        isPaused: false
      });
      const currentTime = now + (4 * 60 * 1000); // 4 minutes
      const customTimeout = 5; // 5 minutes

      expect(shouldAutoPause(session, currentTime, customTimeout)).toBe(false);
    });

    it('should handle edge case at exact threshold', () => {
      const now = Date.now();
      const session = createTestSession({
        lastActivityAt: now,
        isPaused: false
      });
      const threshold = 3 * 60 * 1000;
      const currentTime = now + threshold;

      expect(shouldAutoPause(session, currentTime)).toBe(true);
    });

    it('should handle very short timeouts (1 second)', () => {
      const now = Date.now();
      const session = createTestSession({
        lastActivityAt: now,
        isPaused: false
      });
      const currentTime = now + 1001; // 1.001 seconds
      const customTimeout = 1 / 60; // 1 second (in minutes)

      expect(shouldAutoPause(session, currentTime, customTimeout)).toBe(true);
    });
  });

  describe('formatTime', () => {
    it('should format time under 1 hour as MM:SS', () => {
      expect(formatTime(0)).toBe('00:00');
      expect(formatTime(1000)).toBe('00:01');
      expect(formatTime(59000)).toBe('00:59');
      expect(formatTime(60000)).toBe('01:00');
      expect(formatTime(3599000)).toBe('59:59');
    });

    it('should format time over 1 hour as H:MM:SS', () => {
      expect(formatTime(3600000)).toBe('1:00:00');
      expect(formatTime(3661000)).toBe('1:01:01');
      expect(formatTime(7200000)).toBe('2:00:00');
      expect(formatTime(36000000)).toBe('10:00:00');
    });

    it('should pad minutes and seconds with leading zeros', () => {
      expect(formatTime(5000)).toBe('00:05');
      expect(formatTime(65000)).toBe('01:05');
      expect(formatTime(3605000)).toBe('1:00:05');
    });

    it('should handle very long times', () => {
      const hours99 = 99 * 60 * 60 * 1000;
      expect(formatTime(hours99)).toBe('99:00:00');
    });

    it('should truncate milliseconds', () => {
      expect(formatTime(1999)).toBe('00:01');
      expect(formatTime(59999)).toBe('00:59');
    });
  });

  describe('Timer integration scenarios', () => {
    it('should correctly handle pause-resume-update cycle', () => {
      const now = Date.now();
      const session = createTestSession({ elapsedTime: 0, lastActivityAt: now });

      // Play for 10 seconds
      const time1 = now + 10000;
      const updated1 = updateTimer(session, time1);
      expect(updated1.elapsedTime).toBe(10000);

      // Pause
      const pauseTime = time1 + 5000;
      const paused = pauseTimer(updated1, pauseTime);
      expect(paused.elapsedTime).toBe(15000);
      expect(paused.isPaused).toBe(true);

      // Resume after 1 minute
      const resumeTime = pauseTime + 60000;
      const resumed = resumeTimer(paused, resumeTime);
      expect(resumed.elapsedTime).toBe(15000); // No change during pause
      expect(resumed.isPaused).toBe(false);

      // Continue playing for 5 seconds
      const time2 = resumeTime + 5000;
      const updated2 = updateTimer(resumed, time2);
      expect(updated2.elapsedTime).toBe(20000);
    });

    it('should auto-pause at lastActivityAt timestamp per FR-017 clarification', () => {
      const now = Date.now();
      const session = createTestSession({
        lastActivityAt: now,
        lastTimerUpdate: now,
        elapsedTime: 60000 // 1 minute played
      });

      // 3 minutes pass with no activity
      const currentTime = now + (3 * 60 * 1000);

      // Check should auto-pause
      expect(shouldAutoPause(session, currentTime)).toBe(true);

      // When pausing, use lastActivityAt (not currentTime)
      const paused = pauseTimer(session, session.lastActivityAt);
      expect(paused.elapsedTime).toBe(60000); // No additional time added
      expect(paused.pausedAt).toBe(session.lastActivityAt);
    });

    it('should auto-pause with isAutoPause flag and NOT update elapsed time', () => {
      const now = Date.now();
      const session = createTestSession({
        lastActivityAt: now,
        lastTimerUpdate: now,
        elapsedTime: 60000 // 1 minute played
      });

      // 3 minutes pass with no activity
      const currentTime = now + (3 * 60 * 1000);

      // Check should auto-pause
      expect(shouldAutoPause(session, currentTime)).toBe(true);

      // When auto-pausing with isAutoPause=true, don't update elapsed time
      const autoPaused = pauseTimer(session, session.lastActivityAt, true);
      expect(autoPaused.elapsedTime).toBe(60000); // No additional time added
      expect(autoPaused.pausedAt).toBe(session.lastActivityAt);
      expect(autoPaused.lastActivityAt).toBe(now); // lastActivityAt unchanged
    });

    it('should manually pause and update elapsed time', () => {
      const now = Date.now();
      const session = createTestSession({
        lastActivityAt: now,
        lastTimerUpdate: now,
        elapsedTime: 60000 // 1 minute played
      });

      // Manually pause 10 seconds later
      const pauseTime = now + 10000;
      const manuallyPaused = pauseTimer(session, pauseTime, false);
      expect(manuallyPaused.elapsedTime).toBe(70000); // 60000 + 10000
      expect(manuallyPaused.pausedAt).toBe(pauseTime);
      expect(manuallyPaused.lastActivityAt).toBe(pauseTime); // lastActivityAt updated (user action)
      expect(manuallyPaused.lastTimerUpdate).toBe(pauseTime); // lastTimerUpdate also updated
    });
  });
});

/**
 * Timer Service
 *
 * Functions for managing game timer:
 * - Update elapsed time
 * - Pause/resume
 * - Auto-pause on idle (3 minutes per clarification)
 */

import type { GameSession } from '../models/types';

/**
 * Updates timer elapsed time
 *
 * Only increments if not paused
 *
 * @param session - Current game session
 * @param currentTime - Current timestamp
 * @returns Updated session with new elapsed time
 */
export function updateTimer(session: GameSession, currentTime: number): GameSession {
  if (session.isPaused || session.isCompleted) {
    return session;
  }

  const delta = currentTime - session.lastTimerUpdate;

  
  return {
    ...session,
    elapsedTime: session.elapsedTime + delta,
    lastTimerUpdate: currentTime // Update timer tracking timestamp only
    // lastActivityAt remains unchanged - only updated by user actions
  };
}

/**
 * Pauses the timer
 *
 * @param session - Current game session
 * @param pauseTime - Timestamp when paused
 * @param isAutoPause - Whether this is an auto-pause (should not update elapsed time)
 * @returns Updated session with paused state
 */
export function pauseTimer(session: GameSession, pauseTime: number, isAutoPause = false): GameSession {
  if (session.isPaused) {
    return session; // Already paused
  }

  // For auto-pause, don't update elapsed time - pause at lastActivityAt timestamp
  // For manual pause, update elapsed time before pausing
  const updated = isAutoPause ? session : updateTimer(session, pauseTime);

  return {
    ...updated,
    isPaused: true,
    pausedAt: pauseTime,
    isAutoPaused: isAutoPause,
    // For manual pause, update lastActivityAt and lastTimerUpdate. For auto-pause, keep them unchanged.
    lastActivityAt: isAutoPause ? session.lastActivityAt : pauseTime,
    lastTimerUpdate: isAutoPause ? session.lastTimerUpdate : pauseTime
  };
}

/**
 * Resumes the timer
 *
 * @param session - Current game session
 * @param resumeTime - Timestamp when resumed
 * @returns Updated session with resumed state
 */
export function resumeTimer(session: GameSession, resumeTime: number): GameSession {
  if (!session.isPaused) {
    return session; // Not paused
  }

  return {
    ...session,
    isPaused: false,
    pausedAt: null,
    isAutoPaused: false,
    lastActivityAt: resumeTime,
    lastTimerUpdate: resumeTime
  };
}

/**
 * Checks if game should auto-pause due to inactivity
 *
 * Per clarification: 3 minutes of inactivity triggers auto-pause
 * Timer is paused at the last interaction timestamp
 *
 * @param session - Current game session
 * @param currentTime - Current timestamp
 * @param autoPauseMinutes - Minutes of inactivity (default: 3)
 * @returns true if should auto-pause
 */
export function shouldAutoPause(
  session: GameSession,
  currentTime: number,
  autoPauseMinutes = 3
): boolean {
  if (session.isPaused || session.isCompleted) {
    return false;
  }

  const inactiveTime = currentTime - session.lastActivityAt;
  const autoPauseThreshold = autoPauseMinutes * 60 * 1000; // Convert to milliseconds

  const shouldPause = inactiveTime >= autoPauseThreshold;

  
  return shouldPause;
}

/**
 * Formats elapsed time as MM:SS or HH:MM:SS
 *
 * @param milliseconds - Elapsed time in milliseconds
 * @returns Formatted string (e.g., "05:23" or "1:05:23")
 */
export function formatTime(milliseconds: number): string {
  const totalSeconds = Math.floor(milliseconds / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}:${pad(minutes)}:${pad(seconds)}`;
  }

  return `${pad(minutes)}:${pad(seconds)}`;
}

/**
 * Pads number with leading zero
 */
function pad(num: number): string {
  return num.toString().padStart(2, '0');
}

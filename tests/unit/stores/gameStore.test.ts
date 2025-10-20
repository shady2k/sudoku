/**
 * Game Store Tests
 *
 * Tests for the reactive game store using Svelte 5 runes.
 * Covers state management, derived values, and actions.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { gameStore } from '../../../src/lib/stores/gameStore.svelte.ts';
import type { GameSession } from '../../../src/lib/models/types';
import * as GameSessionService from '../../../src/lib/services/GameSession';
import * as TimerService from '../../../src/lib/services/TimerService';
import * as StorageService from '../../../src/lib/services/StorageService';

// Mock dependencies
vi.mock('../../../src/lib/services/GameSession');
vi.mock('../../../src/lib/services/TimerService');
vi.mock('../../../src/lib/services/StorageService');

describe('GameStore', () => {
  beforeEach(() => {
    // Reset store state
    gameStore.session = null;
    gameStore.isLoading = false;
    gameStore.error = null;
    gameStore.currentTime = Date.now();

    // Clear mocks
    vi.clearAllMocks();

    // Mock StorageService to always succeed
    vi.mocked(StorageService.saveGameSession).mockResolvedValue({
      success: true,
      data: undefined
    });
    vi.mocked(StorageService.hasSavedGame).mockReturnValue(false);
    vi.mocked(StorageService.loadPreferences).mockResolvedValue({
      defaultDifficulty: 5,
      soundEnabled: true,
      theme: 'light'
    });
    vi.mocked(StorageService.savePreferences).mockResolvedValue({
      success: true,
      data: undefined
    });
  });

  describe('Initial State', () => {
    it('should initialize with null session', () => {
      expect(gameStore.session).toBeNull();
    });

    it('should initialize with isLoading false', () => {
      expect(gameStore.isLoading).toBe(false);
    });

    it('should initialize with no error', () => {
      expect(gameStore.error).toBeNull();
    });
  });

  describe('Derived State', () => {
    it('should return "00:00" for formatted time when no session', () => {
      expect(gameStore.formattedTime).toBe('00:00');
    });

    it('should format elapsed time when session exists', () => {
      const mockSession: Partial<GameSession> = {
        elapsedTime: 125000, // 2m 5s
        isCompleted: false,
      };

      vi.mocked(TimerService.formatTime).mockReturnValue('02:05');
      gameStore.session = mockSession as GameSession;

      expect(gameStore.formattedTime).toBe('02:05');
      expect(TimerService.formatTime).toHaveBeenCalledWith(125000);
    });

    it('should calculate isGameActive as false when no session', () => {
      expect(gameStore.isGameActive).toBe(false);
    });

    it('should calculate isGameActive as true when session exists and not completed', () => {
      const mockSession: Partial<GameSession> = {
        isCompleted: false,
      };
      gameStore.session = mockSession as GameSession;

      expect(gameStore.isGameActive).toBe(true);
    });

    it('should calculate isGameActive as false when session is completed', () => {
      const mockSession: Partial<GameSession> = {
        isCompleted: true,
      };
      gameStore.session = mockSession as GameSession;

      expect(gameStore.isGameActive).toBe(false);
    });

    it('should calculate canUndo based on history index', () => {
      const mockSession: Partial<GameSession> = {
        history: {
          actions: [],
          currentIndex: 0,
          maxSize: 50,
        },
        isCompleted: false,
      };
      gameStore.session = mockSession as GameSession;

      expect(gameStore.canUndo).toBe(false);

      // Set history index > 0
      mockSession.history!.currentIndex = 2;
      gameStore.session = { ...mockSession } as GameSession;

      expect(gameStore.canUndo).toBe(true);
    });
  });

  describe('newGame Action - success cases', () => {
    it('should set isLoading true while creating game', async () => {
      const mockSession = { sessionId: 'test-123' } as GameSession;

      vi.mocked(GameSessionService.createGameSession).mockResolvedValue({
        success: true,
        data: mockSession,
      });

      const promise = gameStore.newGame(5);
      expect(gameStore.isLoading).toBe(true);

      await promise;
    });

    it('should create new game session with difficulty', async () => {
      const mockSession = { sessionId: 'test-123' } as GameSession;

      vi.mocked(GameSessionService.createGameSession).mockResolvedValue({
        success: true,
        data: mockSession,
      });

      await gameStore.newGame(5);

      expect(GameSessionService.createGameSession).toHaveBeenCalledWith(5, undefined);
      expect(gameStore.session).toStrictEqual(mockSession);
      expect(gameStore.isLoading).toBe(false);
      expect(gameStore.error).toBeNull();
    });

    it('should create game with custom seed', async () => {
      const mockSession = { sessionId: 'test-123' } as GameSession;

      vi.mocked(GameSessionService.createGameSession).mockResolvedValue({
        success: true,
        data: mockSession,
      });

      await gameStore.newGame(7, 12345);

      expect(GameSessionService.createGameSession).toHaveBeenCalledWith(7, 12345);
    });
  });

  describe('newGame Action - error cases', () => {
    it('should set error when game creation fails', async () => {
      vi.mocked(GameSessionService.createGameSession).mockResolvedValue({
        success: false,
        error: new Error('Failed to generate puzzle'),
      });

      await gameStore.newGame(5);

      expect(gameStore.session).toBeNull();
      expect(gameStore.error).toBe('Failed to generate puzzle');
      expect(gameStore.isLoading).toBe(false);
    });

    it('should handle exceptions during game creation', async () => {
      vi.mocked(GameSessionService.createGameSession).mockRejectedValue(
        new Error('Network error')
      );

      await gameStore.newGame(5);

      expect(gameStore.session).toBeNull();
      expect(gameStore.error).toBe('Network error');
      expect(gameStore.isLoading).toBe(false);
    });
  });

  describe('makeMove Action', () => {
    it('should do nothing when no session exists', () => {
      gameStore.session = null;
      gameStore.makeMove({ row: 0, col: 0 }, 5);

      expect(GameSessionService.makeMove).not.toHaveBeenCalled();
    });

    it('should update session on successful move', () => {
      const currentSession = { sessionId: 'test-1' } as GameSession;
      const updatedSession = { sessionId: 'test-1', board: [[5]] } as GameSession;

      gameStore.session = currentSession;

      vi.mocked(GameSessionService.makeMove).mockReturnValue({
        success: true,
        data: updatedSession,
      });

      gameStore.makeMove({ row: 0, col: 0 }, 5);

      expect(GameSessionService.makeMove).toHaveBeenCalledWith(
        currentSession,
        { row: 0, col: 0 },
        5
      );
      expect(gameStore.session).toStrictEqual(updatedSession);
      expect(gameStore.error).toBeNull();
    });

    it('should set error on failed move', () => {
      const currentSession = { sessionId: 'test-1' } as GameSession;

      gameStore.session = currentSession;

      vi.mocked(GameSessionService.makeMove).mockReturnValue({
        success: false,
        error: new Error('Invalid move: cell is a clue'),
      });

      gameStore.makeMove({ row: 0, col: 0 }, 5);

      expect(gameStore.error).toBe('Invalid move: cell is a clue');
      expect(gameStore.session).toStrictEqual(currentSession); // Unchanged
    });
  });

  describe('selectCell Action', () => {
    it('should do nothing when no session exists', () => {
      gameStore.session = null;
      gameStore.selectCell({ row: 0, col: 0 });

      expect(GameSessionService.selectCell).not.toHaveBeenCalled();
    });

    it('should update selected cell', () => {
      const currentSession = { sessionId: 'test-1', selectedCell: null } as GameSession;
      const updatedSession = { sessionId: 'test-1', selectedCell: { row: 0, col: 0 } } as GameSession;

      gameStore.session = currentSession;

      vi.mocked(GameSessionService.selectCell).mockReturnValue(updatedSession);

      gameStore.selectCell({ row: 0, col: 0 });

      expect(GameSessionService.selectCell).toHaveBeenCalledWith(
        currentSession,
        { row: 0, col: 0 }
      );
      expect(gameStore.session).toStrictEqual(updatedSession);
    });

    it('should support deselecting cell with null', () => {
      const currentSession = { sessionId: 'test-1', selectedCell: { row: 0, col: 0 } } as GameSession;
      const updatedSession = { sessionId: 'test-1', selectedCell: null } as GameSession;

      gameStore.session = currentSession;

      vi.mocked(GameSessionService.selectCell).mockReturnValue(updatedSession);

      gameStore.selectCell(null);

      expect(GameSessionService.selectCell).toHaveBeenCalledWith(currentSession, null);
      expect(gameStore.session).toStrictEqual(updatedSession);
    });
  });


  describe('Timer Actions - pause/resume', () => {
    it('should pause game timer', () => {
      const now = Date.now();
      const currentSession = { sessionId: 'test-1', isPaused: false } as GameSession;
      const pausedSession = { sessionId: 'test-1', isPaused: true, pausedAt: now } as GameSession;

      gameStore.session = currentSession;

      vi.mocked(TimerService.pauseTimer).mockReturnValue(pausedSession);

      gameStore.pauseGame();

      expect(TimerService.pauseTimer).toHaveBeenCalledWith(currentSession, expect.any(Number));
      expect(gameStore.session).toStrictEqual(pausedSession);
    });

    it('should resume game timer', () => {
      const now = Date.now();
      const currentSession = { sessionId: 'test-1', isPaused: true, pausedAt: now - 5000 } as GameSession;
      const resumedSession = { sessionId: 'test-1', isPaused: false, pausedAt: null } as GameSession;

      gameStore.session = currentSession;

      vi.mocked(TimerService.resumeTimer).mockReturnValue(resumedSession);

      gameStore.resumeGame();

      expect(TimerService.resumeTimer).toHaveBeenCalledWith(currentSession, expect.any(Number));
      expect(gameStore.session).toStrictEqual(resumedSession);
    });

    it('should do nothing when pausing without session', () => {
      gameStore.session = null;
      gameStore.pauseGame();

      expect(TimerService.pauseTimer).not.toHaveBeenCalled();
    });

    it('should do nothing when resuming without session', () => {
      gameStore.session = null;
      gameStore.resumeGame();

      expect(TimerService.resumeTimer).not.toHaveBeenCalled();
    });
  });

  describe('updateTime Action - guards', () => {
    it('should do nothing when no session exists', () => {
      gameStore.session = null;
      gameStore.updateTime();

      expect(TimerService.shouldAutoPause).not.toHaveBeenCalled();
      expect(TimerService.updateTimer).not.toHaveBeenCalled();
    });

    it('should do nothing when game is paused', () => {
      const currentSession = { sessionId: 'test-1', isPaused: true, isCompleted: false } as GameSession;
      gameStore.session = currentSession;

      gameStore.updateTime();

      expect(TimerService.shouldAutoPause).not.toHaveBeenCalled();
      expect(TimerService.updateTimer).not.toHaveBeenCalled();
    });

    it('should do nothing when game is completed', () => {
      const currentSession = { sessionId: 'test-1', isPaused: false, isCompleted: true } as GameSession;
      gameStore.session = currentSession;

      gameStore.updateTime();

      expect(TimerService.shouldAutoPause).not.toHaveBeenCalled();
      expect(TimerService.updateTimer).not.toHaveBeenCalled();
    });
  });

  describe('updateTime Action - auto-pause', () => {
    it('should auto-pause when idle timeout reached', () => {
      const now = Date.now();
      const lastActivityTime = now - 6 * 60 * 1000; // 6 minutes ago

      const currentSession = {
        sessionId: 'test-1',
        isPaused: false,
        isCompleted: false,
        lastActivityAt: lastActivityTime,
        elapsedTime: 120000, // 2 minutes
      } as GameSession;

      const pausedSession = { ...currentSession, isPaused: true };

      gameStore.session = currentSession;
      gameStore.currentTime = now;

      vi.mocked(TimerService.shouldAutoPause).mockReturnValue(true);
      vi.mocked(TimerService.pauseTimer).mockReturnValue(pausedSession);

      gameStore.updateTime();

      expect(TimerService.shouldAutoPause).toHaveBeenCalledWith(currentSession, expect.any(Number), 3);
      // Expects a reverted session (elapsed time adjusted) and current time for pause
      expect(TimerService.pauseTimer).toHaveBeenCalledWith(
        expect.objectContaining({
          sessionId: 'test-1',
          lastActivityAt: lastActivityTime,
          // elapsedTime should be reverted (reduced by time since last activity)
          elapsedTime: expect.any(Number)
        }),
        expect.any(Number),
        true
      );
      expect(gameStore.session).toStrictEqual(pausedSession);
    });

    it('should update timer when active and not idle', () => {
      const currentSession = {
        sessionId: 'test-1',
        isPaused: false,
        isCompleted: false,
        lastActivityAt: Date.now() - 1000, // 1 second ago
        elapsedTime: 120000, // 2 minutes
      } as GameSession;

      const updatedSession = { ...currentSession, elapsedTime: 121000 };

      gameStore.session = currentSession;

      vi.mocked(TimerService.shouldAutoPause).mockReturnValue(false);
      vi.mocked(TimerService.updateTimer).mockReturnValue(updatedSession);

      gameStore.updateTime();

      expect(TimerService.shouldAutoPause).toHaveBeenCalledWith(currentSession, expect.any(Number), 3);
      expect(TimerService.updateTimer).toHaveBeenCalledWith(currentSession, expect.any(Number));
      expect(gameStore.session).toStrictEqual(updatedSession);
      expect(gameStore.currentTime).toBeGreaterThan(0);
    });
  });
});

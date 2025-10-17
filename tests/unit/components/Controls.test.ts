/**
 * Controls Component Tests
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import Controls from '../../../src/components/Controls.svelte';

// Mock the gameStore module with factory function
vi.mock('../../../src/lib/stores/gameStore.svelte', () => {
  const mockNewGame = vi.fn();
  const mockPauseGame = vi.fn();
  const mockResumeGame = vi.fn();
  const mockFillCandidates = vi.fn();
  const mockToggleNotesMode = vi.fn();

  const gameStore = {
    session: null as any,
    isLoading: false,
    error: null as string | null,
    notesMode: false,
    newGame: mockNewGame,
    pauseGame: mockPauseGame,
    resumeGame: mockResumeGame,
    fillCandidates: mockFillCandidates,
    toggleNotesMode: mockToggleNotesMode,
  };

  return {
    gameStore: gameStore,
  };
});

// Import after mock is set up
import { gameStore } from '../../../src/lib/stores/gameStore.svelte';

// Extract mocks for testing
const _mockNewGame = gameStore.newGame as ReturnType<typeof vi.fn>;
const mockPauseGame = gameStore.pauseGame as ReturnType<typeof vi.fn>;
const mockResumeGame = gameStore.resumeGame as ReturnType<typeof vi.fn>;
const mockFillCandidates = gameStore.fillCandidates as ReturnType<typeof vi.fn>;

describe('Controls Component', () => {
  const user = userEvent.setup();
  const mockOnNewGame = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    gameStore.session = null;
    gameStore.isLoading = false;
    mockOnNewGame.mockClear();
  });

  describe('New Game Button', () => {
    it('should render new game button', () => {
      render(Controls, { onNewGame: mockOnNewGame });
      expect(screen.getByRole('button', { name: /New Game/i })).toBeInTheDocument();
    });

    it('should call onNewGame when clicked', async () => {
      render(Controls, { onNewGame: mockOnNewGame });
      const button = screen.getByRole('button', { name: /New Game/i });
      await user.click(button);

      expect(mockOnNewGame).toHaveBeenCalled();
    });

    it('should show "Generating..." when loading', () => {
      gameStore.isLoading = true;
      render(Controls, { onNewGame: mockOnNewGame });

      expect(screen.getByText('Generating...')).toBeInTheDocument();
    });

    it('should disable button when loading', () => {
      gameStore.isLoading = true;
      render(Controls, { onNewGame: mockOnNewGame });

      const button = screen.getByRole('button', { name: /Generating/i });
      expect(button).toBeDisabled();
    });
  });

  describe('Pause/Resume Button', () => {
    it('should not show pause button when no session', () => {
      render(Controls, { onNewGame: mockOnNewGame });
      expect(screen.queryByRole('button', { name: /Pause/i })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /Resume/i })).not.toBeInTheDocument();
    });

    it('should show "Pause" button when game is active', () => {
      gameStore.session = { isPaused: false, isCompleted: false } as any;
      render(Controls, { onNewGame: mockOnNewGame });

      expect(screen.getByRole('button', { name: /Pause/ })).toBeInTheDocument();
    });

    it('should show "Resume" button when game is paused', () => {
      gameStore.session = { isPaused: true, isCompleted: false } as any;
      render(Controls, { onNewGame: mockOnNewGame });

      expect(screen.getByRole('button', { name: /Resume/ })).toBeInTheDocument();
    });

    it('should call pauseGame when clicking Pause', async () => {
      gameStore.session = { isPaused: false, isCompleted: false } as any;
      render(Controls, { onNewGame: mockOnNewGame });

      const button = screen.getByRole('button', { name: /Pause/ });
      await user.click(button);

      expect(mockPauseGame).toHaveBeenCalled();
    });

    it('should call resumeGame when clicking Resume', async () => {
      gameStore.session = { isPaused: true, isCompleted: false } as any;
      render(Controls, { onNewGame: mockOnNewGame });

      const button = screen.getByRole('button', { name: /Resume/ });
      await user.click(button);

      expect(mockResumeGame).toHaveBeenCalled();
    });

    it('should disable pause button when game is completed', () => {
      gameStore.session = { isPaused: false, isCompleted: true } as any;
      render(Controls, { onNewGame: mockOnNewGame });

      const button = screen.getByRole('button', { name: /Pause/ });
      expect(button).toBeDisabled();
    });
  });

  describe('Fill Candidates Button', () => {
    it('should not show fill candidates button when no session', () => {
      render(Controls, { onNewGame: mockOnNewGame });
      expect(screen.queryByRole('button', { name: /Fill Candidates/i })).not.toBeInTheDocument();
    });

    it('should show "Fill Candidates" button when game is active', () => {
      gameStore.session = { isCompleted: false } as any;
      render(Controls, { onNewGame: mockOnNewGame });

      expect(screen.getByRole('button', { name: /Fill Candidates/ })).toBeInTheDocument();
    });

    it('should call fillCandidates when clicked', async () => {
      gameStore.session = { isCompleted: false } as any;
      render(Controls, { onNewGame: mockOnNewGame });

      const button = screen.getByRole('button', { name: /Fill Candidates/ });
      await user.click(button);

      expect(mockFillCandidates).toHaveBeenCalled();
    });
  });
});

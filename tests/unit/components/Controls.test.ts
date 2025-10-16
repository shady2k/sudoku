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
  const mockToggleCandidates = vi.fn();

  const gameStore = {
    session: null as any,
    isLoading: false,
    error: null as string | null,
    newGame: mockNewGame,
    pauseGame: mockPauseGame,
    resumeGame: mockResumeGame,
    toggleCandidates: mockToggleCandidates,
  };

  return {
    gameStore: gameStore,
  };
});

// Import after mock is set up
import { gameStore } from '../../../src/lib/stores/gameStore.svelte';

// Extract mocks for testing
const mockNewGame = gameStore.newGame as ReturnType<typeof vi.fn>;
const mockPauseGame = gameStore.pauseGame as ReturnType<typeof vi.fn>;
const mockResumeGame = gameStore.resumeGame as ReturnType<typeof vi.fn>;
const mockToggleCandidates = gameStore.toggleCandidates as ReturnType<typeof vi.fn>;

describe('Controls Component', () => {
  const user = userEvent.setup();

  beforeEach(() => {
    vi.clearAllMocks();
    gameStore.session = null;
    gameStore.isLoading = false;
  });

  describe('Difficulty Selector', () => {
    it('should render difficulty slider', () => {
      render(Controls);
      const slider = screen.getByLabelText('Difficulty:');
      expect(slider).toBeInTheDocument();
      expect(slider).toHaveAttribute('type', 'range');
      expect(slider).toHaveAttribute('min', '0');
      expect(slider).toHaveAttribute('max', '100');
    });

    it('should display current difficulty value', () => {
      render(Controls);
      const value = document.querySelector('.difficulty-value');
      expect(value).toBeInTheDocument();
    });

    it('should disable slider when loading', () => {
      gameStore.isLoading = true;
      render(Controls);

      const slider = screen.getByLabelText('Difficulty:');
      expect(slider).toBeDisabled();
    });
  });

  describe('New Game Button', () => {
    it('should render new game button', () => {
      render(Controls);
      expect(screen.getByRole('button', { name: /New Game/i })).toBeInTheDocument();
    });

    it('should call newGame when clicked', async () => {
      render(Controls);
      const button = screen.getByRole('button', { name: /New Game/i });
      await user.click(button);

      expect(mockNewGame).toHaveBeenCalled();
    });

    it('should show "Generating..." when loading', () => {
      gameStore.isLoading = true;
      render(Controls);

      expect(screen.getByText('Generating...')).toBeInTheDocument();
    });

    it('should disable button when loading', () => {
      gameStore.isLoading = true;
      render(Controls);

      const button = screen.getByRole('button', { name: /Generating/i });
      expect(button).toBeDisabled();
    });
  });

  describe('Pause/Resume Button', () => {
    it('should not show pause button when no session', () => {
      render(Controls);
      expect(screen.queryByRole('button', { name: /Pause/i })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /Resume/i })).not.toBeInTheDocument();
    });

    it('should show "Pause" button when game is active', () => {
      gameStore.session = { isPaused: false, isCompleted: false } as any;
      render(Controls);

      expect(screen.getByRole('button', { name: 'Pause' })).toBeInTheDocument();
    });

    it('should show "Resume" button when game is paused', () => {
      gameStore.session = { isPaused: true, isCompleted: false } as any;
      render(Controls);

      expect(screen.getByRole('button', { name: 'Resume' })).toBeInTheDocument();
    });

    it('should call pauseGame when clicking Pause', async () => {
      gameStore.session = { isPaused: false, isCompleted: false } as any;
      render(Controls);

      const button = screen.getByRole('button', { name: 'Pause' });
      await user.click(button);

      expect(mockPauseGame).toHaveBeenCalled();
    });

    it('should call resumeGame when clicking Resume', async () => {
      gameStore.session = { isPaused: true, isCompleted: false } as any;
      render(Controls);

      const button = screen.getByRole('button', { name: 'Resume' });
      await user.click(button);

      expect(mockResumeGame).toHaveBeenCalled();
    });

    it('should disable pause button when game is completed', () => {
      gameStore.session = { isPaused: false, isCompleted: true } as any;
      render(Controls);

      const button = screen.getByRole('button', { name: 'Pause' });
      expect(button).toBeDisabled();
    });
  });

  describe('Candidates Toggle Button', () => {
    it('should not show candidates button when no session', () => {
      render(Controls);
      expect(screen.queryByRole('button', { name: /Candidates/i })).not.toBeInTheDocument();
    });

    it('should show "Show Candidates" when candidates are hidden', () => {
      gameStore.session = { showAutoCandidates: false, isCompleted: false } as any;
      render(Controls);

      expect(screen.getByRole('button', { name: 'Show Candidates' })).toBeInTheDocument();
    });

    it('should show "Hide Candidates" when candidates are visible', () => {
      gameStore.session = { showAutoCandidates: true, isCompleted: false } as any;
      render(Controls);

      expect(screen.getByRole('button', { name: 'Hide Candidates' })).toBeInTheDocument();
    });

    it('should call toggleCandidates when clicked', async () => {
      gameStore.session = { showAutoCandidates: false, isCompleted: false } as any;
      render(Controls);

      const button = screen.getByRole('button', { name: 'Show Candidates' });
      await user.click(button);

      expect(mockToggleCandidates).toHaveBeenCalled();
    });

    it('should have active class when candidates are shown', () => {
      gameStore.session = { showAutoCandidates: true, isCompleted: false } as any;
      render(Controls);

      const button = screen.getByRole('button', { name: 'Hide Candidates' });
      expect(button).toHaveClass('active');
    });
  });

  describe('New Game with Difficulty', () => {
    it('should pass selected difficulty when creating new game', async () => {
      render(Controls);

      // Change difficulty slider to 75
      const slider = screen.getByLabelText('Difficulty:') as HTMLInputElement;
      // For range inputs, we can't use clear/type. Instead, directly set the value and trigger change event
      slider.value = '75';
      slider.dispatchEvent(new Event('input', { bubbles: true }));
      slider.dispatchEvent(new Event('change', { bubbles: true }));

      // Click new game
      const button = screen.getByRole('button', { name: /New Game/i });
      await user.click(button);

      // Should call newGame with the selected difficulty
      expect(mockNewGame).toHaveBeenCalledWith(75);
    });

    it('should use default difficulty of 50% initially', async () => {
      render(Controls);

      const button = screen.getByRole('button', { name: /New Game/i });
      await user.click(button);

      // Should call newGame with default difficulty 50
      expect(mockNewGame).toHaveBeenCalledWith(50);
    });
  });
});

/**
 * Controls Component Tests
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import Controls from '../../../src/components/Controls.svelte';
import { gameStore } from '../../../src/lib/stores/gameStore.svelte.ts';

vi.mock('../../../src/lib/stores/gameStore.svelte.ts', () => ({
  gameStore: {
    session: null,
    isLoading: false,
    newGame: vi.fn(),
    pauseGame: vi.fn(),
    resumeGame: vi.fn(),
    toggleCandidates: vi.fn(),
  },
}));

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
      expect(slider).toHaveAttribute('min', '1');
      expect(slider).toHaveAttribute('max', '10');
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

      expect(gameStore.newGame).toHaveBeenCalled();
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

      expect(gameStore.pauseGame).toHaveBeenCalled();
    });

    it('should call resumeGame when clicking Resume', async () => {
      gameStore.session = { isPaused: true, isCompleted: false } as any;
      render(Controls);

      const button = screen.getByRole('button', { name: 'Resume' });
      await user.click(button);

      expect(gameStore.resumeGame).toHaveBeenCalled();
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

      expect(gameStore.toggleCandidates).toHaveBeenCalled();
    });

    it('should have active class when candidates are shown', () => {
      gameStore.session = { showAutoCandidates: true, isCompleted: false } as any;
      render(Controls);

      const button = screen.getByRole('button', { name: 'Hide Candidates' });
      expect(button).toHaveClass('active');
    });
  });
});

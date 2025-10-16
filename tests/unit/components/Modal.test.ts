/**
 * Modal Component Tests
 *
 * Tests the Modal component with difficulty selector per T093-T095 in tasks.md.
 * Validates the continuous difficulty slider and visual feedback.
 */

import { render, screen, fireEvent } from '@testing-library/svelte';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import userEvent from '@testing-library/user-event';
import Modal from '../../../src/components/Modal.svelte';

describe('Modal Component', () => {
  let mockOnStartGame: ReturnType<typeof vi.fn>;
  let mockOnCancel: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockOnStartGame = vi.fn();
    mockOnCancel = vi.fn();
    document.body.innerHTML = '';
  });

  it('should render difficulty selector with correct initial state', () => {
    render(Modal, {
      props: {
        isOpen: true,
        hasActiveGame: false,
        onStartGame: mockOnStartGame
      }
    });

    // Check modal title
    expect(screen.getByText('New Game')).toBeInTheDocument();

    // Check difficulty selector
    const slider = screen.getByRole('slider', { name: 'Difficulty: 50%' });
    expect(slider).toBeInTheDocument();
    expect(slider).toHaveAttribute('min', '0');
    expect(slider).toHaveAttribute('max', '100');
    expect(slider).toHaveValue('50');

    // Check labels
    expect(screen.getByText('Hardest (0%)')).toBeInTheDocument();
    expect(screen.getByText('Easiest (100%)')).toBeInTheDocument();

    // Check buttons
    expect(screen.getByRole('button', { name: 'Start New Game' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Cancel' })).not.toBeInTheDocument();
  });

  it('should show warning when has active game', () => {
    render(Modal, {
      props: {
        isOpen: true,
        hasActiveGame: true,
        onStartGame: mockOnStartGame,
        onCancel: mockOnCancel
      }
    });

    expect(screen.getByText('⚠️ Starting a new game will lose your current progress.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
  });

  it('should have difficulty slider with correct initial value', () => {
    render(Modal, {
      props: {
        isOpen: true,
        hasActiveGame: false,
        onStartGame: mockOnStartGame
      }
    });

    const slider = screen.getByRole('slider', { name: 'Difficulty: 50%' });
    expect(slider).toBeInTheDocument();
    expect(slider).toHaveValue('50');
    expect(slider).toHaveAttribute('min', '0');
    expect(slider).toHaveAttribute('max', '100');
  });

  it('should call onStartGame with selected difficulty when Start New Game clicked', async () => {
    const user = userEvent.setup();

    render(Modal, {
      props: {
        isOpen: true,
        hasActiveGame: false,
        onStartGame: mockOnStartGame
      }
    });

    // Test with default difficulty (50%)
    const startButton = screen.getByRole('button', { name: 'Start New Game' });
    await user.click(startButton);

    expect(mockOnStartGame).toHaveBeenCalledWith(50);
  });

  it('should call onCancel when Cancel button clicked', async () => {
    const user = userEvent.setup();

    render(Modal, {
      props: {
        isOpen: true,
        hasActiveGame: true,
        onStartGame: mockOnStartGame,
        onCancel: mockOnCancel
      }
    });

    const cancelButton = screen.getByRole('button', { name: 'Cancel' });
    await user.click(cancelButton);

    expect(mockOnCancel).toHaveBeenCalled();
  });

  it('should handle keyboard events correctly', async () => {
    render(Modal, {
      props: {
        isOpen: true,
        hasActiveGame: true,
        onStartGame: mockOnStartGame,
        onCancel: mockOnCancel
      }
    });

    // Press Escape key - should trigger cancel
    fireEvent.keyDown(document, { key: 'Escape' });

    expect(mockOnCancel).toHaveBeenCalled();
  });

  it('should not handle Escape key when no active game', async () => {
    render(Modal, {
      props: {
        isOpen: true,
        hasActiveGame: false,
        onStartGame: mockOnStartGame
      }
    });

    // Press Escape key - should not trigger cancel since no active game
    fireEvent.keyDown(document, { key: 'Escape' });

    expect(mockOnCancel).not.toHaveBeenCalled();
  });

  it('should not render modal content when isOpen is false', () => {
    const { container } = render(Modal, {
      props: {
        isOpen: false,
        hasActiveGame: false,
        onStartGame: mockOnStartGame
      }
    });

    // Modal content should not be visible
    expect(screen.queryByText('New Game')).not.toBeInTheDocument();
    expect(screen.queryByRole('slider')).not.toBeInTheDocument();
  });

  it('should have accessible markup', () => {
    render(Modal, {
      props: {
        isOpen: true,
        hasActiveGame: false,
        onStartGame: mockOnStartGame
      }
    });

    // Check ARIA attributes
    const slider = screen.getByRole('slider', { name: 'Difficulty: 50%' });
    expect(slider).toHaveAttribute('type', 'range');
    expect(slider).toHaveAttribute('min', '0');
    expect(slider).toHaveAttribute('max', '100');

    // Check button roles
    expect(screen.getByRole('button', { name: 'Start New Game' })).toBeInTheDocument();
  });

  it('should have proper visual styling classes', () => {
    render(Modal, {
      props: {
        isOpen: true,
        hasActiveGame: false,
        onStartGame: mockOnStartGame
      }
    });

    // Check that components have expected classes
    const slider = screen.getByRole('slider');
    expect(slider).toBeInTheDocument();

    const startButton = screen.getByRole('button', { name: 'Start New Game' });
    expect(startButton).toHaveClass('btn', 'btn-primary');
  });

  describe('Difficulty Slider Structure', () => {
    it('should have correct slider attributes', () => {
      render(Modal, {
        props: {
          isOpen: true,
          hasActiveGame: false,
          onStartGame: mockOnStartGame
        }
      });

      const slider = screen.getByRole('slider', { name: 'Difficulty: 50%' });
      expect(slider).toHaveAttribute('type', 'range');
      expect(slider).toHaveAttribute('min', '0');
      expect(slider).toHaveAttribute('max', '100');
      expect(slider).toHaveValue('50');
    });

    it('should display correct difficulty labels', () => {
      render(Modal, {
        props: {
          isOpen: true,
          hasActiveGame: false,
          onStartGame: mockOnStartGame
        }
      });

      expect(screen.getByText('Hardest (0%)')).toBeInTheDocument();
      expect(screen.getByText('Easiest (100%)')).toBeInTheDocument();
      expect(screen.getByText('Difficulty: 50%')).toBeInTheDocument();
    });
  });
});
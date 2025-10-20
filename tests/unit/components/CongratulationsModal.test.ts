/**
 * Unit Test: CongratulationsModal Component
 *
 * Tests the congratulations modal that displays when a puzzle is completed.
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/svelte';
import CongratulationsModal from '../../../src/components/CongratulationsModal.svelte';

describe('CongratulationsModal', () => {
  const defaultProps = {
    isOpen: true,
    formattedTime: '05:30',
    mistakeCount: 2,
    onStartNewGame: vi.fn()
  };

  it('should render when isOpen is true', () => {
    render(CongratulationsModal, { props: defaultProps });

    expect(screen.getByText('Congratulations!')).toBeInTheDocument();
    expect(screen.getByText('You\'ve successfully completed the puzzle!')).toBeInTheDocument();
  });

  it('should not render when isOpen is false', () => {
    render(CongratulationsModal, {
      props: { ...defaultProps, isOpen: false }
    });

    expect(screen.queryByText('Congratulations!')).not.toBeInTheDocument();
  });

  it('should display the formatted time', () => {
    render(CongratulationsModal, { props: defaultProps });

    expect(screen.getByText('05:30')).toBeInTheDocument();
    expect(screen.getByText('Time')).toBeInTheDocument();
  });

  it('should display the mistake count', () => {
    render(CongratulationsModal, { props: defaultProps });

    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('Mistakes')).toBeInTheDocument();
  });

  it('should show perfect message when mistake count is 0', () => {
    render(CongratulationsModal, {
      props: { ...defaultProps, mistakeCount: 0 }
    });

    expect(screen.getByText('Perfect! No mistakes!')).toBeInTheDocument();
  });

  it('should not show perfect message when there are mistakes', () => {
    render(CongratulationsModal, {
      props: { ...defaultProps, mistakeCount: 3 }
    });

    expect(screen.queryByText('Perfect! No mistakes!')).not.toBeInTheDocument();
  });

  it('should call onStartNewGame when Start New Game button is clicked', async () => {
    const onStartNewGame = vi.fn();
    render(CongratulationsModal, {
      props: { ...defaultProps, onStartNewGame }
    });

    const button = screen.getByRole('button', { name: /start new game/i });
    await fireEvent.click(button);

    expect(onStartNewGame).toHaveBeenCalledOnce();
  });

  it('should have accessible attributes', () => {
    render(CongratulationsModal, { props: defaultProps });

    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(dialog).toHaveAttribute('aria-labelledby', 'congrats-title');
  });

  it('should display Start New Game button', () => {
    render(CongratulationsModal, { props: defaultProps });

    const button = screen.getByRole('button', { name: /start new game/i });
    expect(button).toBeInTheDocument();
    expect(button).toHaveClass('btn-primary');
  });

  it('should render with different time formats', () => {
    const { unmount } = render(CongratulationsModal, {
      props: { ...defaultProps, formattedTime: '00:45' }
    });

    expect(screen.getByText('00:45')).toBeInTheDocument();
    unmount();

    render(CongratulationsModal, {
      props: { ...defaultProps, formattedTime: '12:34' }
    });
    expect(screen.getByText('12:34')).toBeInTheDocument();
  });

  it('should handle large mistake counts', () => {
    render(CongratulationsModal, {
      props: { ...defaultProps, mistakeCount: 99 }
    });

    expect(screen.getByText('99')).toBeInTheDocument();
  });

  it('should apply perfect styling to mistake count when 0', () => {
    const { container } = render(CongratulationsModal, {
      props: { ...defaultProps, mistakeCount: 0 }
    });

    const mistakeValue = container.querySelector('.stat-value.perfect');
    expect(mistakeValue).toBeInTheDocument();
    expect(mistakeValue).toHaveTextContent('0');
  });

  it('should not apply perfect styling when mistakes > 0', () => {
    const { container } = render(CongratulationsModal, {
      props: { ...defaultProps, mistakeCount: 1 }
    });

    const mistakeValue = container.querySelector('.stat-value.perfect');
    expect(mistakeValue).not.toBeInTheDocument();
  });
});

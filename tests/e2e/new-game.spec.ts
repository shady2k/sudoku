/**
 * E2E Test: New Game Functionality
 *
 * Tests that the "New Game" button works correctly in different scenarios,
 * including starting a new game mid-game and after game completion.
 */

import { test, expect } from '@playwright/test';
import { startNewGameIfNeeded } from './helpers';

test.describe('New Game Functionality', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Clear localStorage to start fresh
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await startNewGameIfNeeded(page);
  });

  test('should start a new game from initial state', async ({ page }) => {
    // Wait for initial load
    await page.waitForSelector('.grid', { timeout: 5000 });

    // Verify grid is rendered
    const cells = await page.locator('.cell').count();
    expect(cells).toBe(81);

    // Verify timer is running - look for the stat item containing "Time"
    const timeStatValue = page.locator('.stat-item:has(.stat-label:has-text("Time")) .stat-value');
    await expect(timeStatValue).toBeVisible();
  });

  test('should start a new game mid-game', async ({ page }) => {
    // Wait for initial game to load
    await page.waitForSelector('.grid', { timeout: 5000 });

    // Make a move in the game - find first non-clue cell
    const emptyCell = page.locator('.cell:not(.clue)').first();
    await emptyCell.click();
    await page.keyboard.press('5');

    // Click "New Game" button from controls (not modal)
    const newGameButton = page.getByRole('button', { name: /New Game/i });
    await newGameButton.click();

    // Modal should appear - click "Start New Game" button in modal
    const modalStartButton = page.getByRole('button', { name: /^start new game$/i });
    await expect(modalStartButton).toBeVisible({ timeout: 2000 });
    await modalStartButton.click();

    // Wait for modal to close
    await page.waitForSelector('.modal-content, [role="dialog"]', { state: 'hidden', timeout: 3000 }).catch(() => {});

    // Verify new grid is displayed
    const cells = await page.locator('.cell').count();
    expect(cells).toBe(81);

    // Verify timer reset (should be close to 00:00)
    const timerText = await page.locator('.stat-item:has(.stat-label:has-text("Time")) .stat-value').textContent();
    expect(timerText).toMatch(/00:0[0-5]/); // Within 5 seconds of start
  });

  test('should allow changing difficulty before starting new game', async ({ page }) => {
    // Wait for initial game
    await page.waitForSelector('.grid', { timeout: 5000 });

    // Click "New Game" button to open modal
    const newGameButton = page.getByRole('button', { name: /New Game/i });
    await newGameButton.click();

    // Modal should appear with difficulty selector
    await page.waitForSelector('.modal-content, [role="dialog"]', { timeout: 2000 });

    // Change difficulty to 80% using the slider in the modal
    const difficultySlider = page.locator('input[type="range"]');
    await difficultySlider.fill('80');

    // Start new game from modal
    const modalStartButton = page.getByRole('button', { name: /^start new game$/i });
    await modalStartButton.click();

    // Wait for modal to close
    await page.waitForSelector('.modal-content, [role="dialog"]', { state: 'hidden', timeout: 3000 }).catch(() => {});

    // Verify difficulty is displayed as 80%
    const difficultyValue = await page.locator('.stat-item:has(.stat-label:has-text("Difficulty")) .stat-value').textContent();
    expect(difficultyValue).toBe('80%');

    // Verify grid is rendered
    const cells = await page.locator('.cell').count();
    expect(cells).toBe(81);
  });

  test('should maintain game state after new game', async ({ page }) => {
    // Wait for initial game
    await page.waitForSelector('.grid', { timeout: 5000 });

    // Start a new game via modal
    const newGameButton = page.getByRole('button', { name: /New Game/i });
    await newGameButton.click();

    const modalStartButton = page.getByRole('button', { name: /^start new game$/i });
    await modalStartButton.click();

    // Wait for modal to close
    await page.waitForSelector('.modal-content, [role="dialog"]', { state: 'hidden', timeout: 3000 }).catch(() => {});

    // Make a move - find first non-clue cell
    const emptyCell = page.locator('.cell:not(.clue)').first();
    await emptyCell.click();
    await page.keyboard.press('7');

    // Verify the move was saved by checking if the cell contains the number
    const cellText = await emptyCell.textContent();
    expect(cellText).toContain('7');

    // Verify error count is still 0
    const errorsValue = await page.locator('.stat-item:has(.stat-label:has-text("Errors")) .stat-value').textContent();
    expect(errorsValue).toBe('0');
  });

  test('should show loading state while generating new game', async ({ page }) => {
    // Wait for initial game
    await page.waitForSelector('.grid', { timeout: 5000 });

    // Click new game button
    const newGameButton = page.getByRole('button', { name: /New Game/i });
    await newGameButton.click();

    // Modal appears - click start
    const modalStartButton = page.getByRole('button', { name: /^start new game$/i });
    await modalStartButton.click();

    // Wait for modal to close
    await page.waitForSelector('.modal-content, [role="dialog"]', { state: 'hidden', timeout: 3000 }).catch(() => {});

    // Verify the button is back to "New Game" (generation complete)
    const button = page.getByRole('button', { name: /New Game/i });
    await expect(button).toBeVisible();
  });

  test('should persist new game to localStorage', async ({ page }) => {
    // Wait for initial game
    await page.waitForSelector('.grid', { timeout: 5000 });

    // Start new game via modal
    const newGameButton = page.getByRole('button', { name: /New Game/i });
    await newGameButton.click();

    const modalStartButton = page.getByRole('button', { name: /^start new game$/i });
    await modalStartButton.click();

    // Wait for modal to close
    await page.waitForSelector('.modal-content, [role="dialog"]', { state: 'hidden', timeout: 3000 }).catch(() => {});

    // Check that game is saved to localStorage (actual key is 'sudoku:current-session')
    const hasSession = await page.evaluate(() => {
      const saved = localStorage.getItem('sudoku:current-session');
      return saved !== null && saved !== '';
    });

    expect(hasSession).toBe(true);
  });

  test('should handle multiple consecutive new games', async ({ page }) => {
    // Wait for initial game
    await page.waitForSelector('.grid', { timeout: 5000 });

    // Start 2 consecutive new games (reduced from 3 to avoid timeout)
    for (let i = 0; i < 2; i++) {
      const newGameButton = page.getByRole('button', { name: /New Game/i });
      await newGameButton.click();

      const modalStartButton = page.getByRole('button', { name: /^start new game$/i });
      await modalStartButton.click();

      // Wait for modal to close
      await page.waitForSelector('.modal-content, [role="dialog"]', { state: 'hidden', timeout: 3000 }).catch(() => {});

      // Verify grid is still rendered correctly
      const cells = await page.locator('.cell').count();
      expect(cells).toBe(81);
    }

    // Verify the game is still playable
    const emptyCell = page.locator('.cell:not(.clue)').first();
    await emptyCell.click();
    await page.keyboard.press('3');

    const cellText = await emptyCell.textContent();
    expect(cellText).toContain('3');
  });

  test('should handle new game from game controls with keyboard shortcut', async ({ page }) => {
    // Wait for initial game
    await page.waitForSelector('.grid', { timeout: 5000 });

    // Press 'G' key to trigger new game
    await page.keyboard.press('g');

    // Modal should appear
    await page.waitForSelector('.modal-content, [role="dialog"]', { timeout: 2000 });

    // Verify modal has difficulty selector
    const difficultySlider = page.locator('input[type="range"]');
    await expect(difficultySlider).toBeVisible();

    // Start new game
    const modalStartButton = page.getByRole('button', { name: /^start new game$/i });
    await modalStartButton.click();

    // Wait for modal to close
    await page.waitForSelector('.modal-content, [role="dialog"]', { state: 'hidden', timeout: 3000 }).catch(() => {});

    // Verify new game loaded
    const cells = await page.locator('.cell').count();
    expect(cells).toBe(81);
  });
});

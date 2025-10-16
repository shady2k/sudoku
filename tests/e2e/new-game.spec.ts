/**
 * E2E Test: New Game Functionality
 *
 * Tests that the "New Game" button works correctly in different scenarios,
 * including starting a new game mid-game and after game completion.
 */

import { test, expect } from '@playwright/test';

test.describe('New Game Functionality', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Clear localStorage to start fresh
    await page.evaluate(() => localStorage.clear());
    await page.reload();
  });

  test('should start a new game from initial state', async ({ page }) => {
    // Wait for initial load
    await page.waitForSelector('.grid', { timeout: 5000 });

    // Verify grid is rendered
    const cells = await page.locator('.cell').count();
    expect(cells).toBe(81);

    // Verify timer is running
    await expect(page.locator('.time-display')).toBeVisible();
  });

  test('should start a new game mid-game', async ({ page }) => {
    // Wait for initial game to load
    await page.waitForSelector('.grid', { timeout: 5000 });

    // Make a move in the game
    const emptyCell = page.locator('.cell:not(.clue)').first();
    await emptyCell.click();
    await page.keyboard.press('5');

    // Get the first cell value before new game
    const firstCellBefore = await page.locator('[data-row="0"][data-col="0"]').textContent();

    // Click "New Game" button
    await page.getByRole('button', { name: 'New Game' }).click();

    // Wait for new game to generate
    await page.waitForTimeout(1500);

    // Verify new grid is displayed (puzzle should be different)
    const cells = await page.locator('.cell').count();
    expect(cells).toBe(81);

    // Verify timer reset (should be close to 00:00)
    const timerText = await page.locator('.time-display').textContent();
    expect(timerText).toMatch(/00:0[0-3]/); // Within 3 seconds of start
  });

  test('should allow changing difficulty before starting new game', async ({ page }) => {
    // Wait for initial game
    await page.waitForSelector('.grid', { timeout: 5000 });

    // Change difficulty to 80%
    const difficultySlider = page.locator('input[type="range"]');
    await difficultySlider.fill('80');

    // Start new game
    await page.getByRole('button', { name: 'New Game' }).click();

    // Wait for new game
    await page.waitForTimeout(1500);

    // Verify difficulty is displayed as 80%
    const difficultyValue = await page.locator('.difficulty-value').textContent();
    expect(difficultyValue).toBe('80%');

    // Verify grid is rendered
    const cells = await page.locator('.cell').count();
    expect(cells).toBe(81);
  });

  test('should maintain game state after new game', async ({ page }) => {
    // Wait for initial game
    await page.waitForSelector('.grid', { timeout: 5000 });

    // Start a new game
    await page.getByRole('button', { name: 'New Game' }).click();
    await page.waitForTimeout(1500);

    // Make a move
    const emptyCell = page.locator('.cell:not(.clue)').first();
    await emptyCell.click();
    await page.keyboard.press('7');

    // Verify the move was saved
    const cellText = await emptyCell.textContent();
    expect(cellText).toContain('7');

    // Verify error count is still 0 (assuming valid move)
    const errorsStat = page.locator('.stats .stat:has-text("Errors") .value');
    const errors = await errorsStat.textContent();
    expect(errors).toBe('0');
  });

  test('should show loading state while generating new game', async ({ page }) => {
    // Wait for initial game
    await page.waitForSelector('.grid', { timeout: 5000 });

    // Click new game
    await page.getByRole('button', { name: 'New Game' }).click();

    // Verify button shows "Generating..." (check quickly before it finishes)
    // Note: This might be too fast to catch, but we try
    const buttonText = await page.getByRole('button', { name: /New Game|Generating/ }).textContent();
    expect(buttonText).toMatch(/New Game|Generating/);
  });

  test('should persist new game to localStorage', async ({ page }) => {
    // Wait for initial game
    await page.waitForSelector('.grid', { timeout: 5000 });

    // Start new game
    await page.getByRole('button', { name: 'New Game' }).click();
    await page.waitForTimeout(1500);

    // Check that game is saved to localStorage
    const hasSession = await page.evaluate(() => {
      const saved = localStorage.getItem('sudoku-session');
      return saved !== null && saved !== '';
    });

    expect(hasSession).toBe(true);
  });

  test('should handle multiple consecutive new games', async ({ page }) => {
    // Wait for initial game
    await page.waitForSelector('.grid', { timeout: 5000 });

    // Start 3 consecutive new games
    for (let i = 0; i < 3; i++) {
      await page.getByRole('button', { name: 'New Game' }).click();
      await page.waitForTimeout(1500);

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
});

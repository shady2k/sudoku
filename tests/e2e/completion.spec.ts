/**
 * E2E Test: Puzzle Completion and Congratulations Modal
 *
 * Tests the complete puzzle completion flow and verifies the congratulations modal appears.
 */

import { test, expect } from '@playwright/test';
import { startNewGameIfNeeded } from './helpers';

test.describe('Puzzle Completion', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Clear localStorage for fresh start
    await page.evaluate(() => localStorage.clear());
    await page.reload();
  });

  test('should show congratulations modal when puzzle is completed', async ({ page }) => {
    // Start a new game using helper (handles modal if present)
    await startNewGameIfNeeded(page);

    // Wait a moment for game session to be saved
    await page.waitForTimeout(500);

    // Extract the solution from localStorage
    const solution = await page.evaluate(() => {
      const sessionData = localStorage.getItem('sudoku:current-session');
      if (!sessionData) throw new Error('No game session found');

      const parsed = JSON.parse(sessionData);
      return parsed.data.puzzle.solution;
    });

    // Fill in all empty cells with correct values
    for (let row = 0; row < 9; row++) {
      for (let col = 0; col < 9; col++) {
        const cell = page.locator(`.cell[data-row="${row}"][data-col="${col}"]`);
        const cellClasses = await cell.getAttribute('class');

        // Skip if it's a clue (pre-filled cell)
        if (cellClasses?.includes('clue')) {
          continue;
        }

        // Wait for cell to be ready (helps with WebKit timing)
        await cell.waitFor({ state: 'visible', timeout: 5000 });

        // Click the cell to select it
        await cell.click({ timeout: 15000 });

        // Type the correct value from solution with delay for WebKit
        const correctValue = solution[row][col];
        await page.keyboard.press(correctValue.toString(), { delay: 100 });

        // Increased delay for WebKit event processing
        await page.waitForTimeout(150);
      }
    }

    // Wait for completion state to propagate to localStorage
    await expect(async () => {
      const isCompleted = await page.evaluate(() => {
        const sessionData = localStorage.getItem('sudoku:current-session');
        if (!sessionData) return false;
        const parsed = JSON.parse(sessionData);
        return parsed.data.isCompleted === true;
      });
      expect(isCompleted).toBe(true);
    }).toPass({ timeout: 5000, intervals: [100] });

    // Wait for congratulations modal to appear (increased timeout for WebKit)
    const congratsModal = page.locator('.modal-overlay:has-text("Congratulations")');
    await expect(congratsModal).toBeVisible({ timeout: 5000 });

    // Verify congratulations message
    await expect(page.locator('text=You\'ve successfully completed the puzzle!')).toBeVisible();

    // Verify time stat is displayed in the modal
    await expect(congratsModal.locator('.stat-item:has(.stat-label:has-text("Time")) .stat-value')).toBeVisible();

    // Verify mistakes stat is displayed in the modal
    await expect(congratsModal.locator('.stat-item:has(.stat-label:has-text("Mistakes")) .stat-value')).toBeVisible();

    // Verify mistakes count is 0 (perfect game)
    const mistakesValue = await congratsModal.locator('.stat-item:has(.stat-label:has-text("Mistakes")) .stat-value').textContent();
    expect(mistakesValue).toBe('0');

    // Verify "Perfect! No mistakes!" message appears
    await expect(page.locator('text=Perfect! No mistakes!')).toBeVisible();

    // Verify Start New Game button
    const startNewGameBtn = congratsModal.getByRole('button', { name: /Start New Game/i });
    await expect(startNewGameBtn).toBeVisible();

    // Click Start New Game button
    await startNewGameBtn.click();

    // Verify New Game modal opens with "Start New Game" button (indicating the difficulty selector modal)
    const modalStartButton = page.getByRole('button', { name: /^start new game$/i });
    await expect(modalStartButton).toBeVisible({ timeout: 2000 });
  });

  test('should display correct time in congratulations modal', async ({ page }) => {
    // Start a new game
    await startNewGameIfNeeded(page);
    await page.waitForTimeout(500);

    // Complete the puzzle quickly
    const solution = await page.evaluate(() => {
      const sessionData = localStorage.getItem('sudoku:current-session');
      if (!sessionData) throw new Error('No game session found');
      const parsed = JSON.parse(sessionData);
      return parsed.data.puzzle.solution;
    });

    for (let row = 0; row < 9; row++) {
      for (let col = 0; col < 9; col++) {
        const cell = page.locator(`.cell[data-row="${row}"][data-col="${col}"]`);
        const cellClasses = await cell.getAttribute('class');
        if (cellClasses?.includes('clue')) continue;

        await cell.waitFor({ state: 'visible', timeout: 5000 });
        await cell.click({ timeout: 15000 });
        await page.keyboard.press(solution[row][col].toString(), { delay: 100 });
        await page.waitForTimeout(150);
      }
    }

    // Wait for completion state to propagate
    await expect(async () => {
      const isCompleted = await page.evaluate(() => {
        const sessionData = localStorage.getItem('sudoku:current-session');
        if (!sessionData) return false;
        const parsed = JSON.parse(sessionData);
        return parsed.data.isCompleted === true;
      });
      expect(isCompleted).toBe(true);
    }).toPass({ timeout: 5000, intervals: [100] });

    // Wait for modal (increased timeout for WebKit)
    const congratsModal = page.locator('.modal-overlay:has-text("Congratulations")');
    await expect(congratsModal).toBeVisible({ timeout: 5000 });

    // Verify time format (should be MM:SS format like "00:05" or "01:23")
    const timeValue = await congratsModal.locator('.stat-item:has(.stat-label:has-text("Time")) .stat-value').textContent();
    expect(timeValue).toMatch(/^\d{2}:\d{2}$/);
  });

  test('should only show congratulations modal once', async ({ page }) => {
    // Start a new game
    await startNewGameIfNeeded(page);
    await page.waitForTimeout(500);

    const solution = await page.evaluate(() => {
      const sessionData = localStorage.getItem('sudoku:current-session');
      if (!sessionData) throw new Error('No game session found');
      const parsed = JSON.parse(sessionData);
      return parsed.data.puzzle.solution;
    });

    for (let row = 0; row < 9; row++) {
      for (let col = 0; col < 9; col++) {
        const cell = page.locator(`.cell[data-row="${row}"][data-col="${col}"]`);
        const cellClasses = await cell.getAttribute('class');
        if (cellClasses?.includes('clue')) continue;

        await cell.waitFor({ state: 'visible', timeout: 5000 });
        await cell.click({ timeout: 15000 });
        await page.keyboard.press(solution[row][col].toString(), { delay: 100 });
        await page.waitForTimeout(150);
      }
    }

    // Wait for completion state to propagate
    await expect(async () => {
      const isCompleted = await page.evaluate(() => {
        const sessionData = localStorage.getItem('sudoku:current-session');
        if (!sessionData) return false;
        const parsed = JSON.parse(sessionData);
        return parsed.data.isCompleted === true;
      });
      expect(isCompleted).toBe(true);
    }).toPass({ timeout: 5000, intervals: [100] });

    // Verify modal appears (increased timeout for WebKit)
    await page.waitForSelector('.modal-overlay:has-text("Congratulations")', { timeout: 5000 });

    // Wait a bit to ensure modal doesn't disappear/reappear
    await page.waitForTimeout(1000);

    // Modal should still be visible (and only one instance)
    const modalCount = await page.locator('.modal-overlay:has-text("Congratulations")').count();
    expect(modalCount).toBe(1);
  });
});

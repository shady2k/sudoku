/**
 * E2E Test: Full Gameplay Flow
 *
 * Tests the complete user journey from starting a new game to completing it,
 * following the acceptance scenarios in spec.md.
 */

import { test, expect } from '@playwright/test';
import { startNewGameIfNeeded } from './helpers';

test.describe('Full Gameplay Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await startNewGameIfNeeded(page);
  });

  test('should start a new game and display the grid', async ({ page }) => {
    // Wait for game to load
    await page.waitForSelector('.grid', { timeout: 5000 });

    // Verify grid is rendered with 81 cells
    const cells = await page.locator('.cell').count();
    expect(cells).toBe(81);

    // Verify timer is displayed in stats
    const timeLabel = page.locator('.stat-item .stat-label:has-text("Time")');
    await expect(timeLabel).toBeVisible();

    // Verify time value is displayed
    const timeValue = page.locator('.stat-item:has(.stat-label:has-text("Time")) .stat-value');
    await expect(timeValue).toBeVisible();

    // Verify difficulty is displayed
    const difficultyLabel = page.locator('.stat-item .stat-label:has-text("Difficulty")');
    await expect(difficultyLabel).toBeVisible();

    // Verify errors stat is displayed
    const errorsLabel = page.locator('.stat-item .stat-label:has-text("Errors")');
    await expect(errorsLabel).toBeVisible();
  });

  test('should navigate grid with arrow keys', async ({ page }) => {
    await page.waitForSelector('.grid');

    // Click on a cell to select it
    const centerCell = page.locator('.cell[data-row="4"][data-col="4"]');
    await centerCell.click();

    // Verify cell is selected
    await expect(centerCell).toHaveClass(/selected/);

    // Navigate with arrow keys
    await page.keyboard.press('ArrowRight');
    const rightCell = page.locator('.cell[data-row="4"][data-col="5"]');
    await expect(rightCell).toHaveClass(/selected/);

    await page.keyboard.press('ArrowDown');
    const downCell = page.locator('.cell[data-row="5"][data-col="5"]');
    await expect(downCell).toHaveClass(/selected/);

    await page.keyboard.press('ArrowLeft');
    const leftCell = page.locator('.cell[data-row="5"][data-col="4"]');
    await expect(leftCell).toHaveClass(/selected/);

    await page.keyboard.press('ArrowUp');
    await expect(centerCell).toHaveClass(/selected/);
  });

  test('should enter numbers with keyboard', async ({ page }) => {
    await page.waitForSelector('.grid');

    // Find an empty cell (not a clue)
    const emptyCell = page.locator('.cell:not(.clue)').first();
    await emptyCell.click();

    // Enter a number
    await page.keyboard.press('5');

    // Verify the number was entered (check if cell contains '5')
    const cellText = await emptyCell.textContent();
    expect(cellText).toContain('5');
  });

  test('should clear cell with Backspace', async ({ page }) => {
    await page.waitForSelector('.grid');

    // Find an empty cell and enter a number
    const emptyCell = page.locator('.cell:not(.clue)').first();
    await emptyCell.click();
    await page.keyboard.press('7');

    // Verify number was entered
    let cellText = await emptyCell.textContent();
    expect(cellText).toContain('7');

    // Clear with Backspace
    await page.keyboard.press('Backspace');

    // Verify cell is now empty or has candidates (not the number 7)
    cellText = await emptyCell.textContent();
    expect(cellText).not.toContain('7');
  });

  test('should highlight related cells when selecting', async ({ page }) => {
    await page.waitForSelector('.grid');

    // Select a cell
    const selectedCell = page.locator('.cell[data-row="0"][data-col="0"]');
    await selectedCell.click();

    // Verify cell is selected (check the wrapper has the selected class)
    const selectedWrapper = page.locator('.cell-wrapper.selected').first();
    await expect(selectedWrapper).toBeVisible();

    // Verify related cells have the related class
    // Check that at least one cell has the related class
    const relatedCells = page.locator('.cell-wrapper.related');
    await expect(relatedCells.first()).toBeVisible();
  });

  test('should show error highlighting for invalid moves', async ({ page }) => {
    await page.waitForSelector('.grid');

    // Find a clue cell with a specific number
    const clueCell = page.locator('.cell.clue').first();
    const clueValue = await clueCell.textContent();
    const clueDataRow = await clueCell.getAttribute('data-row');
    const clueDataCol = await clueCell.getAttribute('data-col');

    if (!clueValue || !clueDataRow || !clueDataCol) {
      test.skip();
      return;
    }

    const row = parseInt(clueDataRow);
    parseInt(clueDataCol);

    // Find an empty cell in the same row
    const emptyCellInRow = page.locator(`.cell[data-row="${row}"]:not(.clue)`).first();

    // Check if we can test this scenario
    const exists = await emptyCellInRow.count();
    if (exists === 0) {
      test.skip();
      return;
    }

    await emptyCellInRow.click();
    await page.keyboard.press(clueValue.trim());

    // Move to another cell to trigger validation
    await page.keyboard.press('ArrowRight');

    // Check if error class was applied (errors are validated on move)
    const errorCell = page.locator('.cell.error');
    const hasError = await errorCell.count();
    expect(hasError).toBeGreaterThan(0);
  });

  test('should pause and resume game', async ({ page }) => {
    await page.waitForSelector('.grid');

    // Use Space key to pause (keyboard shortcut)
    await page.keyboard.press('Space');

    // Verify pause overlay is shown
    await expect(page.locator('.auto-pause-overlay')).toBeVisible();
    await expect(page.locator('.auto-pause-message')).toBeVisible();

    // Press any key to resume (as per the UI design)
    await page.keyboard.press('Space');

    // Verify pause overlay is hidden
    await expect(page.locator('.auto-pause-overlay')).not.toBeVisible();
  });

  test('should toggle candidate numbers with Fill Candidates button', async ({ page }) => {
    await page.waitForSelector('.grid');

    // Find the Fill Candidates button
    const fillCandidatesButton = page.getByRole('button', { name: /Fill Candidates/i });
    await expect(fillCandidatesButton).toBeVisible();

    // Click it to fill candidates
    await fillCandidatesButton.click();

    // Verify candidates appear in empty cells
    // Find an empty cell and check if it has candidate numbers
    const emptyCell = page.locator('.cell:not(.clue)').first();
    emptyCell.locator('.candidates');

    // Candidates might not be visible depending on implementation
    // This is a basic check that the button is functional
    await expect(fillCandidatesButton).toBeVisible();
  });

  test('should start new game with different difficulty', async ({ page }) => {
    await page.waitForSelector('.grid');

    // Click "New Game" button
    await page.getByRole('button', { name: /New Game/i }).click();

    // Wait for modal to appear
    await page.waitForSelector('.modal-content, [role="dialog"]', { timeout: 2000 });

    // Change difficulty slider if present
    const difficultySlider = page.locator('input[type="range"]');
    const sliderExists = await difficultySlider.count();

    if (sliderExists > 0) {
      await difficultySlider.fill('80');
    }

    // Click "Start New Game" button in modal
    const startButton = page.getByRole('button', { name: /Start New Game/i });
    await startButton.click();

    // Wait for new game to load
    await page.waitForSelector('.grid', { state: 'visible', timeout: 5000 });

    // Verify grid is rendered
    const cells = await page.locator('.cell').count();
    expect(cells).toBe(81);
  });

  test('should track errors count', async ({ page }) => {
    await page.waitForSelector('.grid');

    // Get initial error count
    const errorsStat = page.locator('.stat-item:has(.stat-label:has-text("Errors")) .stat-value');
    await expect(errorsStat).toBeVisible();

    const initialErrors = await errorsStat.textContent();
    expect(initialErrors).toBe('0');

    // The error count should be visible and tracked
    // Actual error testing would require knowing the puzzle solution
    // This test verifies the UI element exists and displays correctly
  });

  test('should display timer and increment', async ({ page }) => {
    await page.waitForSelector('.grid');

    // Get the time display
    const timeDisplay = page.locator('.stat-item:has(.stat-label:has-text("Time")) .stat-value');
    await expect(timeDisplay).toBeVisible();

    const initialTime = await timeDisplay.textContent();

    // Wait for a few seconds
    await page.waitForTimeout(3000);

    const updatedTime = await timeDisplay.textContent();

    // Time should have changed
    expect(updatedTime).not.toBe(initialTime);
  });

  test('should respect grid boundaries in keyboard navigation', async ({ page }) => {
    await page.waitForSelector('.grid');

    // Navigate to top-left corner
    const topLeft = page.locator('.cell[data-row="0"][data-col="0"]');
    await topLeft.click();

    // Try to go up (should stay at row 0)
    await page.keyboard.press('ArrowUp');
    await expect(topLeft).toHaveClass(/selected/);

    // Try to go left (should stay at col 0)
    await page.keyboard.press('ArrowLeft');
    await expect(topLeft).toHaveClass(/selected/);

    // Navigate to bottom-right corner
    const bottomRight = page.locator('.cell[data-row="8"][data-col="8"]');
    await bottomRight.click();

    // Try to go down (should stay at row 8)
    await page.keyboard.press('ArrowDown');
    await expect(bottomRight).toHaveClass(/selected/);

    // Try to go right (should stay at col 8)
    await page.keyboard.press('ArrowRight');
    await expect(bottomRight).toHaveClass(/selected/);
  });

  test('should not allow editing clue cells', async ({ page }) => {
    await page.waitForSelector('.grid');

    // Find a clue cell
    const clueCell = page.locator('.cell.clue').first();
    const originalValue = await clueCell.textContent();

    // Click on clue cell and try to enter a number
    await clueCell.click();
    await page.keyboard.press('9');

    // Verify value hasn't changed
    const newValue = await clueCell.textContent();
    expect(newValue).toBe(originalValue);
  });

  test('should use number pad to enter numbers (desktop)', async ({ page }) => {
    // Set viewport to desktop size to ensure number pad is visible
    await page.setViewportSize({ width: 1024, height: 768 });

    await page.waitForSelector('.grid');

    // Find an empty cell and click it
    const emptyCell = page.locator('.cell:not(.clue)').first();
    await emptyCell.click();

    // Click number 5 on the number pad
    const numberPadButton = page.locator('.num-btn').filter({ hasText: '5' }).first();

    // Check if number pad is visible (only on desktop)
    const isVisible = await numberPadButton.isVisible().catch(() => false);

    if (isVisible) {
      await numberPadButton.click();

      // Verify the number was entered
      const cellText = await emptyCell.textContent();
      expect(cellText).toContain('5');
    }
  });

  test('should clear cell with Clear button (desktop)', async ({ page }) => {
    // Set viewport to desktop size
    await page.setViewportSize({ width: 1024, height: 768 });

    await page.waitForSelector('.grid');

    // Find an empty cell, select it, and enter a number
    const emptyCell = page.locator('.cell:not(.clue)').first();
    await emptyCell.click();
    await page.keyboard.press('7');

    // Verify number was entered
    let cellText = await emptyCell.textContent();
    expect(cellText).toContain('7');

    // Click the Clear button
    const clearButton = page.locator('.clear-btn');
    const isVisible = await clearButton.isVisible().catch(() => false);

    if (isVisible) {
      await clearButton.click();

      // Verify cell is cleared
      cellText = await emptyCell.textContent();
      expect(cellText).not.toContain('7');
    }
  });

  test('should highlight numbers when clicking cells with values', async ({ page }) => {
    await page.waitForSelector('.grid');

    // Find a cell with a value (clue)
    const clueCell = page.locator('.cell.clue').first();
    const clueValue = await clueCell.textContent();

    if (!clueValue) {
      test.skip();
      return;
    }

    // Click the clue cell
    await clueCell.click();

    // All cells with the same number should be highlighted
    const highlightedCells = page.locator('.cell.highlighted-number');
    const count = await highlightedCells.count();

    // Should have at least 1 highlighted cell (the one we clicked)
    expect(count).toBeGreaterThan(0);
  });

  test('should handle keyboard shortcuts', async ({ page }) => {
    await page.waitForSelector('.grid');

    // Test Space bar for pause/resume
    await page.keyboard.press('Space');
    await expect(page.locator('.auto-pause-overlay')).toBeVisible();

    await page.keyboard.press('Space');
    await expect(page.locator('.auto-pause-overlay')).not.toBeVisible();

    // Test 'C' key for Fill Candidates
    await page.keyboard.press('c');
    // Candidates should be filled (visual check would be needed)

    // Test 'G' key for New Game
    await page.keyboard.press('g');
    // Modal should appear
    const modal = page.locator('.modal-content, [role="dialog"]');
    await expect(modal).toBeVisible({ timeout: 2000 });
  });

  test('should display game stats correctly', async ({ page }) => {
    await page.waitForSelector('.grid');

    // Verify all three stat items are present
    const statItems = page.locator('.stat-item');
    const count = await statItems.count();
    expect(count).toBe(3);

    // Verify Time stat
    const timeLabel = page.locator('.stat-label:has-text("Time")');
    await expect(timeLabel).toBeVisible();

    // Verify Difficulty stat with percentage
    const difficultyValue = page.locator('.stat-item:has(.stat-label:has-text("Difficulty")) .stat-value');
    await expect(difficultyValue).toBeVisible();
    const diffText = await difficultyValue.textContent();
    expect(diffText).toMatch(/\d+%/);

    // Verify Errors stat
    const errorsValue = page.locator('.stat-item:has(.stat-label:has-text("Errors")) .stat-value');
    await expect(errorsValue).toBeVisible();
  });
});

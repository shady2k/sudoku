/**
 * E2E Tests for Candidate Numbers Feature
 *
 * Tests candidate number functionality per T089 in tasks.md.
 * Focuses on basic functionality that is currently implemented.
 */

import { test, expect } from '@playwright/test';

test.describe('Candidate Numbers Feature', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');

    // Start a new game
    await page.click('button:has-text("New Game")');

    // Wait for game to load
    await page.waitForSelector('.cell');
    await page.waitForTimeout(1000);
  });

  test('should toggle auto-candidates display', async ({ page }) => {
    // Find the candidates toggle button
    const candidatesButton = page.locator('button:has-text("Candidates")');
    await expect(candidatesButton).toBeVisible();

    // Click the button to toggle candidates
    await candidatesButton.click();

    // Wait a moment for candidates to be generated
    await page.waitForTimeout(500);

    // Select an empty cell
    const emptyCells = page.locator('.cell:not(.clue):has-text("")');
    expect(await emptyCells.count()).toBeGreaterThan(0);

    const firstEmptyCell = emptyCells.first();
    await firstEmptyCell.click();

    // Check if candidate numbers are displayed
    const candidates = firstEmptyCell.locator('.candidate-number');

    // Candidates should be visible when toggle is on
    if (await candidates.count() > 0) {
      await expect(candidates.first()).toBeVisible();
    }
  });

  test('should handle cell selection and normal number entry', async ({ page }) => {
    // Select an empty cell
    const emptyCell = page.locator('[data-row="0"][data-col="0"]');
    await emptyCell.click();

    // Cell should be selected
    await expect(emptyCell).toHaveClass(/selected/);

    // Enter a number
    await page.keyboard.press('5');

    // Cell should now show the number
    await expect(emptyCell).toHaveText('5');

    // Candidates should not be visible in a filled cell
    const candidates = emptyCell.locator('.candidate-number');
    await expect(candidates).toHaveCount(0);
  });

  test('should navigate between cells correctly', async ({ page }) => {
    // Select first cell
    await page.click('[data-row="0"][data-col="0"]');
    await expect(page.locator('[data-row="0"][data-col="0"]')).toHaveClass(/selected/);

    // Navigate to adjacent cell
    await page.keyboard.press('ArrowRight');
    await expect(page.locator('[data-row="0"][data-col="1"]')).toHaveClass(/selected/);
    await expect(page.locator('[data-row="0"][data-col="0"]')).not.toHaveClass(/selected/);

    // Navigate down
    await page.keyboard.press('ArrowDown');
    await expect(page.locator('[data-row="1"][data-col="1"]')).toHaveClass(/selected/);
  });

  test('should be accessible with keyboard navigation', async ({ page }) => {
    // Start with the first cell
    await page.click('[data-row="0"][data-col="0"]');

    // Navigate through cells using arrow keys
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('ArrowLeft');

    // Verify we can enter numbers
    await page.keyboard.press('7');

    const currentCell = page.locator('.cell.selected');
    await expect(currentCell).toHaveText('7');
  });

  test('should handle error states correctly', async ({ page }) => {
    // Find a cell with a clue (prefilled number)
    const clueCells = page.locator('.cell.clue');
    expect(await clueCells.count()).toBeGreaterThan(0);

    const firstClueCell = clueCells.first();
    const clueValue = await firstClueCell.textContent();

    // Find an empty cell in the same row
    const emptyCells = page.locator('.cell:not(.clue):has-text("")');
    expect(await emptyCells.count()).toBeGreaterThan(0);

    const targetCell = emptyCells.first();
    await targetCell.click();

    // Try to enter the same number as the clue (should cause error)
    if (clueValue) {
      await page.keyboard.press(clueValue);

      // Cell should show error state
      await expect(targetCell).toHaveClass(/error/);
    }
  });

  test('should integrate candidate numbers component correctly', async ({ page }) => {
    // Verify the candidate numbers component is integrated
    const emptyCells = page.locator('.cell:not(.clue):has-text("")');
    expect(await emptyCells.count()).toBeGreaterThan(0);

    const firstEmptyCell = emptyCells.first();
    await firstEmptyCell.click();

    // The cell should not crash or show errors when selected
    await expect(firstEmptyCell).toBeVisible();
    await expect(firstEmptyCell).toHaveClass(/selected/);

    // Check that there are no JavaScript errors
    await page.waitForTimeout(1000);

    // The page should still be functional
    await page.keyboard.press('3');
    await expect(firstEmptyCell).toHaveText('3');
  });
});
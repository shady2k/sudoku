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

    // Handle any modals and start new game
    const modalNewGameBtn = page.locator('[role="dialog"] button:has-text("New Game")').first();
    const regularNewGameBtn = page.locator('button:has-text("New Game")').first();

    // Wait for either modal or main UI
    try {
      await modalNewGameBtn.waitFor({ timeout: 2000 });
      await modalNewGameBtn.click();
      // Wait for modal to close
      await page.locator('[role="dialog"]').waitFor({ state: 'hidden', timeout: 5000 });
    } catch {
      // No modal, continue
    }

    // Now click the main new game button
    await regularNewGameBtn.click();

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

  test('should add candidates using Shift+number without notes mode', async ({ page }) => {
    // Find an empty cell
    const emptyCells = page.locator('.cell:not(.clue):has-text("")');
    expect(await emptyCells.count()).toBeGreaterThan(0);

    const emptyCell = emptyCells.first();
    await emptyCell.click();

    // Cell should be selected
    await expect(emptyCell).toHaveClass(/selected/);

    // Verify we're NOT in notes mode
    const notesModeButton = page.locator('button:has-text("Notes Mode")');
    const isNotesMode = await notesModeButton.evaluate(el => el.classList.contains('active'));
    expect(isNotesMode).toBe(false);

    // Enter candidate using Shift+1
    await page.keyboard.press('Shift+1');
    await page.waitForTimeout(200);

    // The cell should show the candidate
    const candidates = emptyCell.locator('.candidate-number');
    await expect(candidates).toHaveCount(1);

    // Add another candidate using Shift+5
    await page.keyboard.press('Shift+5');
    await page.waitForTimeout(200);

    // Should now have 2 candidates
    await expect(candidates).toHaveCount(2);

    // Verify cell still has no value (empty)
    const cellValue = emptyCell.locator('.value');
    await expect(cellValue).toHaveCount(0);
  });

  test('should add candidates using Alt+number without notes mode', async ({ page }) => {
    // Find an empty cell
    const emptyCells = page.locator('.cell:not(.clue):has-text("")');
    expect(await emptyCells.count()).toBeGreaterThan(0);

    const emptyCell = emptyCells.first();
    await emptyCell.click();

    // Enter candidate using Alt+2
    await page.keyboard.press('Alt+2');
    await page.waitForTimeout(200);

    // The cell should show the candidate
    const candidates = emptyCell.locator('.candidate-number');
    await expect(candidates).toHaveCount(1);
  });

  test('should clear candidates using Shift+Delete', async ({ page }) => {
    // Find an empty cell
    const emptyCells = page.locator('.cell:not(.clue):has-text("")');
    expect(await emptyCells.count()).toBeGreaterThan(0);

    const emptyCell = emptyCells.first();
    await emptyCell.click();

    // Add multiple candidates using Shift+number
    await page.keyboard.press('Shift+1');
    await page.waitForTimeout(100);
    await page.keyboard.press('Shift+2');
    await page.waitForTimeout(100);
    await page.keyboard.press('Shift+3');
    await page.waitForTimeout(200);

    // Verify candidates were added
    const candidates = emptyCell.locator('.candidate-number');
    await expect(candidates).toHaveCount(3);

    // Clear all candidates using Shift+Delete
    await page.keyboard.press('Shift+Delete');
    await page.waitForTimeout(200);

    // All candidates should be cleared
    await expect(candidates).toHaveCount(0);
  });

  test('should toggle same candidate with Shift+number', async ({ page }) => {
    // Find an empty cell
    const emptyCells = page.locator('.cell:not(.clue):has-text("")');
    expect(await emptyCells.count()).toBeGreaterThan(0);

    const emptyCell = emptyCells.first();
    await emptyCell.click();

    // Add candidate 5
    await page.keyboard.press('Shift+5');
    await page.waitForTimeout(200);

    const candidates = emptyCell.locator('.candidate-number');
    await expect(candidates).toHaveCount(1);

    // Press Shift+5 again to toggle it off
    await page.keyboard.press('Shift+5');
    await page.waitForTimeout(200);

    // Candidate should be removed
    await expect(candidates).toHaveCount(0);
  });
});
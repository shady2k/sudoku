import type { Page } from '@playwright/test';

/**
 * Helper function to start a new game if the modal is shown
 *
 * This function handles multiple scenarios:
 * 1. New game modal is shown (no saved game) - clicks start button
 * 2. Resume modal is shown (saved game exists) - clicks start new game
 * 3. No modal (game already loaded) - just waits for grid
 */
export async function startNewGameIfNeeded(page: Page): Promise<void> {
  // Check if "Start New Game" button is visible (in modal)
  const startButton = page.getByRole('button', { name: /^start new game$/i });

  const startButtonVisible = await startButton.isVisible().catch(() => false);

  let gameWasStarted = false;

  if (startButtonVisible) {
    await startButton.click();
    gameWasStarted = true;
    // Wait for the modal to close and grid to appear
    await page.locator('.grid').waitFor({ state: 'visible', timeout: 5000 });
  } else {
    // Ensure grid is visible (in case we didn't click start button)
    await page.locator('.grid').waitFor({ state: 'visible', timeout: 5000 });
  }

  // Check if the game is paused and resume if needed
  const pauseOverlay = page.getByRole('button', { name: /game paused/i });
  const pauseVisible = await pauseOverlay.isVisible().catch(() => false);

  if (pauseVisible) {
    await pauseOverlay.click();
    // Wait for overlay to disappear
    await pauseOverlay.waitFor({ state: 'hidden', timeout: 2000 });
  }

  // Always wait a bit for the game to be fully ready
  // This ensures cells are interactive, especially in WebKit/CI
  if (gameWasStarted) {
    // Extra delay for game initialization and cells to become interactive
    await page.waitForTimeout(1000);
  }
}

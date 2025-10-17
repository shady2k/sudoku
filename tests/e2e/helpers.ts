import type { Page } from '@playwright/test';

/**
 * Helper function to start a new game if the modal is shown
 */
export async function startNewGameIfNeeded(page: Page): Promise<void> {
  // Check if "Start New Game" button is visible (in modal)
  const startButton = page.getByRole('button', { name: /^start new game$/i });

  const startButtonVisible = await startButton.isVisible().catch(() => false);

  if (startButtonVisible) {
    await startButton.click();
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
}

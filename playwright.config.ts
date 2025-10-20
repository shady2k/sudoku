import { defineConfig, devices } from '@playwright/test';

/**
 * See https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 4 : 4,
  reporter: process.env.CI ? 'html' : 'list',
  timeout: 60000, // 60 seconds per test
  expect: {
    timeout: 5000, // 5 seconds for assertions
  },

  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    actionTimeout: 10000, // 10 seconds for actions
    navigationTimeout: 10000, // 10 seconds for page loads
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: {
        ...devices['Desktop Safari'],
        actionTimeout: 15000, // Increased from 10s for WebKit-specific timing
        navigationTimeout: 15000, // Increased from 10s for WebKit-specific timing
      },
      timeout: 90000, // 90 seconds instead of 60 for WebKit tests
    },
    // Mobile testing
    // {
    //   name: 'Mobile Chrome',
    //   use: { ...devices['Pixel 5'] },
    // },
    // {
    //   name: 'Mobile Safari',
    //   use: { ...devices['iPhone 12'] },
    // },
  ],

  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },
});

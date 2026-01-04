import { defineConfig, devices } from '@playwright/test'
import * as dotenv from 'dotenv'
import * as path from 'path'

/**
 * Read environment variables from file.
 * https://github.com/motdotla/dotenv
 */
// Load test environment variables from .env.test.local
dotenv.config({ path: path.resolve(__dirname, '.env.test.local') })

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  testDir: './e2e',
  /* Run tests in files in parallel */
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  /* Sequential execution to avoid database/server overload under concurrent load */
  workers: 1,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: [['html'], ['json', { outputFile: 'playwright-report/test-results.json' }], ['list']],
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('/')`. */
    baseURL: process.env.PLAYWRIGHT_TEST_BASE_URL || 'http://localhost:3000',

    /* Increase timeout for slower operations (database queries, page loads) */
    actionTimeout: 60000, // 60 seconds per action (was 30s default)
    navigationTimeout: 60000, // 60 seconds for page navigations

    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: 'on-first-retry',

    /* Screenshot on failure */
    screenshot: 'only-on-failure',

    /* Video on failure */
    video: 'retain-on-failure',
  },

  /* Configure projects for major browsers */
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        // Prevent multiple tabs/windows
        launchOptions: {
          args: ['--disable-features=TranslateUI', '--disable-extensions'],
        },
      },
    },

    // Disable other browsers for faster testing
    // Uncomment when needed for cross-browser testing
    // {
    //   name: 'firefox',
    //   use: { ...devices['Desktop Firefox'] },
    // },

    // {
    //   name: 'webkit',
    //   use: { ...devices['Desktop Safari'] },
    // },

    // /* Test against mobile viewports. */
    // {
    //   name: 'Mobile Chrome',
    //   use: { ...devices['Pixel 5'] },
    // },
    // {
    //   name: 'Mobile Safari',
    //   use: { ...devices['iPhone 12'] },
    // },

    /* Test against branded browsers. */
    // {
    //   name: 'Microsoft Edge',
    //   use: { ...devices['Desktop Edge'], channel: 'msedge' },
    // },
    // {
    //   name: 'Google Chrome',
    //   use: { ...devices['Desktop Chrome'], channel: 'chrome' },
    // },
  ],

  /* Run your local dev server before starting the tests */
  // webServer temporarily disabled - server crashes with Turbopack errors
  // Run server manually: PORT=3005 npm run dev
  // webServer: {
  //   command: 'npm run dev',
  //   url: 'http://localhost:3005',
  //   reuseExistingServer: !process.env.CI,
  //   stdout: 'ignore',
  //   stderr: 'pipe',
  //   timeout: 120000, // 2 minutes for server to start
  // },
})

import { defineConfig } from '@playwright/test';

const baseURL = process.env.E2E_BASE_URL || 'http://localhost:3099';
const isRemote = baseURL.startsWith('https://');

export default defineConfig({
  testDir: './e2e',
  timeout: 30_000,
  retries: 0,
  use: {
    baseURL,
    headless: true,
  },
  projects: [
    { name: 'chromium', use: { browserName: 'chromium' } },
  ],
  ...(!isRemote && {
    webServer: {
      command: 'npx next dev --port 3099',
      port: 3099,
      reuseExistingServer: !process.env.CI,
    },
  }),
});

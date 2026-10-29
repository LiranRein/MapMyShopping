import { existsSync } from 'node:fs';
import { defineConfig, devices } from '@playwright/test';

if (existsSync('.env.test.local')) process.loadEnvFile('.env.test.local');

process.env.E2E_PREFIX ??= `t_e2e${Date.now().toString(36)}_`;

const PORT = 5180;

export default defineConfig({
  testDir: 'tests/e2e',
  fullyParallel: false,
  workers: 1,
  timeout: 60000,
  expect: { timeout: 15000 },
  globalTeardown: './tests/e2e/globalTeardown.js',
  use: {
    ...devices['Pixel 7'],
    viewport: { width: 375, height: 812 },
    baseURL: `http://localhost:${PORT}`,
    locale: 'he-IL',
  },
  webServer: {
    command: `npx vite --port ${PORT} --strictPort`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: false,
    env: {
      VITE_SUPABASE_URL: process.env.SUPABASE_URL,
      VITE_SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY,
    },
  },
});

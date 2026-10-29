import { existsSync } from 'node:fs';
import { defineConfig } from 'vitest/config';

if (existsSync('.env.test.local')) process.loadEnvFile('.env.test.local');

export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/integration/**/*.test.js'],
    globalSetup: ['tests/integration/globalSetup.js'],
    fileParallelism: false,
    testTimeout: 30000,
    hookTimeout: 60000,
  },
});

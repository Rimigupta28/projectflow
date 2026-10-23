import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    testTimeout: 60000,
    hookTimeout: 120000,
    // One in-memory MongoDB per test file; run files one at a time to keep it simple.
    fileParallelism: false,
  },
});

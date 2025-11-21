import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./tests/setup.js'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'tests/',
        '*.config.js',
        'dist/',
      ],
    },
    include: ['tests/**/*.test.js'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './assets/js'),
      '@utils': path.resolve(__dirname, './assets/js/utils'),
      '@features': path.resolve(__dirname, './assets/js/features'),
      '@core': path.resolve(__dirname, './assets/js/core'),
      '@constants': path.resolve(__dirname, './assets/js/constants'),
    },
  },
});

import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'node:path';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  // Make Vite-style env available under import.meta.env in tests
  envPrefix: 'VITE_',
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    css: true,
    // Critical: inject env so client.ts does not throw on import
    env: {
      VITE_API_URL: 'http://localhost:8000',
    },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      reportsDirectory: './coverage',
      include: ['src/**/*.{ts,tsx}'],
      exclude: ['src/main.tsx', 'src/test/**', '**/*.d.ts', '**/*.{test,spec}.{ts,tsx}'],
      thresholds: {
        // 10 for this branch - To be fixed next branch
        lines: 10,
        functions: 10,
        branches: 10,
        statements: 10,
      },
    },
  },
});

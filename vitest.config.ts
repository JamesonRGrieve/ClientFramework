// SPDX-License-Identifier: AGPL-3.0-or-later
import path from 'path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom',
    setupFiles: ['src/__tests__/setup.ts'],
    exclude: ['**/node_modules/**', '.next/**', 'dist/**', 'e2e/**', '**/*.stories.{ts,tsx}', '.claude/**', 'security/**'],
    globals: true,
    server: {
      deps: {
        // Bundler-targeted packages (they import next/navigation, next/server, ...): let vite
        // resolve them the way Next does instead of handing them to Node's loader.
        inline: ['@zephyrex/auth', '@jgrieve/forms'],
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});

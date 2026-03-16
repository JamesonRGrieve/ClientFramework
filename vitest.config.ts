import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    environment: 'jsdom',
    setupFiles: ['src/__tests__/setup.ts'],
    exclude: ['**/node_modules/**', '.next/**', 'dist/**', 'e2e/**', '**/*.stories.{ts,tsx}', '.claude/**'],
    globals: true,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@jgrieve/appwrapper': path.resolve(__dirname, './src/components/appwrapper/src'),
      '@jgrieve/auth': path.resolve(__dirname, './src/components/auth/src'),
      '@jgrieve/dynamic-form': path.resolve(__dirname, './src/components/dynamic-form/src'),
      '@jgrieve/next-log': path.resolve(__dirname, './src/lib/next-log/src'),
      zod2gql: path.resolve(__dirname, './src/lib/zod2gql/src'),
    },
  },
});

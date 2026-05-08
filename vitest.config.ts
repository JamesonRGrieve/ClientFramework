import path from 'node:path';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
      '@/auth': path.resolve(__dirname, 'src/components/auth/src'),
      '@/appwrapper': path.resolve(__dirname, 'src/components/appwrapper/src'),
      '@/dynamic-form': path.resolve(__dirname, 'src/components/dynamic-form/src'),
      '@/next-log': path.resolve(__dirname, 'src/lib/next-log/src'),
      '@/zod2gql': path.resolve(__dirname, 'src/lib/zod2gql/src'),
    },
  },
  test: {
    include: ['src/**/*.test.{ts,tsx}', 'tests/**/*.test.{ts,tsx}'],
    exclude: ['node_modules/**', '.next/**', 'storybook-static/**', 'src/components/auth/**', 'src/lib/zod2gql/**'],
    environment: 'happy-dom',
    globals: true,
    setupFiles: ['./vitest.setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      include: ['src/**/*.{ts,tsx}'],
      exclude: [
        'node_modules/**',
        '.next/**',
        '**/*.test.{ts,tsx}',
        '**/*.stories.{ts,tsx}',
        '**/*.d.ts',
        'src/components/auth/**',
        'src/lib/zod2gql/**',
        'src/lib/next-log/**',
      ],
    },
  },
});

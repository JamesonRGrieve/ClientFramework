// SPDX-License-Identifier: AGPL-3.0-or-later
import path from 'path';
import { defineConfig } from 'vitest/config';

const SETUP = path.resolve(__dirname, './packages/zephyrex/src/__tests__/setup.ts');

// Bundler-targeted packages (they import next/navigation, next/server, ...): let vite resolve them
// the way Next does instead of handing them to Node's loader.
const BUNDLER_PACKAGES = ['zephyrex', '@zephyrex/auth', '@jgrieve/forms'];

/** One test project: its files, and what `@` means inside them. */
const project = (name: string, root: string) => ({
  extends: true,
  test: {
    name,
    root,
    include: ['src/**/*.test.{ts,tsx}'],
    environment: 'jsdom',
    setupFiles: [SETUP],
    globals: true,
    server: { deps: { inline: BUNDLER_PACKAGES } },
  },
  resolve: { alias: { '@': path.resolve(root, './src') } },
});

export default defineConfig({
  test: {
    projects: [
      project('template', path.resolve(__dirname)),
      project('zephyrex', path.resolve(__dirname, 'packages/zephyrex')),
    ],
  },
});

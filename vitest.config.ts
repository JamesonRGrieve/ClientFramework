// SPDX-License-Identifier: AGPL-3.0-or-later
import { globSync } from 'node:fs';
import path from 'path';
import { defineConfig, type TestProjectInlineConfiguration } from 'vitest/config';

const SETUP = path.resolve(__dirname, './vitest.setup.ts');

// Bundler-targeted packages (they import next/navigation, next/server, ...): let vite resolve them
// the way Next does instead of handing them to Node's loader.
const BUNDLER_PACKAGES = ['zephyrex', '@zephyrex/auth', '@jgrieve/forms'];

const SOURCE_TESTS = 'src/**/*.test.{ts,tsx}';

/** One test project: its files, and what `@` means inside them. */
const project = (name: string, root: string, include: string[] = [SOURCE_TESTS]): TestProjectInlineConfiguration => ({
  extends: true,
  test: {
    name,
    root,
    include,
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
      // The template app, and the workspace's own tooling (build scripts, Storybook).
      project('template', path.resolve(__dirname), [SOURCE_TESTS, 'scripts/**/*.test.ts', '.storybook/**/*.test.ts']),
      ...globSync('packages/*/', { cwd: __dirname })
        .sort()
        .map((dir) => project(path.basename(dir), path.resolve(__dirname, dir))),
    ],
  },
});

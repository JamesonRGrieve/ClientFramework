// SPDX-License-Identifier: AGPL-3.0-or-later
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { StorybookConfig } from '@storybook/nextjs';

// Storybook 10 loads this file as ESM, which has no __dirname.
const here = path.dirname(fileURLToPath(import.meta.url));

const config: StorybookConfig = {
  stories: ['../src/**/*.stories.@(js|jsx|mjs|ts|tsx|mdx)'],
  // Storybook 9+ ships actions, controls, viewport and interactions in core.
  addons: [
    '@storybook/addon-links',
    '@storybook/addon-docs',
    '@storybook/addon-a11y',
    '@storybook/addon-coverage',
    'msw-storybook-addon',
  ],
  framework: {
    name: '@storybook/nextjs',
    options: {},
  },
  // Autodocs follow the `autodocs` tag, Storybook's default since 9.
  docs: { defaultName: 'Documentation' },
  // ./public holds msw's generated mockServiceWorker.js, kept out of the template app's public/ so
  // production never serves the mock worker.
  staticDirs: ['./public'],
  // `@` is src/, relative to this file (not the directory storybook was started from). The
  // framework's own packages resolve from node_modules like any consumer's.
  webpackFinal: async (webpackConfig) => {
    if (webpackConfig.resolve) {
      webpackConfig.resolve.alias = { ...webpackConfig.resolve.alias, '@': path.resolve(here, '../src') };
    }
    return webpackConfig;
  },
};
export default config;

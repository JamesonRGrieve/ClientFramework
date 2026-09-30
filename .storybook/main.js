// SPDX-License-Identifier: AGPL-3.0-or-later
import path from 'path';

const config = {
  stories: ['../src/**/*.stories.@(js|jsx|mjs|ts|tsx|mdx)'],
  addons: [
    '@storybook/addon-links',
    '@storybook/addon-essentials',
    '@storybook/addon-interactions',
    '@storybook/addon-docs',
    '@storybook/addon-a11y',
    '@storybook/addon-coverage',
    'msw-storybook-addon',
  ],
  framework: {
    name: '@storybook/nextjs',
    options: {},
  },
  docs: {
    autodocs: 'tag',
    defaultName: 'Documentation',
  },
  staticDirs: ['../public'],
  // `@` is src/, relative to this file (not the directory storybook was started from). The
  // framework's own packages resolve from node_modules like any consumer's.
  webpackFinal: async (config) => {
    if (config.resolve) {
      config.resolve.alias = { ...config.resolve.alias, '@': path.resolve(__dirname, '../src') };
    }
    return config;
  },
};
export default config;

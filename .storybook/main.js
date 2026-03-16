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
  webpackFinal: async (config, { configType }) => {
    if (config.resolve) {
      const rootDir = path.resolve('../src');
      config.resolve.alias = {
        ...config.resolve.alias,
        '@': rootDir,
        '@jgrieve/next-log': path.resolve(rootDir, 'lib/next-log/src'),
        'zod2gql': path.resolve(rootDir, 'lib/zod2gql/src'),
        '@jgrieve/auth': path.resolve(rootDir, 'components/auth/src'),
        '@jgrieve/appwrapper': path.resolve(rootDir, 'components/appwrapper/src'),
        '@jgrieve/dynamic-form': path.resolve(rootDir, 'components/dynamic-form/src'),
        '@/interactive': path.resolve(rootDir, 'interactive/src'),
        '@/interface': path.resolve(rootDir, 'interface'),
        '@/iteration': path.resolve(rootDir, 'iteration'),
      };
    }

    return config;
  },
};
export default config;

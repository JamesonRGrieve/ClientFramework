/** @type {import('dependency-cruiser').IConfiguration} */
module.exports = {
  forbidden: [
    {
      name: 'no-circular',
      severity: 'warn',
      comment:
        'Module dependencies should not form cycles. Refactor to break the cycle (typically by extracting the shared piece, or inverting one direction with a callback / type-only import).',
      from: {},
      to: { circular: true },
    },
    {
      name: 'no-orphans',
      severity: 'warn',
      comment:
        'Files with no incoming imports are likely dead code. Either delete or wire them into the build.',
      from: {
        orphan: true,
        pathNot: [
          '(^|/)\\.[^/]+\\.(js|cjs|mjs|ts|json)$',
          '\\.d\\.ts$',
          '(^|/)tsconfig\\.json$',
          '(^|/)(babel|webpack|next|tailwind|postcss|vitest|knip|stylelint)\\.config\\.(js|cjs|mjs|ts)$',
          '(^|/)src/app/',
          '\\.stories\\.(ts|tsx)$',
          '\\.test\\.(ts|tsx)$',
        ],
      },
      to: {},
    },
    {
      name: 'not-to-deprecated',
      severity: 'warn',
      comment: 'This module depends on a known-deprecated module.',
      from: {},
      to: { dependencyTypes: ['deprecated'] },
    },
  ],
  options: {
    doNotFollow: { path: 'node_modules' },
    exclude: {
      path: [
        'node_modules',
        '\\.next',
        'dist',
        'storybook-static',
        'src/components/auth',
        'src/components/appwrapper',
        'src/components/dynamic-form',
        'src/lib/next-log',
        'src/lib/zod2gql',
      ],
    },
    tsConfig: { fileName: 'tsconfig.json' },
    enhancedResolveOptions: {
      exportsFields: ['exports'],
      conditionNames: ['import', 'require', 'node', 'default'],
      mainFields: ['module', 'main', 'types', 'typings'],
    },
    reporterOptions: { dot: { collapsePattern: 'node_modules/[^/]+' } },
  },
};

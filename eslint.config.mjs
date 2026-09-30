// SPDX-License-Identifier: AGPL-3.0-or-later
// ESLint 10 flat config.
//
// The preset rules are merged in a fixed order (later presets win), then this
// repo's own rules are applied on top. Build output, the Next app-router
// boilerplate and tooling files are ignored. Type-aware rules use
// `parserOptions.projectService`, so out-of-project files don't crash the run
// the way a hard-coded `project` path would.
import eslintComments from '@eslint-community/eslint-plugin-eslint-comments';
import eslintCommentsConfigs from '@eslint-community/eslint-plugin-eslint-comments/configs';
import { fixupPluginRules } from '@eslint/compat';
import js from '@eslint/js';
import tsPlugin from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import vitest from '@vitest/eslint-plugin';
import nextCoreWebVitals from 'eslint-config-next/core-web-vitals';
import prettierConfig from 'eslint-config-prettier';
import importPluginLegacy from 'eslint-plugin-import';
import jsxA11yLegacy from 'eslint-plugin-jsx-a11y';
import optimizeRegexLegacy from 'eslint-plugin-optimize-regex';
import prettierPlugin from 'eslint-plugin-prettier';
import prettierRecommended from 'eslint-plugin-prettier/recommended';
import promise from 'eslint-plugin-promise';
import reactPluginLegacy from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import security from 'eslint-plugin-security';
import sonarjs from 'eslint-plugin-sonarjs';
import storybook from 'eslint-plugin-storybook';
import unusedImports from 'eslint-plugin-unused-imports';

// These plugins have no ESLint 10 release yet; the official compat shim restores the
// context APIs (getFilename, getScope, ...) their rules still call.
const reactPlugin = fixupPluginRules(reactPluginLegacy);
const jsxA11y = fixupPluginRules(jsxA11yLegacy);
const importPlugin = fixupPluginRules(importPluginLegacy);
const optimizeRegex = fixupPluginRules(optimizeRegexLegacy);

// The files eslint-config-next lints.
const SOURCE_FILES = ['**/*.{js,jsx,mjs,ts,tsx,mts,cts}'];

// eslintrc merged an entry that sets only a severity into an earlier entry with options, keeping
// the options (ESLint still does so across flat config objects); a spread replaces the entry
// whole. Merge rule sets the eslintrc way so preset options survive a severity override.
const mergeRules = (...ruleSets) => {
  const merged = {};
  for (const rules of ruleSets) {
    for (const [id, value] of Object.entries(rules)) {
      const previous = merged[id];
      const severityOnly = !Array.isArray(value) || value.length === 1;
      const severity = Array.isArray(value) ? value[0] : value;
      merged[id] = severityOnly && Array.isArray(previous) ? [severity, ...previous.slice(1)] : value;
    }
  }
  return merged;
};

const rulesOf = (configs) => mergeRules(...configs.map((config) => config.rules ?? {}));

// eslint-config-next registers the react, import and jsx-a11y plugins without the ESLint 10
// shim, so only its rules, settings, globals and its own @next/next plugin are taken from it.
const nextBase = nextCoreWebVitals.find((config) => config.name === 'next');
const importTypescript = importPluginLegacy.configs.typescript;

const presetRules = mergeRules(
  rulesOf(nextCoreWebVitals),
  prettierConfig.rules,
  js.configs.recommended.rules,
  rulesOf(tsPlugin.configs['flat/recommended']),
  eslintCommentsConfigs.recommended.rules,
  importPluginLegacy.configs.errors.rules,
  importTypescript.rules,
  importPluginLegacy.configs.warnings.rules,
  jsxA11yLegacy.configs.recommended.rules,
  optimizeRegexLegacy.configs.recommended.rules,
  prettierRecommended.rules,
  promise.configs.recommended.rules,
  reactHooks.configs.recommended.rules,
  reactPluginLegacy.configs.recommended.rules,
);

export default [
  {
    ignores: [
      '.next/**',
      'node_modules/**',
      'dist/**',
      'dist.next/**',
      'dist.old/**',
      'storybook-static/**',
      'coverage/**',
      'docs/**',
      'public/**',
      'app/**',
      'scripts/**',
      '.storybook/**',
      'next-env.d.ts',
      'next.config.js',
      'postcss.config.js',
      'tailwind.config.js',
      'server-wrapper.js',
      '*.cjs',
      '*.config.js',
      '*.config.cjs',
      '*.config.mjs',
    ],
  },
  {
    files: SOURCE_FILES,
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaFeatures: { jsx: true },
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
      globals: nextBase.languageOptions.globals,
    },
    plugins: {
      '@eslint-community/eslint-comments': eslintComments,
      '@next/next': nextBase.plugins['@next/next'],
      '@typescript-eslint': tsPlugin,
      import: importPlugin,
      'jsx-a11y': jsxA11y,
      'optimize-regex': optimizeRegex,
      prettier: prettierPlugin,
      promise,
      react: reactPlugin,
      'react-hooks': reactHooks,
      security,
      sonarjs,
      'unused-imports': unusedImports,
    },
    settings: {
      ...nextBase.settings,
      ...importTypescript.settings,
      'import/parsers': { ...nextBase.settings['import/parsers'], ...importTypescript.settings['import/parsers'] },
      'import/resolver': { ...nextBase.settings['import/resolver'], ...importTypescript.settings['import/resolver'] },
    },
    rules: mergeRules(presetRules, {
      '@typescript-eslint/no-this-alias': 'warn',
      '@typescript-eslint/prefer-for-of': 'warn',
      'import/no-named-as-default-member': 'warn',
      'import/no-named-as-default': 'warn',
      // A `role` prop on a component (a message's author, a required team role) is not an ARIA role.
      'jsx-a11y/aria-role': ['warn', { ignoreNonDOM: true }],
      'jsx-a11y/no-redundant-roles': 'warn',
      'jsx-a11y/click-events-have-key-events': 'warn',
      'jsx-a11y/heading-has-content': 'warn',
      'react/no-unknown-property': ['warn', { ignore: ['cmdk-input-wrapper'] }],
      '@typescript-eslint/ban-ts-comment': 'warn',
      'prettier/prettier': [
        'warn',
        {
          printWidth: 125,
          tabWidth: 2,
          useTabs: false,
          semi: true,
          singleQuote: true,
          quoteProps: 'as-needed',
          jsxSingleQuote: true,
          trailingComma: 'all',
          bracketSpacing: true,
          jsxBracketSameLine: false,
          arrowParens: 'always',
          singleAttributePerLine: false,
          endOfLine: 'lf',
        },
      ],
      'react-hooks/exhaustive-deps': ['warn', { additionalHooks: 'useRecoilCallback' }],
      'react/no-set-state': 'warn',
      'react/no-string-refs': 'warn',
      // Disabled to align with the canonical workspace configs (auth/, dynamic-form/),
      // which do not enable eslint-plugin-security. `detect-object-injection` flags every
      // computed member access (`obj[key]`) including type-safe, controlled-key access over
      // Record<string, unknown> (deep-merge / path utilities, field-keyed form state) — a
      // documented false-positive source, not part of the §7.5 authoritative ruleset.
      'security/detect-object-injection': 'off',
      'sonarjs/no-duplicated-branches': 'warn',
      'unused-imports/no-unused-vars': 'off',
      '@typescript-eslint/explicit-function-return-type': 'warn',
      '@typescript-eslint/explicit-module-boundary-types': 'warn',
      '@typescript-eslint/no-empty-function': 'warn',
      '@typescript-eslint/no-inferrable-types': 'warn',
      '@typescript-eslint/no-magic-numbers': 'off',
      '@typescript-eslint/no-namespace': 'warn',
      '@typescript-eslint/no-unused-expressions': 'warn',
      '@typescript-eslint/no-var-requires': 'warn',
      eqeqeq: ['warn', 'always'],
      '@eslint-community/eslint-comments/no-unused-disable': 'warn',
      'import/newline-after-import': 'warn',
      'import/no-absolute-path': 'warn',
      'import/no-dynamic-require': 'warn',
      'import/no-extraneous-dependencies': 'warn',
      'import/no-unresolved': 'warn',
      'import/no-useless-path-segments': 'warn',
      'jsx-a11y/accessible-emoji': 'warn',
      'jsx-a11y/alt-text': 'warn',
      'jsx-a11y/anchor-is-valid': 'warn',
      'jsx-a11y/label-has-associated-control': 'warn',
      'no-alert': 'warn',
      'no-console': 'off',
      'no-constant-condition': 'warn',
      'no-debugger': 'warn',
      'no-eq-null': 'warn',
      'no-eval': 'warn',
      'no-implied-eval': 'warn',
      'no-iterator': 'warn',
      'no-lone-blocks': 'warn',
      'no-loop-func': 'warn',
      'no-magic-numbers': 'off',
      'no-multi-str': 'warn',
      'no-new-func': 'warn',
      'no-param-reassign': 'warn',
      'no-return-assign': 'warn',
      'no-script-url': 'warn',
      'no-self-compare': 'warn',
      'no-sequences': 'warn',
      'no-underscore-dangle': 'warn',
      'no-unmodified-loop-condition': 'warn',
      'no-unused-expressions': 'warn',
      'no-unused-vars': 'off',
      'no-useless-concat': 'warn',
      'no-useless-return': 'warn',
      'no-with': 'warn',
      'optimize-regex/optimize-regex': 'warn',
      'promise/always-return': 'warn',
      'promise/catch-or-return': 'warn',
      'promise/no-callback-in-promise': 'warn',
      'promise/no-nesting': 'warn',
      'promise/no-promise-in-callback': 'warn',
      'promise/no-return-in-finally': 'warn',
      'promise/no-return-wrap': 'warn',
      'react-hooks/rules-of-hooks': 'warn',
      'react/react-in-jsx-scope': 'off',
      'react/jsx-boolean-value': 'warn',
      'react/jsx-closing-bracket-location': 'warn',
      'react/jsx-closing-tag-location': 'warn',
      'react/jsx-filename-extension': ['warn', { extensions: ['.jsx', '.tsx'] }],
      'react/jsx-key': 'error',
      'react/jsx-no-bind': 'off',
      'react/jsx-no-comment-textnodes': 'warn',
      'react/jsx-no-duplicate-props': 'warn',
      'react/jsx-no-target-blank': 'warn',
      'react/jsx-no-undef': 'error',
      'react/jsx-no-useless-fragment': 'warn',
      'react/jsx-pascal-case': 'warn',
      'react/jsx-props-no-spreading': 'off',
      'react/jsx-uses-react': 'warn',
      'react/jsx-uses-vars': 'warn',
      'react/no-array-index-key': 'warn',
      'react/no-children-prop': 'warn',
      'react/no-danger-with-children': 'warn',
      'react/no-deprecated': 'warn',
      'react/no-direct-mutation-state': 'warn',
      'react/no-multi-comp': 'off',
      'react/no-unescaped-entities': 'warn',
      'react/no-unstable-nested-components': 'warn',
      'react/no-unused-state': 'warn',
      'react/prefer-stateless-function': 'warn',
      'react/prop-types': 'off',
      'react/self-closing-comp': 'warn',
      'security/detect-buffer-noassert': 'warn',
      'security/detect-child-process': 'warn',
      'security/detect-disable-mustache-escape': 'warn',
      'security/detect-eval-with-expression': 'warn',
      'security/detect-new-buffer': 'warn',
      'security/detect-no-csrf-before-method-override': 'warn',
      'security/detect-non-literal-fs-filename': 'warn',
      'security/detect-non-literal-regexp': 'warn',
      'security/detect-non-literal-require': 'warn',
      'security/detect-possible-timing-attacks': 'warn',
      'security/detect-pseudoRandomBytes': 'warn',
      'security/detect-unsafe-regex': 'warn',
      'sonarjs/cognitive-complexity': 'warn',
      'sonarjs/no-all-duplicated-branches': 'warn',
      'sonarjs/no-duplicate-string': 'warn',
      'sonarjs/no-element-overwrite': 'warn',
      'sonarjs/no-extra-arguments': 'warn',
      'sonarjs/no-identical-conditions': 'warn',
      'sonarjs/no-identical-expressions': 'warn',
      'sonarjs/no-identical-functions': 'warn',
      'sonarjs/no-inverted-boolean-check': 'warn',
      'sonarjs/no-redundant-boolean': 'warn',
      'sonarjs/no-small-switch': 'warn',
      'sonarjs/no-unused-collection': 'warn',
      'sonarjs/no-use-of-empty-return-value': 'warn',
      'sonarjs/no-useless-catch': 'warn',
      'sonarjs/prefer-immediate-return': 'warn',
      'sonarjs/prefer-object-literal': 'warn',
      'sonarjs/prefer-single-boolean-return': 'warn',
      'sonarjs/prefer-while': 'warn',
      yoda: ['warn', 'never'],
      '@typescript-eslint/consistent-type-assertions': 'warn',
      '@typescript-eslint/consistent-type-imports': ['warn', { prefer: 'type-imports' }],
      '@typescript-eslint/consistent-type-exports': ['warn', { fixMixedExportsWithInlineTypeSpecifier: true }],
      '@typescript-eslint/no-import-type-side-effects': 'warn',
      '@typescript-eslint/method-signature-style': ['warn', 'property'],
      '@typescript-eslint/no-useless-empty-export': 'warn',
      '@typescript-eslint/no-empty-interface': 'warn',
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-for-in-array': 'warn',
      '@typescript-eslint/no-non-null-assertion': 'warn',
      '@typescript-eslint/no-non-null-asserted-optional-chain': 'warn',
      '@typescript-eslint/no-confusing-non-null-assertion': 'warn',
      '@typescript-eslint/no-unnecessary-type-assertion': 'warn',
      '@typescript-eslint/no-unnecessary-type-arguments': 'warn',
      '@typescript-eslint/no-unnecessary-boolean-literal-compare': 'warn',
      '@typescript-eslint/no-meaningless-void-operator': 'warn',
      '@typescript-eslint/no-mixed-enums': 'warn',
      '@typescript-eslint/no-duplicate-type-constituents': 'warn',
      '@typescript-eslint/no-redundant-type-constituents': 'warn',
      '@typescript-eslint/no-deprecated': 'warn',
      '@typescript-eslint/no-unsafe-function-type': 'warn',
      '@typescript-eslint/no-unused-vars': 'warn',
      '@typescript-eslint/dot-notation': ['warn', { allowIndexSignaturePropertyAccess: true }],
      'dot-notation': 'off',
      '@typescript-eslint/no-unsafe-assignment': 'warn',
      '@typescript-eslint/no-unsafe-member-access': 'warn',
      '@typescript-eslint/no-unsafe-call': 'warn',
      '@typescript-eslint/no-unsafe-return': 'warn',
      '@typescript-eslint/no-unsafe-argument': 'warn',
      '@typescript-eslint/no-floating-promises': 'warn',
      '@typescript-eslint/no-misused-promises': 'warn',
      '@typescript-eslint/await-thenable': 'warn',
      '@typescript-eslint/require-await': 'warn',
      '@typescript-eslint/unbound-method': 'warn',
      '@typescript-eslint/no-base-to-string': 'warn',
      '@typescript-eslint/restrict-template-expressions': 'warn',
      '@typescript-eslint/restrict-plus-operands': 'warn',
      '@typescript-eslint/no-unnecessary-condition': 'warn',
      '@typescript-eslint/strict-boolean-expressions': [
        'warn',
        {
          allowString: true,
          allowNumber: true,
          allowNullableObject: true,
          allowNullableBoolean: false,
          allowNullableString: false,
          allowNullableNumber: false,
          allowAny: false,
        },
      ],
      '@typescript-eslint/prefer-nullish-coalescing': ['warn', { ignorePrimitives: { string: true } }],
      '@typescript-eslint/prefer-optional-chain': 'warn',
      '@typescript-eslint/switch-exhaustiveness-check': 'warn',
      '@typescript-eslint/no-unsafe-enum-comparison': 'warn',
      '@typescript-eslint/prefer-enum-initializers': 'warn',
      '@typescript-eslint/prefer-reduce-type-parameter': 'warn',
      '@typescript-eslint/prefer-return-this-type': 'warn',
      '@typescript-eslint/prefer-includes': 'warn',
      '@typescript-eslint/prefer-string-starts-ends-with': 'warn',
      '@typescript-eslint/prefer-find': 'warn',
      '@typescript-eslint/prefer-readonly': 'warn',
      '@typescript-eslint/require-array-sort-compare': ['warn', { ignoreStringArrays: true }],
      '@typescript-eslint/promise-function-async': 'warn',
      '@typescript-eslint/return-await': ['warn', 'in-try-catch'],
      'no-shadow': 'off',
      '@typescript-eslint/no-shadow': [
        'warn',
        {
          builtinGlobals: true,
          hoist: 'all',
          allow: [
            'event',
            'name',
            'location',
            'origin',
            'parent',
            'prompt',
            'toolbar',
            'status',
            'length',
            'top',
            'close',
            'open',
            'stop',
            'history',
            'confirm',
            'document',
            // Testing Library's canonical query object, not window.screen.
            'screen',
            // Next.js requires a page or layout's viewport export to be named `viewport`, typed `Viewport`.
            'viewport',
            'Viewport',
            'innerWidth',
            'innerHeight',
            'source',
            'selection',
            'match',
          ],
        },
      ],
      'no-use-before-define': 'off',
      '@typescript-eslint/no-use-before-define': ['warn', { functions: false, classes: false }],
      'no-new-native-nonconstructor': 'warn',
      'no-duplicate-imports': 'warn',
      'no-self-assign': 'warn',
      '@typescript-eslint/naming-convention': [
        'warn',
        { selector: 'default', format: ['camelCase'], leadingUnderscore: 'allow', trailingUnderscore: 'allow' },
        {
          selector: 'variable',
          format: ['camelCase', 'UPPER_CASE', 'PascalCase'],
          leadingUnderscore: 'allow',
          trailingUnderscore: 'allow',
        },
        { selector: 'parameter', format: ['camelCase', 'PascalCase'], leadingUnderscore: 'allow' },
        { selector: 'function', format: ['camelCase', 'PascalCase'] },
        { selector: 'method', format: ['camelCase', 'PascalCase'], leadingUnderscore: 'allow' },
        { selector: 'typeMethod', format: ['camelCase', 'PascalCase'], leadingUnderscore: 'allow' },
        { selector: 'classicAccessor', format: ['camelCase', 'UPPER_CASE'] },
        { selector: 'memberLike', modifiers: ['private'], format: ['camelCase'], leadingUnderscore: 'allow' },
        {
          selector: 'classProperty',
          modifiers: ['static'],
          format: ['UPPER_CASE', 'camelCase', 'PascalCase'],
          leadingUnderscore: 'allow',
        },
        { selector: 'typeLike', format: ['PascalCase'] },
        { selector: 'enumMember', format: ['UPPER_CASE', 'PascalCase'] },
        { selector: 'objectLiteralProperty', format: null },
        { selector: 'typeProperty', format: null },
        { selector: 'import', format: ['camelCase', 'PascalCase'] },
      ],
      'no-restricted-syntax': [
        'warn',
        {
          selector: "TSAsExpression > TSTypeReference[typeName.name='Record'] > TSTypeParameterInstantiation > TSAnyKeyword",
          message:
            'Avoid `as Record<string, any>`. Type the value precisely; use `Record<string, unknown>` only at framework boundaries.',
        },
        {
          selector: 'TSAsExpression > TSUnknownKeyword',
          message: 'Avoid `as unknown` to bypass type errors. Validate at the boundary and propagate the narrow type.',
        },
        {
          selector: "TSAsExpression[typeAnnotation.type='TSAnyKeyword']",
          message: 'Avoid `as any`. Fix the type at its source.',
        },
        {
          // Catch-clause variables are genuinely exempt (the bare selector was
          // flagging `catch (e: unknown)`, which contradicts the message).
          selector: 'TSTypeAnnotation > TSUnknownKeyword:not(CatchClause TSUnknownKeyword)',
          message:
            '`unknown` outside `catch` is a smell. Validate at the boundary entry (Zod / type guard) and propagate the narrow type. Catch-clause variables are exempt.',
        },
      ],
      'no-template-curly-in-string': 'warn',
      'no-unreachable-loop': 'warn',
      'no-await-in-loop': 'warn',
      'no-promise-executor-return': 'warn',
      'require-atomic-updates': 'warn',
      'array-callback-return': 'warn',
      'no-constructor-return': 'warn',
      'default-case-last': 'warn',
      'grouped-accessor-pairs': 'warn',
      'no-loss-of-precision': 'warn',
      'no-constant-binary-expression': 'warn',
      'no-lonely-if': 'warn',
      'no-unneeded-ternary': 'warn',
      'prefer-arrow-callback': ['warn', { allowNamedFunctions: true }],
      'prefer-rest-params': 'warn',
      'prefer-const': 'warn',
      'no-var': 'warn',
      complexity: ['warn', 25],
      'max-depth': ['warn', 5],
      curly: ['warn', 'all'],
      'prefer-template': 'warn',
      'no-throw-literal': 'warn',
      // `allowUnsafeDynamicCyclicDependency` lets a deliberate `import()`-based
      // cycle break stand (e.g. MarkdownBlock <-> CodeBlock recursive rendering).
      'import/no-cycle': ['warn', { maxDepth: 4, ignoreExternal: true, allowUnsafeDynamicCyclicDependency: true }],
      'import/no-self-import': 'warn',
      // `next` and `react-syntax-highlighter` ship no exports map, so Node's ESM loader (the
      // compiled dist/) needs their subpaths by file name (`next/navigation.js`); everything
      // else stays extensionless.
      // `checkTypeImports` (its default) is spelled out because the plugin only reads
      // `pathGroupOverrides` from an options object that names a non-legacy key.
      'import/extensions': [
        'warn',
        'never',
        {
          checkTypeImports: false,
          pathGroupOverrides: [
            { pattern: 'next/**', action: 'ignore' },
            { pattern: 'react-syntax-highlighter/**', action: 'ignore' },
          ],
        },
      ],
      'import/first': 'warn',
      'import/no-duplicates': 'warn',
      'import/order': 'warn',
      'jsx-a11y/media-has-caption': 'warn',
      'jsx-a11y/mouse-events-have-key-events': 'warn',
      'jsx-a11y/no-static-element-interactions': 'warn',
      'react/no-danger': 'warn',
      'unused-imports/no-unused-imports': 'warn',
      // CSS / style imports and matcher registration (jest-dom) are side-effect-only by design.
      'import/no-unassigned-import': [
        'warn',
        { allow: ['**/*.css', '**/*.scss', '**/*.sass', '**/*.less', '@testing-library/jest-dom/vitest'] },
      ],
      'jsx-a11y/no-autofocus': 'warn',
      'react/no-access-state-in-setstate': 'warn',
    }),
  },
  ...storybook.configs['flat/recommended'],
  {
    files: ['**/*.tsx'],
    rules: {
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      // `promise-function-async`'s autofix rewrites functions to `async`,
      // which breaks React render/children/component functions — they must
      // return elements synchronously (an async one returns a Promise and
      // renders nothing). Keep it off for component files.
      '@typescript-eslint/promise-function-async': 'off',
    },
  },
  {
    // Extension entry points register synchronous render factories
    // (`component: () => X({})`, `mfaSetup`/`mfaVerify`); the same
    // `promise-function-async` autofix would break them the same way.
    files: ['src/lib/zephyrex/extensions/**/*.ts'],
    rules: {
      '@typescript-eslint/promise-function-async': 'off',
    },
  },
  {
    // Application code logs through src/lib/log.ts, the one place that writes to the console.
    // Tests may stub console methods to silence expected errors.
    files: ['src/**/*.ts', 'src/**/*.tsx'],
    ignores: ['src/lib/log.ts', '**/*.test.ts', '**/*.test.tsx'],
    rules: {
      'no-console': 'error',
    },
  },
  {
    // Application code names its numbers; tests and stories use literal fixtures.
    files: ['src/**/*.ts', 'src/**/*.tsx'],
    ignores: ['**/*.test.ts', '**/*.test.tsx', '**/*.stories.tsx', 'src/__tests__/**'],
    rules: {
      '@typescript-eslint/no-magic-numbers': [
        'error',
        {
          ignore: [-1, 0, 1, 2],
          ignoreArrayIndexes: true,
          ignoreDefaultValues: true,
          ignoreEnums: true,
          ignoreNumericLiteralTypes: true,
          ignoreReadonlyClassProperties: true,
          ignoreTypeIndexes: true,
        },
      ],
    },
  },
  {
    files: [
      '**/*.test.ts',
      '**/*.test.tsx',
      'src/__tests__/**/*.ts',
      'src/__tests__/**/*.tsx',
      'tests/**/*.ts',
      'tests/**/*.tsx',
    ],
    plugins: { '@vitest': vitest },
    rules: {
      ...vitest.configs['legacy-recommended'].rules,
      '@vitest/no-focused-tests': 'error',
      '@vitest/no-disabled-tests': 'error',
      '@vitest/no-identical-title': 'error',
      '@vitest/consistent-test-it': ['error', { fn: 'it', withinDescribe: 'it' }],
      // Vitest's `expect(value, message)` takes an optional 2nd assertion
      // message (used across the security suite for actionable failures).
      '@vitest/valid-expect': ['error', { maxArgs: 2 }],
      // Parametrized security suites use dynamic `describe(routePath, ...)`
      // titles; don't require a string literal for the describe name.
      '@vitest/valid-title': ['error', { ignoreTypeOfDescribeName: true }],
      '@vitest/no-conditional-tests': 'warn',
      '@vitest/no-conditional-in-test': 'warn',
      '@vitest/no-conditional-expect': 'error',
    },
  },
];

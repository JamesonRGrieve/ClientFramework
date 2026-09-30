// SPDX-License-Identifier: AGPL-3.0-or-later
// The /docs routes, mounted by an app with one-line re-exports:
//   app/docs/layout.tsx              export { DocsLayout as default } from 'zephyrex/pages/docs';
//   app/docs/api-reference/page.tsx  export { ApiReferencePage as default } from 'zephyrex/pages/docs';
//   app/docs/privacy/page.tsx        renders <PrivacyPage content={...} /> with the app's own policy text
export { ApiReferencePage } from './ApiReferencePage';
export { DocsLayout } from './DocsLayout';
export { PrivacyPage } from './PrivacyPage';

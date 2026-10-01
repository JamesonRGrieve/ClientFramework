// SPDX-License-Identifier: AGPL-3.0-or-later
// react-syntax-highlighter has no exports map, so under Node's ESM resolver the hljs styles
// must be imported by file (`…/hljs/index.js`); @types only declares the directory path.
declare module 'react-syntax-highlighter/dist/esm/styles/hljs/index.js' {
  export * from 'react-syntax-highlighter/dist/esm/styles/hljs';
}

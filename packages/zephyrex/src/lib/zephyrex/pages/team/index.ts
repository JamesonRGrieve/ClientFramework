// SPDX-License-Identifier: AGPL-3.0-or-later
// The /team routes, mounted by an app with one-line re-exports:
//   app/team/page.tsx       export { TeamPage as default } from 'zephyrex/pages/team';
//   app/team/[id]/page.tsx  export { TeamPage as default } from 'zephyrex/pages/team';
export { TeamPage, type TeamPageProps } from './TeamPage';

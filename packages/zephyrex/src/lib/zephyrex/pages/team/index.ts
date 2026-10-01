// SPDX-License-Identifier: AGPL-3.0-or-later
// The /team routes, mounted by an app with one-line re-exports:
//   app/team/page.tsx       export { TeamPage as default } from 'zephyrex/pages/team';
//   app/team/[id]/page.tsx  export { TeamPage as default } from 'zephyrex/pages/team';
export { TeamPage, type TeamPageProps } from './TeamPage';
// The page's parts, for an app composing its own team page.
export { Team, type TeamProps } from './Team';
export { TeamMembers, type TeamMembersProps } from './TeamMembers';
export { useTeamAccess, useTeamActions, useTeamMembers, useRoles } from './useTeamManagement';
export type { TeamAccess, TeamActions } from './useTeamManagement';
// The team model, for extensions' team sections.
export { roleLabel, type Role } from './teamModel';

// SPDX-License-Identifier: AGPL-3.0-or-later
// The /user routes, mounted by an app with one-line re-exports:
//   app/user/layout.tsx            export { UserLayout as default } from 'zephyrex/pages/user';
//   app/user/[[...slug]]/page.tsx  export { UserPage as default } from 'zephyrex/pages/user';
export { UserLayout } from './UserLayout';
export { UserPage, type UserPageProps } from './UserPage';
// The account page and its parts, for an app composing its own.
export { Account } from './account/Account';
export { Manage, type ManageProps } from './account/Manage';
export { Profile } from './account/Profile';
export { useProfile, type ProfileState } from './account/useProfile';

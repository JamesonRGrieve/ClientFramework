// SPDX-License-Identifier: AGPL-3.0-or-later
// The /settings route, mounted by an app with a one-line re-export:
//   app/settings/page.tsx  export { ThemeSettingsPage as default } from 'zephyrex/pages/settings';
// or wrapped, passing the app's own settings as children below the theme.
export { ThemeSettings, ThemeSettingsPage, type ThemeSettingsPageProps, type ThemeSettingsProps } from './ThemeSettingsPage';

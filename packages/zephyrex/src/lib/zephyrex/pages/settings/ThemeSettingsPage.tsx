// SPDX-License-Identifier: AGPL-3.0-or-later
import { cookies } from 'next/headers.js';
import { type ReactNode, useId } from 'react';
import { SidebarPage } from '../../../../components/appwrapper/src/SidebarPage';
import { ThemePicker } from '../../../../components/theme/ThemePicker';
import { PageHeader } from '../../../../components/ui/page-header';

/** The cookie the framework keeps the chosen theme in (useTheme's `cookieName`). */
const THEME_COOKIE = 'theme';

export interface ThemeSettingsProps {
  /** The theme in force, as the server read it from the theme cookie, so the choice renders checked. */
  theme?: string | undefined;
  /** An app's own themes beside the framework's four. */
  customThemes?: string[];
  /** The app's other settings, below the theme. */
  children?: ReactNode;
}

/** The settings page's body: its heading, the theme picker under a "Theme" heading, then the app's own settings. */
export function ThemeSettings({ theme, customThemes, children }: ThemeSettingsProps): ReactNode {
  const heading = useId();
  return (
    <div className='grid min-w-0 gap-8'>
      <PageHeader title='Appearance' description='How the app looks on this device.' />
      <section aria-labelledby={heading} className='grid gap-3'>
        <h2 id={heading} className='text-lg font-semibold'>
          Theme
        </h2>
        <ThemePicker initialTheme={theme} customThemes={customThemes} label='Theme' />
      </section>
      {children}
    </div>
  );
}

export interface ThemeSettingsPageProps extends Omit<ThemeSettingsProps, 'theme'> {
  /** The theme for someone who has chosen none (the app's `defaultTheme`); the device's setting otherwise. */
  defaultTheme?: string;
}

/**
 * The framework's settings page, mounted by an app with a one-line re-export
 * (`export { ThemeSettingsPage as default } from 'zephyrex/pages/settings'`) or wrapped to add its
 * own settings as children. It reads the theme cookie on the server, so the picker's first render
 * already marks the person's choice (Zephyrex RPG's finding: read in script it renders "light").
 */
export async function ThemeSettingsPage({ defaultTheme, ...rest }: ThemeSettingsPageProps): Promise<ReactNode> {
  const theme = (await cookies()).get(THEME_COOKIE)?.value ?? defaultTheme;
  return (
    <SidebarPage title='Settings'>
      <ThemeSettings theme={theme} {...rest} />
    </SidebarPage>
  );
}

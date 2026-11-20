// SPDX-License-Identifier: AGPL-3.0-or-later
import type { Meta, StoryObj } from '@storybook/nextjs';
import { NoScriptNav } from './NoScriptNav';

/**
 * The phone menu for a browser with scripts off. Storybook runs scripts, so the `<noscript>` here
 * shows nothing, as it shows nothing to any visitor whose scripts run; its markup is checked in
 * `NoScriptNav.test.tsx` by rendering it to a string, as the server does.
 */
const meta: Meta<typeof NoScriptNav> = {
  title: 'AppWrapper/NoScriptNav',
  component: NoScriptNav,
};
export default meta;

type Story = StoryObj<typeof NoScriptNav>;

/** With scripts on, nothing: the sidebar's own button and panel serve instead. */
export const ScriptsOn: Story = {};

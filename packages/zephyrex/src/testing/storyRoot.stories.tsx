// SPDX-License-Identifier: AGPL-3.0-or-later
import type { Meta, StoryObj } from '@storybook/nextjs';
import type { ReactElement } from 'react';
import { useZephyrexConfig } from '../lib/zephyrex/ZephyrexProvider';
import { ZephyrexStoryRoot } from './storyRoot';

/** What a story wrapped in the root sees: the story config's app name and API base URL. */
function StoryConfig(): ReactElement {
  const { config } = useZephyrexConfig();
  return <p>{`${config.app.name} at ${config.server.baseUrl}`}</p>;
}

const meta: Meta<typeof ZephyrexStoryRoot> = {
  title: 'Testing/ZephyrexStoryRoot',
  component: ZephyrexStoryRoot,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof ZephyrexStoryRoot>;

export const Default: Story = {
  args: { children: <StoryConfig /> },
};

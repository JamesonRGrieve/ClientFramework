// SPDX-License-Identifier: AGPL-3.0-or-later
import type { Meta, StoryObj } from '@storybook/nextjs';
import TabPanel from './TabPanel';

const meta: Meta<typeof TabPanel> = {
  title: 'Markdown/TabPanel',
  component: TabPanel,
  tags: ['autodocs'],
};

export default meta;

export const Default: StoryObj<typeof TabPanel> = {
  render: () => (
    <>
      <button type='button' role='tab' id='story-tab' aria-selected aria-controls='story-panel'>
        Rendered
      </button>
      <TabPanel value={0} index={0} id='story-panel' labelledBy='story-tab'>
        The selected tab&apos;s content.
      </TabPanel>
    </>
  ),
};

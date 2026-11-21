// SPDX-License-Identifier: AGPL-3.0-or-later
import type { Meta, StoryObj } from '@storybook/nextjs';
import { RetryRing } from './retry-ring';

const meta: Meta<typeof RetryRing> = {
  title: 'ui/RetryRing',
  component: RetryRing,
  args: { secondsLeft: 7, totalSeconds: 10, retrying: false, className: 'size-8 text-primary' },
};
export default meta;

type Story = StoryObj<typeof RetryRing>;

/** Seven seconds of ten left. */
export const Counting: Story = {};

/** Just starting the count. */
export const Full: Story = { args: { secondsLeft: 10 } };

/** A try under way. */
export const Retrying: Story = { args: { retrying: true } };

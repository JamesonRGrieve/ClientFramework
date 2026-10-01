// SPDX-License-Identifier: AGPL-3.0-or-later
import type { Meta, StoryObj } from '@storybook/nextjs';
import { RateLimitBanner } from './RateLimitBanner';

const meta: Meta<typeof RateLimitBanner> = {
  title: 'Zephyrex/RateLimitBanner',
  component: RateLimitBanner,
  parameters: { layout: 'fullscreen' },
};
export default meta;

type Story = StoryObj<typeof RateLimitBanner>;

export const FewSeconds: Story = { args: { remainingMs: 3000 } };

export const LongWait: Story = { args: { remainingMs: 45_000 } };

// SPDX-License-Identifier: AGPL-3.0-or-later
import type { Meta, StoryObj } from '@storybook/nextjs';
import { withZephyrexApi } from 'zephyrex/testing';
import { credentialHandlers } from './credentials.mocks';
import { Passkeys } from './Passkeys';

const meta: Meta<typeof Passkeys> = {
  title: 'webauthn-consumer/Passkeys',
  component: Passkeys,
  parameters: { nextjs: { appDirectory: true }, layout: 'centered', msw: { handlers: credentialHandlers() } },
  decorators: [withZephyrexApi],
};
export default meta;

type Story = StoryObj<typeof Passkeys>;

export const ThreeCredentials: Story = {};

export const NoneYet: Story = { parameters: { msw: { handlers: credentialHandlers({ credentials: [] }) } } };

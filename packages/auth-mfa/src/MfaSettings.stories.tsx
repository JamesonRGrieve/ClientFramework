// SPDX-License-Identifier: AGPL-3.0-or-later
import type { Meta, StoryObj } from '@storybook/nextjs';
import { http, HttpResponse } from 'msw';
import { withZephyrexApi } from 'zephyrex/testing';
import { MFA_ENDPOINT, type MfaMethod } from './mfaApi';
import { MfaSettings } from './MfaSettings';

const totp = (overrides: Partial<MfaMethod>): MfaMethod => ({
  id: 'm1',
  method_type: 'totp',
  is_enabled: true,
  is_primary: true,
  verification: true,
  ...overrides,
});

const withMethods = (methods: MfaMethod[]) => ({
  msw: {
    handlers: [
      http.get(`*${MFA_ENDPOINT}`, () =>
        HttpResponse.json({ multifactor_methods: methods, pagination: { has_more: false } }),
      ),
    ],
  },
});

const meta: Meta<typeof MfaSettings> = {
  title: 'auth-mfa/MfaSettings',
  component: MfaSettings,
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
  decorators: [withZephyrexApi],
};
export default meta;

type Story = StoryObj<typeof MfaSettings>;

export const NotSetUp: Story = { parameters: withMethods([]) };

export const Enrolled: Story = { parameters: withMethods([totp({})]) };

export const SetupNotFinished: Story = { parameters: withMethods([totp({ verification: false, is_primary: false })]) };

export const TurnedOff: Story = { parameters: withMethods([totp({ is_enabled: false })]) };

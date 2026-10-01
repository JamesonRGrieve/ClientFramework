// SPDX-License-Identifier: AGPL-3.0-or-later
import type { Meta, StoryObj } from '@storybook/nextjs';
import { http, HttpResponse } from 'msw';
import { withZephyrexApi } from 'zephyrex/testing';
import { API_KEYS_ENDPOINT, type ApiKey, ApiKeys } from './ApiKeys';

const listing = (keys: ApiKey[]) => ({
  msw: {
    handlers: [
      http.get(`*${API_KEYS_ENDPOINT}`, () => HttpResponse.json({ api_keys: keys, pagination: { has_more: false } })),
    ],
  },
});

const meta: Meta<typeof ApiKeys> = {
  title: 'auth-api-keys/ApiKeys',
  component: ApiKeys,
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
  decorators: [withZephyrexApi],
};
export default meta;

type Story = StoryObj<typeof ApiKeys>;

export const None: Story = { parameters: listing([]) };

export const TwoKeys: Story = {
  parameters: listing([
    { id: 'k1', name: 'CI', created_at: '2026-09-01T00:00:00Z', last_used_at: '2026-09-29T10:00:00Z', expires_at: null },
    { id: 'k2', name: 'Deploy', created_at: '2026-09-10T00:00:00Z', expires_at: '2026-12-31T23:59:59Z' },
  ]),
};

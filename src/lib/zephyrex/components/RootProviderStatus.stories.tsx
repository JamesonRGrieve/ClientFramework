// SPDX-License-Identifier: AGPL-3.0-or-later
import type { Meta, StoryObj } from '@storybook/nextjs';
import { http, HttpResponse } from 'msw';
import { ROOT_PROVIDER_STATUS_PATH, type RootProviderStatusResponse } from '../useRootProviderStatus';
import { withZephyrexApi } from '../../../../.storybook/withZephyrexApi';
import { RootProviderStatus } from './RootProviderStatus';

const HTTP_FORBIDDEN = 403;

const status: RootProviderStatusResponse = {
  providers: [
    {
      provider: 'openai',
      extension: 'ai_agents',
      configured: true,
      settings: [
        { key: 'OPENAI_API_KEY', secret: true, set: true, value: null },
        { key: 'OPENAI_BASE_URL', secret: false, set: true, value: 'https://api.openai.com' },
      ],
      health: null,
    },
    {
      provider: 'smtp',
      extension: 'email',
      configured: false,
      settings: [
        { key: 'SMTP_HOST', secret: false, set: false, value: null },
        { key: 'SMTP_PASSWORD', secret: true, set: false, value: null },
      ],
      health: null,
    },
  ],
};

const vaultStatus: RootProviderStatusResponse = {
  providers: [
    {
      provider: 'openbao',
      extension: 'secret_vault',
      configured: true,
      settings: [
        { key: 'OPENBAO_ADDR', secret: false, set: true, value: 'https://vault.example.com' },
        { key: 'OPENBAO_MOUNT_POINT', secret: false, set: true, value: 'secret' },
        { key: 'OPENBAO_NAMESPACE', secret: false, set: false, value: null },
        { key: 'OPENBAO_TOKEN', secret: true, set: true, value: null },
      ],
      health: { status: 'ok', detail: '' },
    },
    {
      provider: 'aws_secrets_manager',
      extension: 'secret_vault',
      configured: false,
      settings: [{ key: 'AWS_REGION', secret: false, set: false, value: null }],
      health: { status: 'down', detail: 'missing required env vars' },
    },
  ],
};

const statusRoute = `*${ROOT_PROVIDER_STATUS_PATH}`;

const meta: Meta<typeof RootProviderStatus> = {
  title: 'zephyrex/RootProviderStatus',
  component: RootProviderStatus,
  tags: ['autodocs'],
  decorators: [withZephyrexApi],
};

export default meta;

type Story = StoryObj<typeof RootProviderStatus>;

export const Configured: Story = {
  parameters: { msw: { handlers: [http.get(statusRoute, () => HttpResponse.json(status))] } },
};

export const NotRoot: Story = {
  parameters: {
    msw: { handlers: [http.get(statusRoute, () => HttpResponse.json({ detail: 'Root only' }, { status: HTTP_FORBIDDEN }))] },
  },
};

export const SecretVaultHealth: Story = {
  args: { extension: 'secret_vault', health: true },
  parameters: { msw: { handlers: [http.get(statusRoute, () => HttpResponse.json(vaultStatus))] } },
};

export const NoProviders: Story = {
  parameters: { msw: { handlers: [http.get(statusRoute, () => HttpResponse.json({ providers: [] }))] } },
};

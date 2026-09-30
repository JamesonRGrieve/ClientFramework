// SPDX-License-Identifier: AGPL-3.0-or-later
import type { Meta, StoryObj } from '@storybook/nextjs';
import { http, HttpResponse } from 'msw';
import { SWRConfig } from 'swr';
import { ROOT_PROVIDER_STATUS_PATH, type RootProviderStatusResponse } from '../useRootProviderStatus';
import { ZephyrexProvider } from '../ZephyrexProvider';
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
    },
    {
      provider: 'smtp',
      extension: 'email',
      configured: false,
      settings: [
        { key: 'SMTP_HOST', secret: false, set: false, value: null },
        { key: 'SMTP_PASSWORD', secret: true, set: false, value: null },
      ],
    },
  ],
};

const statusRoute = `*${ROOT_PROVIDER_STATUS_PATH}`;

const meta: Meta<typeof RootProviderStatus> = {
  title: 'zephyrex/RootProviderStatus',
  component: RootProviderStatus,
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <SWRConfig value={{ provider: () => new Map() }}>
        <ZephyrexProvider config={{ server: { baseUrl: 'http://localhost:1996' }, app: { name: 'Storybook' } }}>
          <Story />
        </ZephyrexProvider>
      </SWRConfig>
    ),
  ],
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

export const NoProviders: Story = {
  parameters: { msw: { handlers: [http.get(statusRoute, () => HttpResponse.json({ providers: [] }))] } },
};

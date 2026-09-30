// SPDX-License-Identifier: AGPL-3.0-or-later
import type { Meta, StoryObj } from '@storybook/nextjs';
import { http, HttpResponse } from 'msw';
import { OBSERVABILITY_STATUS_PATH, type ObservabilityStatusResponse as Status } from '../useObservabilityStatus';
import { withZephyrexApi } from '../../../../.storybook/withZephyrexApi';
import { ObservabilityStatus } from './ObservabilityStatus';

const HTTP_FORBIDDEN = 403;

const statusRoute = `*${OBSERVABILITY_STATUS_PATH}`;
const serving = (body: Status) => ({ msw: { handlers: [http.get(statusRoute, () => HttpResponse.json(body))] } });

const meta: Meta<typeof ObservabilityStatus> = {
  title: 'zephyrex/ObservabilityStatus',
  component: ObservabilityStatus,
  tags: ['autodocs'],
  decorators: [withZephyrexApi],
};

export default meta;

type Story = StoryObj<typeof ObservabilityStatus>;

export const PrometheusAndSentry: Story = {
  parameters: serving({
    metrics: { backend: 'prometheus', active: true, endpoint: '/metrics' },
    error_reporter: { backend: 'sentry', active: true, dsn_set: true },
  }),
};

export const ReporterWithoutDsn: Story = {
  parameters: serving({
    metrics: { backend: 'otel', active: true, endpoint: null },
    error_reporter: { backend: 'rollbar', active: true, dsn_set: false },
  }),
};

export const NothingWired: Story = {
  parameters: serving({
    metrics: { backend: null, active: false, endpoint: null },
    error_reporter: { backend: null, active: false, dsn_set: false },
  }),
};

export const NotRoot: Story = {
  parameters: {
    msw: { handlers: [http.get(statusRoute, () => HttpResponse.json({ detail: 'Root only' }, { status: HTTP_FORBIDDEN }))] },
  },
};

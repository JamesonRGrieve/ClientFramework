// SPDX-License-Identifier: AGPL-3.0-or-later
import { render } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { TestWrapper } from 'zephyrex/testing';
import { ObservabilityStatus } from './ObservabilityStatus';
import { OBSERVABILITY_STATUS_PATH, type ObservabilityStatusResponse as Status } from './useObservabilityStatus';

const HTTP_OK = 200;
const HTTP_FORBIDDEN = 403;

const serve = (status: number, body: Status | { detail: string }): void => {
  vi.stubGlobal(
    'fetch',
    vi.fn(async (url: string) =>
      Promise.resolve(
        url.endsWith(OBSERVABILITY_STATUS_PATH)
          ? new Response(JSON.stringify(body), { status })
          : new Response('{}', { status: HTTP_OK }),
      ),
    ),
  );
};

const renderStatus = (): ReturnType<typeof render> =>
  render(
    <TestWrapper>
      <ObservabilityStatus />
    </TestWrapper>,
  );

describe('ObservabilityStatus', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('names the wired backends, with the Prometheus scrape path', async () => {
    serve(HTTP_OK, {
      metrics: { backend: 'prometheus', active: true, endpoint: '/metrics' },
      error_reporter: { backend: 'sentry', active: true, dsn_set: true },
    });
    const view = renderStatus();
    expect(await view.findByText('Prometheus')).toBeInTheDocument();
    expect(view.getByText('/metrics')).toBeInTheDocument();
    expect(view.getByText('Sentry')).toBeInTheDocument();
    expect(view.getByText('Errors are reported to the configured DSN.')).toBeInTheDocument();
  });

  it('says when a backend exports without a scrape path, and when a reporter has no DSN', async () => {
    serve(HTTP_OK, {
      metrics: { backend: 'otel', active: true, endpoint: null },
      error_reporter: { backend: 'rollbar', active: true, dsn_set: false },
    });
    const view = renderStatus();
    expect(await view.findByText('OpenTelemetry')).toBeInTheDocument();
    expect(view.getByText('Metrics are exported to the configured collector.')).toBeInTheDocument();
    expect(view.getByText('No DSN is set, so errors are not being sent anywhere.')).toBeInTheDocument();
  });

  it('says when nothing is wired', async () => {
    serve(HTTP_OK, {
      metrics: { backend: null, active: false, endpoint: null },
      error_reporter: { backend: null, active: false, dsn_set: false },
    });
    const view = renderStatus();
    expect(await view.findByText('No metrics backend is configured.')).toBeInTheDocument();
    expect(view.getByText('No error reporter is configured.')).toBeInTheDocument();
    expect(view.getAllByText('Off')).toHaveLength(2);
  });

  it('explains that the view is root only when the server refuses', async () => {
    serve(HTTP_FORBIDDEN, { detail: 'Root only' });
    const view = renderStatus();
    expect(await view.findByText('Only the root user can view observability status.')).toBeInTheDocument();
  });
});

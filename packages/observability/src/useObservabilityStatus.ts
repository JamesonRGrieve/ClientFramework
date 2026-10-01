// SPDX-License-Identifier: AGPL-3.0-or-later
'use client';

import useSWR, { type SWRResponse } from 'swr';
import { z } from 'zod';
import { useClient } from 'zephyrex';

export const OBSERVABILITY_STATUS_PATH = '/v1/observability/status';

/** Where the server exports metrics; `endpoint` is the scrape path, which only Prometheus has. */
const MetricsStatusSchema = z.object({
  backend: z.enum(['prometheus', 'otel']).nullable(),
  active: z.boolean(),
  endpoint: z.string().nullable(),
});
export type MetricsStatus = z.infer<typeof MetricsStatusSchema>;

/** Where the server reports errors; `dsn_set` says whether the reporter has somewhere to send them. */
const ErrorReporterStatusSchema = z.object({
  backend: z.enum(['sentry', 'rollbar']).nullable(),
  active: z.boolean(),
  dsn_set: z.boolean(),
});
export type ErrorReporterStatus = z.infer<typeof ErrorReporterStatusSchema>;

const ObservabilityStatusResponseSchema = z.object({
  metrics: MetricsStatusSchema,
  error_reporter: ErrorReporterStatusSchema,
});
export type ObservabilityStatusResponse = z.infer<typeof ObservabilityStatusResponseSchema>;

/** Which metrics backend and error reporter the server has wired. Root only: anyone else gets a 403. */
export function useObservabilityStatus(): SWRResponse<ObservabilityStatusResponse, Error> {
  const client = useClient();
  return useSWR<ObservabilityStatusResponse, Error>(client.url(OBSERVABILITY_STATUS_PATH), async () =>
    ObservabilityStatusResponseSchema.parse(await client.get(OBSERVABILITY_STATUS_PATH)),
  );
}

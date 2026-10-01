// SPDX-License-Identifier: AGPL-3.0-or-later
// The client half of the server's observability extension (zephyrex[observability]): the root-only
// view of which metrics backend and error reporter the server has wired.
export { ObservabilityStatus } from './ObservabilityStatus';
export { OBSERVABILITY_STATUS_PATH, useObservabilityStatus } from './useObservabilityStatus';
export type { ErrorReporterStatus, MetricsStatus, ObservabilityStatusResponse } from './useObservabilityStatus';

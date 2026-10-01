// SPDX-License-Identifier: AGPL-3.0-or-later
import type { SWRConfiguration } from 'swr';
import { useApi } from './useApi';
import { fetchHealth, fetchLiveness, fetchReadiness } from '@/lib/api/health';
import type { HealthResponse, ReadinessResponse } from '@/lib/api/types';

const HEALTH_REFRESH_MS = 10_000;
const READINESS_REFRESH_MS = 15_000;

const healthConfig: SWRConfiguration<HealthResponse> = {
  refreshInterval: HEALTH_REFRESH_MS,
  revalidateOnFocus: false,
};

const readinessConfig: SWRConfiguration<ReadinessResponse> = {
  refreshInterval: READINESS_REFRESH_MS,
  revalidateOnFocus: false,
};

export const useHealth = () => useApi<HealthResponse>('health', fetchHealth, healthConfig);
export const useLiveness = () => useApi<HealthResponse>('healthz', fetchLiveness, healthConfig);
export const useReadiness = () => useApi<ReadinessResponse>('readyz', fetchReadiness, readinessConfig);

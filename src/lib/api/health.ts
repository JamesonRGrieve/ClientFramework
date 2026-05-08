import type { ApiClient } from './client';
import type { ApiResponse, HealthResponse, ReadinessResponse } from './types';

/**
 * Maps the three liveness/readiness probes shipped in the base install:
 *   - GET /health   (app.py)            simple {status:"UP"}
 *   - GET /healthz  (Operations.py)     liveness, 503 on shutdown
 *   - GET /readyz   (Operations.py)     readiness w/ critical-provider hysteresis
 */
export const fetchHealth = (client: ApiClient): Promise<ApiResponse<HealthResponse>> => client.get('/health');

export const fetchLiveness = (client: ApiClient): Promise<ApiResponse<HealthResponse>> => client.get('/healthz');

export const fetchReadiness = (client: ApiClient): Promise<ApiResponse<ReadinessResponse>> => client.get('/readyz');

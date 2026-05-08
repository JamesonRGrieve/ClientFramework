/**
 * Mirrors the BASE INSTALL contract of ServerFramework (REST). See:
 *   - lib/Pydantic2FastAPI.RouterMixin (RouteType, AuthType)
 *   - logic/AbstractLogicManager.ModelMeta (Create/Update/ResponseSingle/ResponsePlural/Search)
 *   - logic/AbstractLogicManager (NumericalSearchModel/StringSearchModel/DateSearchModel/BooleanSearchModel)
 *   - endpoints/Operations (DLQ + services schema)
 *   - endpoints/EP_Outbox (tracking-id polling schema)
 */

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

export interface ApiEnvelopeError {
  detail: string | Record<string, unknown>;
  code?: string;
}

export interface DeprecationInfo {
  resource: string;
  deprecation?: string;
  sunset?: string;
}

export interface RateLimitInfo {
  limit?: number;
  remaining?: number;
  reset?: number;
  retryAfter?: number;
}

export interface ApiResponse<T> {
  readonly data: T;
  readonly status: number;
  readonly headers: Headers;
  readonly correlationId?: string;
  readonly deprecation?: DeprecationInfo;
}

export interface PageRequest {
  readonly page?: number;
  readonly per_page?: number;
}

export interface Page<T> {
  readonly items: ReadonlyArray<T>;
  readonly total?: number;
  readonly page?: number;
  readonly per_page?: number;
}

export type NumericalOp = 'eq' | 'ne' | 'gt' | 'gte' | 'lt' | 'lte' | 'in' | 'nin';
export type StringOp = 'eq' | 'ne' | 'contains' | 'startswith' | 'endswith' | 'in' | 'nin';
export type DateOp = 'eq' | 'ne' | 'gt' | 'gte' | 'lt' | 'lte' | 'between';
export type BooleanOp = 'eq' | 'ne';

export interface NumericalSearch {
  readonly op: NumericalOp;
  readonly value: number | ReadonlyArray<number>;
}
export interface StringSearch {
  readonly op: StringOp;
  readonly value: string | ReadonlyArray<string>;
}
export interface DateSearch {
  readonly op: DateOp;
  readonly value: string | readonly [string, string];
}
export interface BooleanSearch {
  readonly op: BooleanOp;
  readonly value: boolean;
}

export type SearchPredicate = NumericalSearch | StringSearch | DateSearch | BooleanSearch;

export interface SearchRequest extends PageRequest {
  readonly filters?: Readonly<Record<string, SearchPredicate>>;
  readonly order_by?: string;
  readonly order?: 'asc' | 'desc';
}

export interface OperationTracking {
  readonly tracking_id: string;
  readonly state: 'pending' | 'in_flight' | 'complete' | 'dlq';
  readonly result?: unknown;
  readonly error?: ApiEnvelopeError;
}

export interface DlqEntry {
  readonly id: string;
  readonly extension: string;
  readonly ability: string;
  readonly error_class: string;
  readonly error_message: string;
  readonly created_at: string;
  readonly attempts: number;
  readonly payload?: unknown;
}

export interface ServiceStatus {
  readonly name: string;
  readonly state: 'failed' | 'degraded' | 'healthy';
  readonly last_error?: string;
  readonly failed_at?: string;
}

export interface HealthResponse {
  readonly status: 'UP' | 'DOWN';
}

export interface ReadinessCheck {
  readonly name: string;
  readonly status: 'pass' | 'fail' | 'warn';
  readonly detail?: string;
}

export interface ReadinessResponse {
  readonly status: 'pass' | 'fail' | 'warn';
  readonly checks: ReadonlyArray<ReadinessCheck>;
}

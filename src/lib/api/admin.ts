import type { ApiClient } from './client';
import type { ApiResponse, DlqEntry, Page, ServiceStatus } from './types';

export interface DlqListQuery {
  extension?: string;
  ability?: string;
  error_class?: string;
  since?: string;
  until?: string;
  page?: number;
  per_page?: number;
}

/**
 * Operations admin surface. Mirrors endpoints/Operations.create_operations_router.
 *
 * GET    /admin/dlq                    paginated dead-letter listing
 * POST   /admin/dlq/{id}/replay        re-enqueue one entry
 * POST   /admin/dlq/{id}/discard       drop one entry
 * GET    /admin/services               failed-service supervisor list
 * POST   /admin/services/{name}/reset  clear failed state
 */
export class AdminApi {
  constructor(private readonly client: ApiClient) {}

  listDlq(query: DlqListQuery = {}): Promise<ApiResponse<Page<DlqEntry>>> {
    return this.client.get('/admin/dlq', { query });
  }

  replayDlq(entryId: string): Promise<ApiResponse<void>> {
    return this.client.post(`/admin/dlq/${encodeURIComponent(entryId)}/replay`);
  }

  discardDlq(entryId: string): Promise<ApiResponse<void>> {
    return this.client.post(`/admin/dlq/${encodeURIComponent(entryId)}/discard`);
  }

  listServices(): Promise<ApiResponse<ReadonlyArray<ServiceStatus>>> {
    return this.client.get('/admin/services');
  }

  resetService(name: string): Promise<ApiResponse<void>> {
    return this.client.post(`/admin/services/${encodeURIComponent(name)}/reset`);
  }
}

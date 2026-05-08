import { useCallback, useMemo } from 'react';
import { AdminApi, type DlqListQuery } from '@/lib/api/admin';
import { getApiClient } from '@/lib/api/client';
import type { DlqEntry, Page, ServiceStatus } from '@/lib/api/types';
import { useApi } from './useApi';

const DLQ_REFRESH_MS = 30_000;
const SERVICES_REFRESH_MS = 15_000;

export const useDlq = (query: DlqListQuery = {}) => {
  const admin = useMemo(() => new AdminApi(getApiClient()), []);
  return useApi<Page<DlqEntry>>(
    ['admin/dlq', query],
    () => admin.listDlq(query),
    { refreshInterval: DLQ_REFRESH_MS },
  );
};

export const useFailedServices = () => {
  const admin = useMemo(() => new AdminApi(getApiClient()), []);
  return useApi<ReadonlyArray<ServiceStatus>>(
    'admin/services',
    () => admin.listServices(),
    { refreshInterval: SERVICES_REFRESH_MS },
  );
};

export const useDlqActions = () => {
  const admin = useMemo(() => new AdminApi(getApiClient()), []);
  const replay = useCallback((id: string) => admin.replayDlq(id), [admin]);
  const discard = useCallback((id: string) => admin.discardDlq(id), [admin]);
  return { replay, discard };
};

export const useServiceActions = () => {
  const admin = useMemo(() => new AdminApi(getApiClient()), []);
  const reset = useCallback((name: string) => admin.resetService(name), [admin]);
  return { reset };
};

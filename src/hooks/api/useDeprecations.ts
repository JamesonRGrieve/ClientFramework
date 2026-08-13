'use client';

import { useEffect, useState } from 'react';
import { configureApiClient, getApiClient } from '@/lib/api/client';
import type { DeprecationInfo } from '@/lib/api/types';

type Listener = (notices: ReadonlyArray<DeprecationInfo>) => void;

class DeprecationStore {
  private notices = new Map<string, DeprecationInfo>();
  private listeners = new Set<Listener>();

  record(info: DeprecationInfo): void {
    const existing = this.notices.get(info.resource);
    if (existing && existing.deprecation === info.deprecation && existing.sunset === info.sunset) return;
    this.notices.set(info.resource, info);
    this.emit();
  }

  dismiss(resource: string): void {
    if (!this.notices.delete(resource)) return;
    this.emit();
  }

  snapshot(): ReadonlyArray<DeprecationInfo> {
    return Array.from(this.notices.values());
  }

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return (): void => {
      this.listeners.delete(listener);
    };
  }

  private emit(): void {
    const snapshot = this.snapshot();
    for (const listener of this.listeners) listener(snapshot);
  }
}

const store = new DeprecationStore();
let wired = false;

const ensureWired = (): void => {
  if (wired) return;
  wired = true;
  // Reconfigure singleton to forward Deprecation/Sunset headers into the store.
  configureApiClient({ onDeprecation: (info) => store.record(info) });
  // Prime the singleton so subsequent getApiClient() calls reuse it.
  getApiClient();
};

export function useDeprecations(): {
  notices: ReadonlyArray<DeprecationInfo>;
  dismiss: (resource: string) => void;
} {
  const [notices, setNotices] = useState<ReadonlyArray<DeprecationInfo>>(() => store.snapshot());

  useEffect(() => {
    ensureWired();
    setNotices(store.snapshot());
    return store.subscribe(setNotices);
  }, []);

  return {
    notices,
    dismiss: (resource: string): void => store.dismiss(resource),
  };
}

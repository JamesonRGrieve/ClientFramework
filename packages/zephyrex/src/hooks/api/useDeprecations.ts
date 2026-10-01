// SPDX-License-Identifier: AGPL-3.0-or-later
'use client';

import { useEffect, useSyncExternalStore } from 'react';
import { configureApiClient, getApiClient } from '@/lib/api/client';
import type { DeprecationInfo } from '@/lib/api/types';

type Listener = () => void;

class DeprecationStore {
  private readonly notices = new Map<string, DeprecationInfo>();
  private readonly listeners = new Set<Listener>();
  // Rebuilt only on change, so readers get the same array until there is something new.
  private current: ReadonlyArray<DeprecationInfo> = [];

  record(info: DeprecationInfo): void {
    const existing = this.notices.get(info.resource);
    if (existing && existing.deprecation === info.deprecation && existing.sunset === info.sunset) {
      return;
    }
    this.notices.set(info.resource, info);
    this.emit();
  }

  dismiss(resource: string): void {
    if (!this.notices.delete(resource)) {
      return;
    }
    this.emit();
  }

  readonly snapshot = (): ReadonlyArray<DeprecationInfo> => this.current;

  readonly subscribe = (listener: Listener): (() => void) => {
    this.listeners.add(listener);
    return (): void => {
      this.listeners.delete(listener);
    };
  };

  private emit(): void {
    this.current = Array.from(this.notices.values());
    for (const listener of this.listeners) {
      listener();
    }
  }
}

const store = new DeprecationStore();
let wired = false;

const ensureWired = (): void => {
  if (wired) {
    return;
  }
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
  useEffect(ensureWired, []);
  const notices = useSyncExternalStore(store.subscribe, store.snapshot, store.snapshot);

  return {
    notices,
    dismiss: (resource: string): void => store.dismiss(resource),
  };
}

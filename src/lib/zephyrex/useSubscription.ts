// SPDX-License-Identifier: AGPL-3.0-or-later
'use client';

import { useEffect, useMemo, useState } from 'react';
import { useZephyrexConfig } from './ZephyrexProvider';
import { useBrowserValue } from '@/hooks/useBrowserValue';

const DEFAULT_GRAPHQL_PATH = '/graphql';

/**
 * The GraphQL WebSocket URL for the configured `baseUrl`: absolute as given, or same-origin on the
 * page's own origin. Nothing from the page's path, query or fragment is used.
 */
export function subscriptionUrl(baseUrl: string, graphqlPath: string | undefined, origin: string): string {
  const url = new URL(`${baseUrl.replace(/\/$/, '')}${graphqlPath ?? DEFAULT_GRAPHQL_PATH}`, origin);
  url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:';
  return url.toString();
}

export interface SubscriptionOptions {
  query: string;
  variables?: Record<string, unknown>;
  onData?: (data: unknown) => void;
  onError?: (error: Error) => void;
  enabled?: boolean;
}

export type SocketTarget = { url: string; error: null } | { url: null; error: Error };

/**
 * Where to open the subscription socket, or why it can't be opened. These are the cases in which
 * the WebSocket constructor would throw: a URL that doesn't parse, a fragment, and an insecure
 * `ws:` socket from a secure page.
 */
export function socketTarget(baseUrl: string, graphqlPath: string | undefined, origin: string): SocketTarget {
  let url: URL;
  try {
    url = new URL(subscriptionUrl(baseUrl, graphqlPath, origin));
  } catch {
    return { url: null, error: new Error(`The subscription URL built from "${baseUrl}" is not a valid URL`) };
  }
  if (url.hash !== '') {
    return { url: null, error: new Error(`The subscription URL built from "${baseUrl}" has a fragment`) };
  }
  if (new URL(origin).protocol === 'https:' && url.protocol === 'ws:') {
    return { url: null, error: new Error('A secure page cannot open an insecure (ws:) subscription socket') };
  }
  return { url: url.toString(), error: null };
}

const pageOrigin = (): string => window.location.origin;

export function useSubscription<T = unknown>(options: SubscriptionOptions) {
  const { config } = useZephyrexConfig();
  const [data, setData] = useState<T | null>(null);
  const [socketError, setSocketError] = useState<Error | null>(null);
  const [connected, setConnected] = useState(false);

  const { query, variables, onData, onError, enabled = true } = options;
  const origin = useBrowserValue<string | null>(pageOrigin, null);
  const target = useMemo(
    () => (origin === null ? null : socketTarget(config.server.baseUrl, config.server.graphqlPath, origin)),
    [config.server.baseUrl, config.server.graphqlPath, origin],
  );
  const configError = enabled ? (target?.error ?? null) : null;
  const url = target?.url ?? null;

  useEffect(() => {
    if (configError !== null) {
      onError?.(configError);
    }
  }, [configError, onError]);

  useEffect(() => {
    if (!enabled || url === null) {
      return undefined;
    }

    // The browser sends the session cookie with the upgrade request; nothing is put in the payload.
    const ws = new WebSocket(url, 'graphql-transport-ws');

    ws.onopen = () => {
      setConnected(true);
      ws.send(JSON.stringify({ type: 'connection_init', payload: {} }));

      ws.send(
        JSON.stringify({
          id: '1',
          type: 'subscribe',
          payload: { query, variables },
        }),
      );
    };

    ws.onmessage = (event) => {
      const message = JSON.parse(event.data);
      if (message.type === 'next' && message.payload?.data) {
        setData(message.payload.data);
        onData?.(message.payload.data);
      }
      if (message.type === 'error') {
        const err = new Error(message.payload?.message ?? 'Subscription error');
        setSocketError(err);
        onError?.(err);
      }
    };

    ws.onerror = () => {
      const err = new Error('WebSocket connection failed');
      setSocketError(err);
      onError?.(err);
    };

    ws.onclose = () => {
      setConnected(false);
    };

    return () => {
      ws.close();
    };
  }, [url, query, variables, enabled, onData, onError]);

  return { data, error: configError ?? socketError, connected };
}

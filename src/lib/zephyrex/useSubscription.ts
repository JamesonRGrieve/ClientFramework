// SPDX-License-Identifier: AGPL-3.0-or-later
'use client';

import { useEffect, useRef, useState } from 'react';
import { useZephyrexConfig } from './ZephyrexProvider';

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

export function useSubscription<T = unknown>(options: SubscriptionOptions) {
  const { config } = useZephyrexConfig();
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [connected, setConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);

  const { query, variables, onData, onError, enabled = true } = options;

  useEffect(() => {
    if (!enabled) {
      return undefined;
    }

    try {
      // The browser sends the session cookie with the upgrade request; nothing is put in the payload.
      const ws = new WebSocket(
        subscriptionUrl(config.server.baseUrl, config.server.graphqlPath, window.location.origin),
        'graphql-transport-ws',
      );
      wsRef.current = ws;

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
          setError(err);
          onError?.(err);
        }
      };

      ws.onerror = () => {
        const err = new Error('WebSocket connection failed');
        setError(err);
        onError?.(err);
      };

      ws.onclose = () => {
        setConnected(false);
      };

      return () => {
        ws.close();
        wsRef.current = null;
      };
    } catch (err) {
      const connectError = err instanceof Error ? err : new Error(String(err));
      setError(connectError);
      onError?.(connectError);
      return undefined;
    }
  }, [config.server.baseUrl, config.server.graphqlPath, query, variables, enabled, onData, onError]);

  return { data, error, connected };
}

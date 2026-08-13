// SPDX-License-Identifier: AGPL-3.0-or-later
'use client';

import { useEffect, useRef, useState } from 'react';
import { useZephyrexConfig } from './ZephyrexProvider';
import { getCookie } from 'cookies-next';

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
    if (!enabled) return undefined;

    const wsUrl =
      config.server.baseUrl.replace(/^http/, 'ws').replace(/\/$/, '') + (config.server.graphqlPath ?? '/graphql');

    const token = getCookie('jwt')?.toString();

    try {
      const ws = new WebSocket(wsUrl, 'graphql-transport-ws');
      wsRef.current = ws;

      ws.onopen = () => {
        setConnected(true);
        ws.send(
          JSON.stringify({
            type: 'connection_init',
            payload: token ? { Authorization: `Bearer ${token}` } : {},
          }),
        );

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

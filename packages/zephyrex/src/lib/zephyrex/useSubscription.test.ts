// SPDX-License-Identifier: AGPL-3.0-or-later
import { renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { socketTarget, subscriptionUrl, useSubscription } from './useSubscription';
import { TestWrapper, wrapperWith } from '@/testing/TestWrapper';

const QUERY = 'subscription { test }';
const SECURE_PAGE = 'https://app.example.com';
const UNPARSEABLE_BASE_URL = 'http://[bad';

describe('useSubscription', () => {
  it('starts disconnected when disabled', () => {
    const { result } = renderHook(() => useSubscription({ query: QUERY, enabled: false }), {
      wrapper: TestWrapper,
    });
    expect(result.current.data).toBeNull();
    expect(result.current.error).toBeNull();
    expect(result.current.connected).toBe(false);
  });

  it('builds the socket URL from configuration and the page origin only', () => {
    expect(subscriptionUrl('', undefined, SECURE_PAGE)).toBe('wss://app.example.com/graphql');
    expect(subscriptionUrl('/api/', '/gql', 'http://localhost:1109')).toBe('ws://localhost:1109/api/gql');
    expect(subscriptionUrl('https://api.example.com', undefined, SECURE_PAGE)).toBe('wss://api.example.com/graphql');
  });

  it('opens the socket when the URL is one the WebSocket constructor accepts', () => {
    expect(socketTarget('/api', undefined, SECURE_PAGE)).toEqual({
      url: 'wss://app.example.com/api/graphql',
      error: null,
    });
    expect(socketTarget('http://localhost:8000', undefined, 'http://localhost:1109').url).toBe(
      'ws://localhost:8000/graphql',
    );
  });

  it('reports a URL that does not parse instead of opening a socket', () => {
    const target = socketTarget(UNPARSEABLE_BASE_URL, undefined, SECURE_PAGE);
    expect(target.url).toBeNull();
    expect(target.error?.message).toContain('not a valid URL');
  });

  it('reports a URL with a fragment instead of opening a socket', () => {
    const target = socketTarget('https://api.example.com/#x', undefined, SECURE_PAGE);
    expect(target.url).toBeNull();
    expect(target.error?.message).toContain('fragment');
  });

  it('reports an insecure socket from a secure page instead of opening one', () => {
    const target = socketTarget('http://api.example.com', undefined, SECURE_PAGE);
    expect(target.url).toBeNull();
    expect(target.error?.message).toContain('insecure');
  });

  it('reports a configuration error through the hook and onError without opening a socket', () => {
    const errors: Error[] = [];
    const { result } = renderHook(() => useSubscription({ query: QUERY, onError: (error) => errors.push(error) }), {
      wrapper: wrapperWith({ server: { baseUrl: UNPARSEABLE_BASE_URL } }),
    });
    expect(result.current.error?.message).toContain('not a valid URL');
    expect(errors).toHaveLength(1);
    expect(result.current.connected).toBe(false);
  });

  it('returns hook shape', () => {
    const { result } = renderHook(() => useSubscription({ query: QUERY, enabled: false }), {
      wrapper: TestWrapper,
    });
    expect(result.current).toHaveProperty('data');
    expect(result.current).toHaveProperty('error');
    expect(result.current).toHaveProperty('connected');
  });
});

// SPDX-License-Identifier: AGPL-3.0-or-later
import { renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { subscriptionUrl, useSubscription } from './useSubscription';
import { TestWrapper } from '@/__tests__/test-wrapper';

describe('useSubscription', () => {
  it('starts disconnected when disabled', () => {
    const { result } = renderHook(() => useSubscription({ query: 'subscription { test }', enabled: false }), {
      wrapper: TestWrapper,
    });
    expect(result.current.data).toBeNull();
    expect(result.current.error).toBeNull();
    expect(result.current.connected).toBe(false);
  });

  it('builds the socket URL from configuration and the page origin only', () => {
    expect(subscriptionUrl('', undefined, 'https://app.example.com')).toBe('wss://app.example.com/graphql');
    expect(subscriptionUrl('/api/', '/gql', 'http://localhost:1109')).toBe('ws://localhost:1109/api/gql');
    expect(subscriptionUrl('https://api.example.com', undefined, 'https://app.example.com')).toBe(
      'wss://api.example.com/graphql',
    );
  });

  it('returns hook shape', () => {
    const { result } = renderHook(() => useSubscription({ query: 'subscription { test }', enabled: false }), {
      wrapper: TestWrapper,
    });
    expect(result.current).toHaveProperty('data');
    expect(result.current).toHaveProperty('error');
    expect(result.current).toHaveProperty('connected');
  });
});

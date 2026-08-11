// SPDX-License-Identifier: AGPL-3.0-or-later
import { renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('./ZephyrexProvider', () => ({
  useZephyrexConfig: vi.fn(() => ({
    config: { server: { baseUrl: 'http://localhost:1996', graphqlPath: '/graphql' } },
  })),
}));

vi.mock('cookies-next', () => ({
  getCookie: vi.fn(() => 'mock-jwt'),
}));

vi.stubGlobal('WebSocket', class {
  onopen: (() => void) | null = null;
  send = vi.fn();
  close = vi.fn();
});

import { useSubscription } from './useSubscription';

describe('useSubscription', () => {
  it('starts disconnected with no data when disabled', () => {
    const { result } = renderHook(() =>
      useSubscription({ query: 'subscription { test }', enabled: false }),
    );
    expect(result.current.data).toBeNull();
    expect(result.current.error).toBeNull();
    expect(result.current.connected).toBe(false);
  });

  it('returns hook shape with all fields', () => {
    const { result } = renderHook(() =>
      useSubscription({ query: 'subscription { test }', enabled: false }),
    );
    expect(result.current).toHaveProperty('data');
    expect(result.current).toHaveProperty('error');
    expect(result.current).toHaveProperty('connected');
  });
});

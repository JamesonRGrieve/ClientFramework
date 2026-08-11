// SPDX-License-Identifier: AGPL-3.0-or-later
import { renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { TestWrapper } from '@/__tests__/test-wrapper';
import { useSubscription } from './useSubscription';

describe('useSubscription', () => {
  it('starts disconnected when disabled', () => {
    const { result } = renderHook(
      () => useSubscription({ query: 'subscription { test }', enabled: false }),
      { wrapper: TestWrapper },
    );
    expect(result.current.data).toBeNull();
    expect(result.current.error).toBeNull();
    expect(result.current.connected).toBe(false);
  });

  it('returns hook shape', () => {
    const { result } = renderHook(
      () => useSubscription({ query: 'subscription { test }', enabled: false }),
      { wrapper: TestWrapper },
    );
    expect(result.current).toHaveProperty('data');
    expect(result.current).toHaveProperty('error');
    expect(result.current).toHaveProperty('connected');
  });
});

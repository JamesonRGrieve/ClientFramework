// SPDX-License-Identifier: AGPL-3.0-or-later
import { renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('./ZephyrexProvider', () => ({
  useZephyrexConfig: vi.fn(() => ({
    config: { server: { baseUrl: 'http://localhost:1996' } },
  })),
}));

vi.mock('cookies-next', () => ({
  getCookie: vi.fn(() => 'mock-jwt'),
}));

import { useFileUpload } from './useFileUpload';

describe('useFileUpload', () => {
  it('starts in idle state', () => {
    const { result } = renderHook(() => useFileUpload());
    expect(result.current.uploading).toBe(false);
    expect(result.current.progress).toBeNull();
    expect(result.current.error).toBeNull();
    expect(typeof result.current.upload).toBe('function');
  });

  it('exposes custom endpoint', () => {
    const { result } = renderHook(() => useFileUpload('/v1/avatar'));
    expect(typeof result.current.upload).toBe('function');
  });
});

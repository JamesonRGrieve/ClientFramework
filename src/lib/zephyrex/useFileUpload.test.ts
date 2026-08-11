// SPDX-License-Identifier: AGPL-3.0-or-later
import { renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { TestWrapper } from '@/__tests__/test-wrapper';
import { useFileUpload } from './useFileUpload';

describe('useFileUpload', () => {
  it('starts in idle state', () => {
    const { result } = renderHook(() => useFileUpload(), { wrapper: TestWrapper });
    expect(result.current.uploading).toBe(false);
    expect(result.current.progress).toBeNull();
    expect(result.current.error).toBeNull();
    expect(typeof result.current.upload).toBe('function');
  });

  it('accepts custom endpoint', () => {
    const { result } = renderHook(() => useFileUpload('/v1/avatar'), { wrapper: TestWrapper });
    expect(typeof result.current.upload).toBe('function');
  });
});

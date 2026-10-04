// SPDX-License-Identifier: AGPL-3.0-or-later
import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { useDraft } from './useDraft';

interface Row {
  title: string;
}

const titleOf = ({ title }: Row): string => title;

describe('useDraft', () => {
  it('keeps the user’s edits while the base holds, and refills from a new base', () => {
    const first: Row = { title: 'Notes' };
    const { result, rerender } = renderHook(({ base }: { base: Row }) => useDraft(base, titleOf), {
      initialProps: { base: first },
    });
    expect(result.current[0]).toBe('Notes');
    act(() => {
      result.current[1]('Notes, revised');
    });
    rerender({ base: first });
    expect(result.current[0]).toBe('Notes, revised');
    rerender({ base: { title: 'Notes (saved)' } });
    expect(result.current[0]).toBe('Notes (saved)');
  });
});

// SPDX-License-Identifier: AGPL-3.0-or-later
import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { UNDO_MS } from './useToast';
import { useHidden, useWrites } from './useWrites';

const FALLBACK = 'That could not be saved.';

describe('useHidden', () => {
  const idOf = (item: { id: string }): string => item.id;

  it('hides items by id, shows them again, and is empty only once the last one has gone', () => {
    const { result, rerender } = renderHook(({ items }) => useHidden(items, idOf), {
      initialProps: { items: [{ id: 'g1' }, { id: 'g2' }] },
    });
    act(() => {
      result.current.hide(['g1']);
    });
    expect(result.current.shown).toEqual([{ id: 'g2' }]);
    act(() => {
      result.current.show(['g1']);
      result.current.hide(['g1', 'g2']);
    });
    expect(result.current.shown).toEqual([]);
    // Still undoable: not empty yet, so no first-run state flashes up behind the Undo notice.
    expect(result.current.pending).toBe(true);
    // The removals went through and the list reloaded without them: still empty, nothing to clear.
    rerender({ items: [] });
    expect(result.current.shown).toEqual([]);
    expect(result.current.pending).toBe(false);
    rerender({ items: [{ id: 'g3' }] });
    expect(result.current.shown).toEqual([{ id: 'g3' }]);
  });
});

describe('useWrites', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('runs a write, refreshes, and says why one failed', async () => {
    const onChanged = vi.fn().mockResolvedValue(undefined);
    const { result } = renderHook(() => useWrites(onChanged));
    let worked = false;
    await act(async () => {
      worked = await result.current.run(Promise.resolve(), FALLBACK);
    });
    expect(worked).toBe(true);
    expect(result.current.problem).toBeNull();
    expect(onChanged).toHaveBeenCalledTimes(1);
    await act(async () => {
      worked = await result.current.run(Promise.reject(new Error('Someone else changed it')), FALLBACK);
    });
    expect(worked).toBe(false);
    expect(result.current.problem).toBe('That could not be saved: Someone else changed it');
    expect(result.current.busy).toBe(false);
  });

  it('hides a removal at once, writes it after the undo window, and shows it again if Undo is pressed', async () => {
    vi.useFakeTimers();
    const { result } = renderHook(() => useWrites(vi.fn().mockResolvedValue(undefined)));
    const write = vi.fn().mockResolvedValue(undefined);
    const hide = vi.fn();
    const show = vi.fn();
    act(() => {
      result.current.remove({ message: 'Peonies deleted', write, fallback: FALLBACK, hide, show });
    });
    expect(hide).toHaveBeenCalledTimes(1);
    expect(write).not.toHaveBeenCalled();
    await act(async () => {
      await vi.advanceTimersByTimeAsync(UNDO_MS);
    });
    expect(write).toHaveBeenCalledTimes(1);
    expect(show).not.toHaveBeenCalled();
  });

  it('shows a removal again when its write fails', async () => {
    vi.useFakeTimers();
    const { result } = renderHook(() => useWrites(vi.fn().mockResolvedValue(undefined)));
    const show = vi.fn();
    act(() => {
      result.current.remove({
        message: 'Peonies deleted',
        write: vi.fn().mockRejectedValue(new Error('Gone already')),
        fallback: FALLBACK,
        hide: vi.fn(),
        show,
      });
    });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(UNDO_MS);
    });
    expect(show).toHaveBeenCalledTimes(1);
    expect(result.current.problem).toBe('That could not be saved: Gone already');
  });
});

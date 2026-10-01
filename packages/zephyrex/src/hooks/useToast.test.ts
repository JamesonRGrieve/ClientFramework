// SPDX-License-Identifier: AGPL-3.0-or-later
import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { reducer, toast, useToast } from './useToast';

const toastOf = (id: string): { id: string; title: string; open: boolean } => ({ id, title: `Toast ${id}`, open: true });

describe('reducer', () => {
  it('keeps only the newest toast', () => {
    const state = reducer({ toasts: [toastOf('1')] }, { type: 'ADD_TOAST', toast: toastOf('2') });
    expect(state.toasts.map((item) => item.id)).toEqual(['2']);
  });

  it('updates a toast in place', () => {
    const state = reducer({ toasts: [toastOf('1')] }, { type: 'UPDATE_TOAST', toast: { id: '1', title: 'Saved' } });
    expect(state.toasts[0]?.title).toBe('Saved');
  });

  it('closes one toast, or all of them', () => {
    const one = reducer({ toasts: [toastOf('1')] }, { type: 'DISMISS_TOAST', toastId: '1' });
    expect(one.toasts[0]?.open).toBe(false);
    const all = reducer({ toasts: [toastOf('1')] }, { type: 'DISMISS_TOAST' });
    expect(all.toasts.every((item) => item.open === false)).toBe(true);
  });

  it('removes one toast, or all of them', () => {
    expect(reducer({ toasts: [toastOf('1')] }, { type: 'REMOVE_TOAST', toastId: '1' }).toasts).toEqual([]);
    expect(reducer({ toasts: [toastOf('1')] }, { type: 'REMOVE_TOAST' }).toasts).toEqual([]);
  });
});

describe('useToast', () => {
  afterEach(() => {
    act(() => {
      toast({ title: 'reset' }).dismiss();
    });
  });

  it('shows a toast raised anywhere, then closes it on dismiss', () => {
    const { result } = renderHook(() => useToast());
    let handle: ReturnType<typeof toast> | undefined;
    act(() => {
      handle = toast({ title: 'Saved', description: 'Your changes are live.' });
    });
    expect(result.current.toasts).toHaveLength(1);
    expect(result.current.toasts[0]?.title).toBe('Saved');
    act(() => {
      handle?.update({ id: handle.id, title: 'Published' });
    });
    expect(result.current.toasts[0]?.title).toBe('Published');
    act(() => {
      result.current.dismiss(handle?.id);
    });
    expect(result.current.toasts[0]?.open).toBe(false);
  });
});

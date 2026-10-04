// SPDX-License-Identifier: AGPL-3.0-or-later
import { act, renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { z } from 'zod';
import { ApiError, StaleWriteError } from './client';
import { type GuardedSave, useEditBase, useGuardedSave, writeProblem } from './useGuardedSave';

const HTTP_FORBIDDEN = 403;

const TeamSchema = z.object({ id: z.string(), name: z.string(), updated_at: z.string() });
type Team = z.infer<typeof TeamSchema>;
type Write = (row: Team, changes: Partial<Team>) => Promise<unknown>;

const seen: Team = { id: 't1', name: 'Alpha', updated_at: '2026-10-03T09:00:00.000001' };
const current: Team = { id: 't1', name: 'Gamma', updated_at: '2026-10-03T09:05:00.000002' };
const stale = (row: Team | undefined): StaleWriteError =>
  new StaleWriteError(JSON.stringify({ detail: 'Precondition failed', ...(row === undefined ? {} : { current: row }) }));

const guarded = (write: Write): { result: { current: GuardedSave<Team> } } =>
  renderHook(() => useGuardedSave(write, TeamSchema));

describe('useGuardedSave', () => {
  it('saves a fresh write', async () => {
    const write = vi.fn<Write>().mockResolvedValue(null);
    const { result } = guarded(write);
    let written = false;
    await act(async () => {
      written = await result.current.save(seen, { name: 'Beta' });
    });
    expect(write).toHaveBeenCalledWith(seen, { name: 'Beta' });
    expect(written).toBe(true);
    expect(result.current.conflict).toBeNull();
  });

  it("keeps the user's changes beside the current row when the row changed first", async () => {
    const { result } = guarded(async () => Promise.reject(stale(current)));
    let written = true;
    await act(async () => {
      written = await result.current.save(seen, { name: 'Beta' });
    });
    expect(written).toBe(false);
    expect(result.current.conflict).toEqual({ mine: { name: 'Beta' }, theirs: current });
  });

  it('resolves by writing the merged changes against the current version', async () => {
    const write = vi.fn<Write>().mockRejectedValueOnce(stale(current)).mockResolvedValueOnce(null);
    const { result } = guarded(write);
    await act(async () => {
      await result.current.save(seen, { name: 'Beta' });
    });
    let written = false;
    await act(async () => {
      written = await result.current.resolve({ name: 'Beta' });
    });
    expect(write).toHaveBeenLastCalledWith(current, { name: 'Beta' });
    expect(written).toBe(true);
    expect(result.current.conflict).toBeNull();
  });

  it('marks the row as unavailable when the server did not send it, and cannot resolve against it', async () => {
    const { result } = guarded(async () => Promise.reject(stale(undefined)));
    await act(async () => {
      await result.current.save(seen, { name: 'Beta' });
    });
    expect(result.current.conflict).toEqual({ mine: { name: 'Beta' }, theirs: null });
    await expect(result.current.resolve({ name: 'Beta' })).rejects.toThrow(/no current row/);
  });

  it('drops the changes only when the user discards them', async () => {
    const { result } = guarded(async () => Promise.reject(stale(current)));
    await act(async () => {
      await result.current.save(seen, { name: 'Beta' });
    });
    expect(result.current.conflict).not.toBeNull();
    act(() => {
      result.current.discard();
    });
    expect(result.current.conflict).toBeNull();
  });

  it('keeps an edit on the row it started from when a newer one is re-read, until the user’s save lands', async () => {
    const saved: Team = { id: 't1', name: 'Beta', updated_at: '2026-10-03T09:10:00.000003' };
    const { result, rerender } = renderHook(({ live }: { live: Team }) => useEditBase(live), {
      initialProps: { live: seen },
    });
    rerender({ live: current });
    expect(result.current.base).toBe(seen);

    let landed = true;
    await act(async () => {
      landed = await result.current.rebaseOnSave(Promise.resolve(false));
    });
    expect(landed).toBe(false);
    rerender({ live: current });
    expect(result.current.base).toBe(seen);

    // A save refreshes the row before it resolves, so the saved row is live by the time it lands.
    rerender({ live: saved });
    await act(async () => {
      landed = await result.current.rebaseOnSave(Promise.resolve(true));
    });
    expect(landed).toBe(true);
    expect(result.current.base).toBe(saved);
    rerender({ live: current });
    expect(result.current.base).toBe(saved);
  });

  it('tells the user nothing once a write is done, else why it failed', async () => {
    const fallback = 'Could not save.';
    await expect(writeProblem(Promise.resolve(true), fallback)).resolves.toBeNull();
    await expect(writeProblem(Promise.reject(new Error('Forbidden')), fallback)).resolves.toBe('Forbidden');
    await expect(writeProblem(Promise.reject(new Event('abort')), fallback)).resolves.toBe(fallback);
  });

  it('passes any other failure through untouched', async () => {
    const forbidden = new ApiError(HTTP_FORBIDDEN, '{"detail":"Forbidden"}');
    const { result } = guarded(async () => Promise.reject(forbidden));
    await expect(result.current.save(seen, { name: 'Beta' })).rejects.toBe(forbidden);
    expect(result.current.conflict).toBeNull();
  });
});

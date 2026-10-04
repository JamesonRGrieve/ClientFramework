// SPDX-License-Identifier: AGPL-3.0-or-later
import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ZephyrexClient } from 'zephyrex';
import { TestWrapper, testConfig } from 'zephyrex/testing';
import { fetchFrom } from 'zephyrex/testing/msw';
import { healthFixture, healthHandlers, type HealthStore } from './health.mocks';
import type { Weight } from './healthModel';
import { createRecord, useRecordActions, useRecords } from './healthApi';
import { activityType, sleepType, weightType } from './recordTypes';

const client = new ZephyrexClient({ baseUrl: testConfig.server.baseUrl });

const weightIn = (store: HealthStore, id: string): Weight => {
  const found = store.weights.find((row) => row.id === id);
  if (found === undefined) {
    throw new Error(`No weight ${id} in the fixture`);
  }
  return found;
};

describe('the health API', () => {
  let store: HealthStore;

  beforeEach(() => {
    store = healthFixture();
    vi.stubGlobal('fetch', vi.fn(fetchFrom(healthHandlers(store))));
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('reads a log newest first', async () => {
    const { result } = renderHook(() => useRecords(activityType), { wrapper: TestWrapper });
    await waitFor(() => {
      expect(result.current.data?.map(({ id }) => id)).toEqual(['a2', 'a1']);
    });
  });

  it('records a night, the server counting its minutes', async () => {
    const night = await createRecord(client, sleepType, {
      bedtime: '2026-10-01T22:30:00.000Z',
      wake_time: '2026-10-02T06:00:00.000Z',
    });
    expect(night.duration_minutes).toBe(450);
    expect(store.sleeps).toContainEqual(night);
  });

  it('changes a record only at the version it was opened on', async () => {
    const { result } = renderHook(() => useRecordActions(weightType), { wrapper: TestWrapper });
    const loaded = weightIn(store, 'w1');
    await act(async () => {
      await expect(result.current.update.save(loaded, { weight_kg: 70.2 })).resolves.toBe(true);
    });
    await act(async () => {
      await expect(result.current.update.save(loaded, { notes: 'late' })).resolves.toBe(false);
    });
    expect(result.current.update.conflict).toMatchObject({ mine: { notes: 'late' }, theirs: { weight_kg: 70.2 } });
    expect(weightIn(store, 'w1').notes).toBeUndefined();
  });

  it('deletes a record at its version', async () => {
    const { result } = renderHook(() => useRecordActions(weightType), { wrapper: TestWrapper });
    await act(async () => {
      await expect(result.current.remove.save(weightIn(store, 'w2'), {})).resolves.toBe(true);
    });
    expect(store.weights.map(({ id }) => id)).toEqual(['w1']);
  });
});

// SPDX-License-Identifier: AGPL-3.0-or-later
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useRecords } from './healthApi';
import { weightType } from './recordTypes';
import { renderHealth } from './testing.mocks';

function WeightCount(): string {
  return `${String(useRecords(weightType).data?.length ?? 0)} weighings`;
}

describe('renderHealth', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('renders under the Zephyrex test app, answering the health routes from the given store', async () => {
    const view = renderHealth(<WeightCount />);
    expect(await view.findByText('2 weighings')).toBeInTheDocument();
  });

  it('serves nothing from an empty store', async () => {
    const view = renderHealth(<WeightCount />, { activities: [], meals: [], weights: [], sleeps: [] });
    expect(await view.findByText('0 weighings')).toBeInTheDocument();
  });
});

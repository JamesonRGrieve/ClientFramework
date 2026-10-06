// SPDX-License-Identifier: AGPL-3.0-or-later
import { afterEach, describe, expect, it, vi } from 'vitest';
import { chainsFixture } from './chains.mocks';
import { useChains } from './chainsApi';
import { recordCalls, renderChains } from './testing.mocks';

const BASE = 'http://localhost:1996';

function ChainCount(): string {
  return `${String(useChains().data?.length ?? 0)} chains`;
}

describe('the test helpers', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('render under the Zephyrex test app, answering the chain routes from the fixture', async () => {
    expect(await renderChains(<ChainCount />).findByText('2 chains')).toBeInTheDocument();
  });

  it('render from the store given', async () => {
    expect(
      await renderChains(<ChainCount />, { ...chainsFixture(), chains: [] }).findByText('0 chains'),
    ).toBeInTheDocument();
  });

  it('record each call answered from the store', async () => {
    const calls = recordCalls(chainsFixture());
    await expect((await fetch(`${BASE}/v1/chain/empty`)).json()).resolves.toMatchObject({ chain: { name: 'Blank' } });
    expect(calls.map(({ url }) => url)).toEqual([`${BASE}/v1/chain/empty`]);
  });
});

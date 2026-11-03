// SPDX-License-Identifier: AGPL-3.0-or-later
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ZephyrexClient } from 'zephyrex';
import { testConfig } from 'zephyrex/testing';
import { fetchFrom } from 'zephyrex/testing/msw';
import { ALEX_ID, agreementsHandlers, emptyAgreementsStore, ME_ID, SAM_ID } from './agreements.mocks';
import { agreementsApi } from './agreementsApi';
import { nth } from './testing.mocks';

describe('agreementsApi', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('starts an agreement, writes it, confirms it and deletes it', async () => {
    const store = emptyAgreementsStore();
    vi.stubGlobal('fetch', vi.fn(fetchFrom(agreementsHandlers(store))));
    const client = new ZephyrexClient({ baseUrl: testConfig.server.baseUrl });
    const started = await agreementsApi.start(client, { title: 'Us', revisit_on: null, party_user_ids: [ALEX_ID] });
    expect(started.parties.map((p) => p.user_id)).toEqual([ME_ID, ALEX_ID]);
    const added = await agreementsApi.addTerm(client, started.id, 'rule', 'No phones at dinner');
    const term = nth(added.terms, 0);
    expect(term).toMatchObject({ kind: 'rule', written_by: ME_ID });
    const reworded = await agreementsApi.changeTerm(client, term.id, { text: 'No phones at the table' });
    expect(reworded.version).toBe(added.version + 1);
    const confirmed = await agreementsApi.confirm(client, started.id);
    expect(confirmed.parties.find((p) => p.user_id === ME_ID)?.confirmed).toBe(true);
    const renamed = await agreementsApi.change(client, started.id, { title: 'Ours', revisit_on: '2027-01-01' });
    expect(renamed).toMatchObject({ title: 'Ours', revisit_on: '2027-01-01' });
    const withSam = await agreementsApi.addParty(client, started.id, SAM_ID);
    expect(withSam.parties).toHaveLength(3);
    await agreementsApi.removeParty(client, started.id, SAM_ID);
    const emptied = await agreementsApi.removeTerm(client, term.id);
    expect(emptied.terms).toEqual([]);
    expect(await agreementsApi.remove(client, started.id)).toEqual([]);
  });
});

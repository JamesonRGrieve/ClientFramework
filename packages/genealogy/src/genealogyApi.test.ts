// SPDX-License-Identifier: AGPL-3.0-or-later
import { renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ZephyrexClient } from 'zephyrex';
import { TestWrapper, testConfig } from 'zephyrex/testing';
import { fetchFrom } from 'zephyrex/testing/msw';
import { familyFixture, genealogyHandlers } from './genealogy.mocks';
import { genealogyApi, useKinship, useLineage, usePersons, useRelationships } from './genealogyApi';

const client = new ZephyrexClient({ baseUrl: testConfig.server.baseUrl });

describe('genealogyApi', () => {
  let store: ReturnType<typeof familyFixture>;

  beforeEach(() => {
    store = familyFixture();
    vi.stubGlobal('fetch', vi.fn(fetchFrom(genealogyHandlers(store))));
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('records a partnership both ways, and anything else once', async () => {
    const before = store.relationships.length;
    const partners = await genealogyApi.createRelationship(client, {
      person_id: 'byron',
      target_person_id: 'annabella',
      kind: 'partnership',
      discriminator: 'marriage',
    });
    expect(partners.map((row) => [row.person_id, row.target_person_id])).toEqual([
      ['byron', 'annabella'],
      ['annabella', 'byron'],
    ]);
    await genealogyApi.createRelationship(client, { person_id: 'anne', target_person_id: 'ralph', kind: 'sibling_of' });
    expect(store.relationships).toHaveLength(before + 3);
  });

  it('creates, updates and deletes a person', async () => {
    const medora = await genealogyApi.createPerson(client, { name: 'Medora Leigh' });
    expect((await genealogyApi.updatePerson(client, medora.id, { gender: 'female' })).gender).toBe('female');
    await genealogyApi.deletePerson(client, medora.id);
    expect(store.persons.some((row) => row.id === medora.id)).toBe(false);
  });

  it('imports GEDCOM, and reports a refused file', async () => {
    await expect(genealogyApi.importGedcom(client, '0 @I1@ INDI')).resolves.toMatchObject({ relationships: 0 });
    await expect(genealogyApi.importGedcom(client, '0 HEAD')).rejects.toThrow('The file has no INDI records.');
    expect(genealogyApi.exportUrl(client)).toBe(`${testConfig.server.baseUrl}/v1/person/gedcom`);
  });
});

describe('genealogy hooks', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn(fetchFrom(genealogyHandlers())));
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('read the people, one end of their relationships, their lineage and their kinship', async () => {
    // Each hook's data is read while rendering: SWR re-renders a hook only for the fields its render read.
    const { result } = renderHook(
      () => ({
        persons: usePersons().data,
        parents: useRelationships('ada', 'target_person_id').data,
        ancestors: useLineage('ada', 'ancestors', { generations: 1, roles: ['biological'] }).data,
        kinship: useKinship('byron-jr', 'byron').data,
        pending: useKinship('byron-jr', null).data,
      }),
      { wrapper: TestWrapper },
    );
    await waitFor(() => {
      expect(result.current.kinship?.lineal).toBe(true);
      expect(result.current.persons).toHaveLength(familyFixture().persons.length);
      // Every row with Ada as its object: her parents' ancestry, and William's side of their marriage.
      expect(result.current.parents?.map((row) => row.person_id)).toEqual(['byron', 'annabella', 'william']);
      expect(result.current.ancestors?.relatives.map((row) => row.person_id)).toEqual(['byron', 'annabella']);
    });
    expect(result.current.pending).toBeUndefined();
  });
});

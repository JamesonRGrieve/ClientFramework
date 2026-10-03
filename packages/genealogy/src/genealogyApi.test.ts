// SPDX-License-Identifier: AGPL-3.0-or-later
import { renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { StaleWriteError, ZephyrexClient } from 'zephyrex';
import { TestWrapper, testConfig } from 'zephyrex/testing';
import { fetchFrom } from 'zephyrex/testing/msw';
import { FIXTURE_VERSION, familyFixture, genealogyHandlers } from './genealogy.mocks';
import { genealogyApi, type Relationship, useKinship, useLineage, usePersons, useRelationships } from './genealogyApi';

const client = new ZephyrexClient({ baseUrl: testConfig.server.baseUrl });

/** The one relationship a create recorded; a sibling link is stored once. */
const onlyRow = (rows: readonly Relationship[]): Relationship => {
  const [row, ...others] = rows;
  if (row === undefined || others.length > 0) {
    throw new Error(`Expected one relationship, got ${String(rows.length)}`);
  }
  return row;
};

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

  it('creates, updates and deletes a person, each change guarded by the version it was made against', async () => {
    const medora = await genealogyApi.createPerson(client, { name: 'Medora Leigh' });
    const updated = await genealogyApi.updatePerson(client, medora, { gender: 'female' });
    expect(updated.gender).toBe('female');
    // The version the person was created at is now stale: nothing is overwritten or removed with it.
    await expect(genealogyApi.updatePerson(client, medora, { gender: 'other' })).rejects.toMatchObject({
      status: 412,
      current: updated,
    });
    await expect(genealogyApi.deletePerson(client, medora)).rejects.toBeInstanceOf(StaleWriteError);
    await genealogyApi.deletePerson(client, updated);
    expect(store.persons.some((row) => row.id === medora.id)).toBe(false);
  });

  it('deletes a relationship only at the version it was loaded at', async () => {
    const row = onlyRow(
      await genealogyApi.createRelationship(client, { person_id: 'anne', target_person_id: 'ralph', kind: 'sibling_of' }),
    );
    await expect(genealogyApi.deleteRelationship(client, { ...row, created_at: FIXTURE_VERSION })).rejects.toBeInstanceOf(
      StaleWriteError,
    );
    await genealogyApi.deleteRelationship(client, row);
    expect(store.relationships.some((candidate) => candidate.id === row.id)).toBe(false);
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

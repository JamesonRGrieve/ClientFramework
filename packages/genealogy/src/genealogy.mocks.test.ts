// SPDX-License-Identifier: AGPL-3.0-or-later
import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { fetchFrom } from 'zephyrex/testing/msw';
import { genealogyHandlers } from './genealogy.mocks';
import { PersonSchema, RelationshipSchema } from './genealogyApi';

const BASE = 'http://localhost:1996';
const HTTP_CREATED = 201;
const HTTP_NOT_FOUND = 404;
const HTTP_UNPROCESSABLE = 422;

const call = async (path: string, init?: RequestInit): Promise<Response> =>
  fetchFrom(genealogyHandlers())(`${BASE}${path}`, init);
const json = async (path: string): Promise<unknown> => (await call(path)).json();

describe('the mock genealogy server', () => {
  it("walks Ada's ancestors and descendants by generation", async () => {
    await expect(json('/v1/person/byron-jr/ancestors')).resolves.toEqual({
      person_id: 'byron-jr',
      relatives: [
        { person_id: 'ada', generation: 1 },
        { person_id: 'william', generation: 1 },
        { person_id: 'byron', generation: 2 },
        { person_id: 'annabella', generation: 2 },
      ],
    });
    await expect(json('/v1/person/byron/descendants?generations=1')).resolves.toEqual({
      person_id: 'byron',
      relatives: [{ person_id: 'ada', generation: 1 }],
    });
    await expect(json('/v1/person/ada/ancestors?roles=adopted')).resolves.toEqual({ person_id: 'ada', relatives: [] });
  });

  it('works out kinship through the nearest common ancestors', async () => {
    await expect(json('/v1/person/byron-jr/kinship/byron')).resolves.toMatchObject({
      related: true,
      common_ancestors: ['byron'],
      up_from_person: 2,
      up_from_other: 0,
      lineal: true,
      removed: 2,
    });
    await expect(json('/v1/person/byron-jr/kinship/anne')).resolves.toMatchObject({
      common_ancestors: ['ada', 'william'],
      cousin: 0,
      removed: 0,
      lineal: false,
    });
    await expect(json('/v1/person/byron/kinship/annabella')).resolves.toMatchObject({ related: false, degree: null });
    expect((await call('/v1/person/nobody/kinship/ada')).status).toBe(HTTP_NOT_FOUND);
  });

  it('lists, creates and filters people and relationships', async () => {
    const handlers = genealogyHandlers();
    const send = fetchFrom(handlers);
    const created = await send(`${BASE}/v1/person`, {
      method: 'POST',
      body: JSON.stringify({ person: { name: 'Medora' } }),
    });
    expect(created.status).toBe(HTTP_CREATED);
    const persons = z.object({ persons: z.array(PersonSchema) }).parse(await (await send(`${BASE}/v1/person`)).json());
    expect(persons.persons.map((row) => row.name)).toContain('Medora');
    const parents = z
      .object({ relationships: z.array(RelationshipSchema) })
      .parse(await (await send(`${BASE}/v1/relationship?target_person_id=ada`)).json());
    expect(parents.relationships.filter((row) => row.kind === 'ancestry').map((row) => row.person_id)).toEqual([
      'byron',
      'annabella',
    ]);
  });

  it('exports GEDCOM, and refuses a file without people', async () => {
    expect(await (await call('/v1/person/gedcom')).text()).toContain('0 @ada@ INDI');
    const refused = await call('/v1/person/gedcom', { method: 'POST', body: JSON.stringify({ gedcom: '0 HEAD' }) });
    expect(refused.status).toBe(HTTP_UNPROCESSABLE);
  });
});

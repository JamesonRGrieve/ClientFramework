// SPDX-License-Identifier: AGPL-3.0-or-later
'use client';

import useSWR, { type SWRResponse } from 'swr';
import { useClient, type ZephyrexClient } from 'zephyrex';
import { type Agreement, AgreementListSchema, AgreementSchema, type TermKind } from './agreementsModel';

export const AGREEMENTS_ENDPOINT = '/v1/agreements';
const MINE = `${AGREEMENTS_ENDPOINT}/mine`;
const at = (...parts: string[]): string => [AGREEMENTS_ENDPOINT, ...parts.map(encodeURIComponent)].join('/');

/** The agreements the signed-in user is party to. */
export function useAgreements(): SWRResponse<Agreement[], Error> {
  const client = useClient();
  return useSWR<Agreement[], Error>(
    client.url(MINE),
    async () => AgreementListSchema.parse(await client.get(MINE)).agreements,
  );
}

/** Types, not interfaces: they are sent as JSON bodies, whose types need an index signature. */
export type NewAgreement = { title: string; revisit_on: string | null; party_user_ids: string[] };
export type AgreementDetails = { title?: string; revisit_on?: string | null; clear_revisit?: boolean };

const one = async (write: Promise<unknown>): Promise<Agreement> => AgreementSchema.parse(await write);
const many = async (write: Promise<unknown>): Promise<Agreement[]> => AgreementListSchema.parse(await write).agreements;

export const agreementsApi = {
  start: async (client: ZephyrexClient, agreement: NewAgreement): Promise<Agreement> =>
    one(client.post(AGREEMENTS_ENDPOINT, agreement)),
  change: async (client: ZephyrexClient, id: string, details: AgreementDetails): Promise<Agreement> =>
    one(client.post(at(id, 'details'), details)),
  remove: async (client: ZephyrexClient, id: string): Promise<Agreement[]> => many(client.post(at(id, 'remove'), {})),
  addParty: async (client: ZephyrexClient, id: string, userId: string): Promise<Agreement> =>
    one(client.post(at(id, 'parties'), { user_id: userId })),
  removeParty: async (client: ZephyrexClient, id: string, userId: string): Promise<Agreement[]> =>
    many(client.post(at(id, 'parties', 'remove'), { user_id: userId })),
  addTerm: async (client: ZephyrexClient, id: string, kind: TermKind, text: string): Promise<Agreement> =>
    one(client.post(at(id, 'terms'), { kind, text })),
  changeTerm: async (
    client: ZephyrexClient,
    termId: string,
    change: { kind?: TermKind; text?: string },
  ): Promise<Agreement> => one(client.post(at('terms', termId), change)),
  removeTerm: async (client: ZephyrexClient, termId: string): Promise<Agreement> =>
    one(client.post(at('terms', termId, 'remove'), {})),
  confirm: async (client: ZephyrexClient, id: string): Promise<Agreement> => one(client.post(at(id, 'confirm'), {})),
};

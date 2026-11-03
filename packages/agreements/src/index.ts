// SPDX-License-Identifier: AGPL-3.0-or-later
// The client half of the server's agreements extension (zephyrex[agreements]): written agreements
// between people, confirmed by each of them and revisited together.
export { AGREEMENTS_ENDPOINT, agreementsApi, useAgreements } from './agreementsApi';
export type { AgreementDetails, NewAgreement } from './agreementsApi';
export { AgreementSchema, DEFAULT_KINDS, dueForRevisit, shownKind } from './agreementsModel';
export type { Agreement, AgreementPerson, Party, Term, TermKindInfo } from './agreementsModel';
export { AgreementsPage, listed } from './AgreementsPage';
export type { AgreementsPageProps } from './AgreementsPage';
export { agreementsExtension } from './extension';
export { AGREEMENTS_PATH } from './routes';

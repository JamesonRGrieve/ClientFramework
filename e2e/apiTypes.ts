// SPDX-License-Identifier: AGPL-3.0-or-later
// The bodies the e2e suite reads from the API, so Playwright's typed responses (`request.get<T>`)
// say what each test expects instead of defaulting to `any`.

/** A response whose body the test does not read. */
export type Unread = never;

/** Registration and password sign-in may answer with a bearer token. */
export type TokenBody = { token?: string };

export type Team = { id: string; name: string; description?: string | null };
export type TeamBody = { team: Team };
export type TeamsBody = { teams: Team[] };

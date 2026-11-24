// SPDX-License-Identifier: AGPL-3.0-or-later
/**
 * The waitlist: while an app's accounts (or a paid plan) aren't open yet, a visitor leaves an email
 * and becomes a lead in the operator's ERP CRM. The browser posts to the app's own server
 * (WAITLIST_PATH, so the app's CSP stays 'self' and nothing needs CORS); the app mounts
 * createWaitlistRoute there, which hands the lead to the ERP's web form server-to-server. Each app
 * has its own web form in the ERP (`waitlist-<app>`), which sets the lead's source and company.
 */

import { z } from 'zod';

/** Where every app mounts its waitlist route (app/api/waitlist/route.ts), and where WaitlistForm posts. */
export const WAITLIST_PATH = '/api/waitlist';

/**
 * What the form sends: the email, the visitor's name when they gave one, their consent to be emailed,
 * and, where the app offers several things to wait for, which one (`interests`' key).
 */
export interface WaitlistEntry {
  email: string;
  name?: string;
  consent: true;
  interest?: string;
}

/** Sign-ups the route takes from everyone together: a burst, then one every `everyMs`. */
export interface WaitlistPace {
  burst: number;
  everyMs: number;
}

export interface WaitlistRouteOptions {
  /** The app's web form in the ERP, e.g. 'waitlist-text-mutation'. */
  webForm: string;
  /** The app's name: the lead's enquiry starts "<app> waitlist:", which is how sales tells the apps apart. */
  app: string;
  /** What the person is waiting for, after that prefix (e.g. 'accounts'). */
  enquiry?: string;
  /**
   * The CRM business the lead belongs to: 'Zephyrex' by default; `null` sends none, for a CRM
   * without businesses (Boden's).
   */
  business?: string | null;
  /**
   * The lead field the "<app> waitlist: …" line goes in: `enquiry` (the Zephyrex ERP's, the default)
   * or `wp_form_message` (Boden's CRM Lead has no enquiry).
   */
  messageField?: 'enquiry' | 'wp_form_message';
  /** The ERP site. */
  erpOrigin?: string;
  /** Entries one address may send in an hour; past that the route answers 429. */
  perHour?: number;
  /**
   * The pace for everyone together, since anyone may post and a forwarded address can be made up:
   * by default a burst of 10, then one every 6 s (as Chronos paces its own). Past it, 429.
   */
  pace?: WaitlistPace;
  /**
   * The things a person can wait for, by key, with the words sales reads (e.g. `{ full_report: 'Full
   * report' }`). An entry may then name one as `interest`, which must be one of these keys (422
   * otherwise), and the lead's enquiry becomes "<app> waitlist: <words> (<key>)". Without it, or
   * without an interest in the entry, the enquiry is as `enquiry` says.
   */
  interests?: Readonly<Record<string, string>>;
  /** The fetch that reaches the ERP (tests pass their own). */
  fetch?: typeof fetch;
  /** The clock, in milliseconds (tests pass their own). */
  now?: () => number;
}

const ERP_ORIGIN = 'https://erp.zephyrex.ca';
const ACCEPT_PATH = '/api/method/frappe.website.doctype.web_form.web_form.accept';
const HOUR_MS = 3_600_000;
/** How long the ERP gets to answer before the visitor is told to try again. */
const ERP_TIMEOUT_MS = 10_000;
const STATUS = { accepted: 202, unusable: 422, busy: 429, unreachable: 502 } as const;
const MAX_EMAIL = 254;
const MAX_NAME = 140;
const DEFAULT_PACE: WaitlistPace = { burst: 10, everyMs: 6000 };
// One @, something on each side, a dot in the domain, no spaces: the ERP checks the rest.
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const MESSAGES = {
  email: 'Enter an email address, like name@example.com.',
  name: `Keep the name under ${String(MAX_NAME)} characters.`,
  body: 'Send the email as JSON: {"email": "…"}.',
  busy: 'That is a lot of tries from one place. Try again in an hour.',
  unreachable: 'The waitlist could not be reached. Try again in a few minutes.',
  consent: 'Joining the waitlist needs your agreement to be emailed.',
  interest: 'Choose one of the offers this waitlist is for.',
  crowded: 'Many people are joining just now. Try again in a minute.',
} as const;

/** The error shape the framework's servers answer with, so the client reads every refusal one way. */
function refusal(status: number, message: string): Response {
  return Response.json({ detail: { message } }, { status });
}

/** The visitor's address as the proxy saw it, for the rate limit; one bucket when there's none. */
function clientAddress(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim();
  if (forwarded !== undefined && forwarded !== '') {
    return forwarded;
  }
  const real = request.headers.get('x-real-ip');
  return real !== null && real !== '' ? real : 'unknown';
}

// The body is checked in the order the visitor's reasons are worded: is it JSON, then the email, then the name.
const EntryBody = z.looseObject({});
const Email = z.string().trim().max(MAX_EMAIL).regex(EMAIL);
const Name = z.string().trim().max(MAX_NAME).optional();
const Consent = z.literal(true);
const Interest = z.string().optional();

/** The entry in a parsed body (null when the body wasn't JSON), or why it can't be one. */
function readEntry(
  parsed: z.ZodSafeParseResult<z.infer<typeof EntryBody>>,
  interests: ReadonlyMap<string, string> | undefined,
): WaitlistEntry | { problem: string } {
  if (!parsed.success) {
    return { problem: MESSAGES.body };
  }
  const email = Email.safeParse(parsed.data.email);
  if (!email.success) {
    return { problem: MESSAGES.email };
  }
  const name = Name.safeParse(parsed.data.name);
  if (!name.success) {
    return { problem: MESSAGES.name };
  }
  if (!Consent.safeParse(parsed.data.consent).success) {
    return { problem: MESSAGES.consent };
  }
  const entry: WaitlistEntry =
    name.data !== undefined && name.data !== ''
      ? { email: email.data, name: name.data, consent: true }
      : { email: email.data, consent: true };
  // An interest counts only where the route declares interests; elsewhere it is ignored, as before.
  if (interests === undefined) {
    return entry;
  }
  const interest = Interest.safeParse(parsed.data.interest);
  if (!interest.success) {
    return { problem: MESSAGES.interest };
  }
  if (interest.data === undefined || interest.data === '') {
    return entry;
  }
  return interests.has(interest.data) ? { ...entry, interest: interest.data } : { problem: MESSAGES.interest };
}

/**
 * The CRM Lead the ERP's web form takes: the first word of the name as first_name and the rest as
 * last_name, or the email's local part when no name was given (the ERP needs a first name). Source,
 * status and business are sent, not left to the form: the ERP applies a web form's hidden defaults
 * only to a browser's submission, never to a server's (Zephyrex ERP, 2026-11-23).
 */
function leadDocument(
  entry: WaitlistEntry,
  options: WaitlistRouteOptions,
  interests: ReadonlyMap<string, string> | undefined,
): Record<string, string> {
  const wanted = entry.interest === undefined ? undefined : interests?.get(entry.interest);
  const [first = '', ...rest] = (entry.name ?? '').split(/\s+/).filter(Boolean);
  const document: Record<string, string> = {
    doctype: 'CRM Lead',
    web_form_name: options.webForm,
    first_name: first || (entry.email.split('@')[0] ?? entry.email),
    email: entry.email,
    source: 'Website',
    status: 'New',
    [options.messageField ?? 'enquiry']:
      wanted === undefined
        ? `${options.app} waitlist: ${options.enquiry ?? 'joined from the website'}`
        : `${options.app} waitlist: ${wanted} (${entry.interest ?? ''})`,
  };
  const business = options.business === undefined ? 'Zephyrex' : options.business;
  if (business !== null) {
    document.crm_business = business;
  }
  if (rest.length > 0) {
    document.last_name = rest.join(' ');
  }
  return document;
}

/**
 * The route an app mounts at WAITLIST_PATH: `export const { POST } = createWaitlistRoute({ webForm, app })`.
 * It checks the entry, holds each address to `perHour` entries, and hands the lead to the ERP. The
 * limit is kept in this server process's memory: each worker counts on its own and a restart forgets
 * it, so it slows a casual repeat and is no defence against a determined one. It
 * answers 202 when the ERP took it, 422 for an entry it can't use (consent included), 429 past either limit and 502 when
 * the ERP can't be reached or refuses it (its refusals are Frappe's own HTML, never shown), each with `{ detail: { message } }` to show the visitor.
 */
export function createWaitlistRoute(options: WaitlistRouteOptions): { POST: (request: Request) => Promise<Response> } {
  const { webForm, erpOrigin = ERP_ORIGIN, perHour = 5, pace = DEFAULT_PACE } = options;
  // Both are looked up on each call, never kept from creation: an app creates the route when its
  // module loads, so a test that stubs fetch (or fakes the clock) after importing it would otherwise
  // still reach the real ERP (Text Mutation, 2026-11-24).
  const now = (): number => (options.now ?? Date.now)();
  const interests = options.interests === undefined ? undefined : new Map(Object.entries(options.interests));
  const recent = new Map<string, number[]>();
  // The shared bucket: full to start, refilled one sign-up every `pace.everyMs`.
  let tokens = pace.burst;
  let filledAt = now();

  const paced = (): boolean => {
    const at = now();
    tokens = Math.min(pace.burst, tokens + (at - filledAt) / pace.everyMs);
    filledAt = at;
    if (tokens < 1) {
      return false;
    }
    tokens -= 1;
    return true;
  };

  const allow = (address: string): boolean => {
    const since = now() - HOUR_MS;
    // Forget the addresses whose last entry has aged out, so the map doesn't grow without end.
    for (const [key, seen] of recent) {
      if ((seen.at(-1) ?? 0) <= since) {
        recent.delete(key);
      }
    }
    const times = (recent.get(address) ?? []).filter((time) => time > since);
    if (times.length >= perHour) {
      return false;
    }
    recent.set(address, [...times, now()]);
    return true;
  };

  const POST = async (request: Request): Promise<Response> => {
    const entry = readEntry(EntryBody.safeParse(await request.json().catch(() => null)), interests);
    if ('problem' in entry) {
      return refusal(STATUS.unusable, entry.problem);
    }
    if (!allow(clientAddress(request))) {
      return refusal(STATUS.busy, MESSAGES.busy);
    }
    if (!paced()) {
      return refusal(STATUS.busy, MESSAGES.crowded);
    }

    const form = new URLSearchParams({
      web_form: webForm,
      data: JSON.stringify(leadDocument(entry, options, interests)),
    });
    try {
      const answer = await (options.fetch ?? globalThis.fetch)(`${erpOrigin}${ACCEPT_PATH}`, {
        method: 'POST',
        headers: { Accept: 'application/json', 'Content-Type': 'application/x-www-form-urlencoded' },
        body: form.toString(),
        signal: AbortSignal.timeout(ERP_TIMEOUT_MS),
      });
      if (!answer.ok) {
        return refusal(STATUS.unreachable, MESSAGES.unreachable);
      }
    } catch {
      return refusal(STATUS.unreachable, MESSAGES.unreachable);
    }
    return Response.json({ ok: true }, { status: STATUS.accepted });
  };

  return { POST };
}

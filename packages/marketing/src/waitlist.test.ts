// SPDX-License-Identifier: AGPL-3.0-or-later
import { describe, expect, it, vi } from 'vitest';
import { createWaitlistRoute } from './waitlist';

const ACCEPT = `https://erp.zephyrex.ca/api/method/frappe.website.doctype.web_form.web_form.accept`;
const FORM = 'waitlist-app';
const ADA = 'ada@example.com';
const BAD_EMAIL = 'Enter an email address';
const THIRD = 'c@example.com';
const WEBSITE = 'Website';
const NEW = 'New';
const ACCOUNTS_LINE = 'App waitlist: Accounts';

function entry(body: string | object | null, address = '203.0.113.7'): Request {
  return new Request('http://app.test/api/waitlist', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Forwarded-For': `${address}, 10.0.0.1` },
    // Every entry consents unless the test says otherwise.
    body: typeof body === 'string' ? body : JSON.stringify(body === null ? null : { consent: true, ...body }),
  });
}

function erpThatAccepts(): ReturnType<typeof vi.fn<typeof fetch>> {
  // The route reads only `ok`, so one answer serves every call.
  return vi.fn<typeof fetch>().mockResolvedValue(Response.json({ message: {} }));
}

async function detail(answer: Response): Promise<string> {
  return ((await answer.json()) as { detail: { message: string } }).detail.message;
}

/** The form-encoded body of a request the route sent the ERP. */
function sentForm(init: RequestInit | undefined): URLSearchParams {
  const body = init?.body;
  return new URLSearchParams(typeof body === 'string' ? body : '');
}

/** The CRM Lead the route handed the ERP on its nth call. */
function leadSent(erp: ReturnType<typeof vi.fn<typeof fetch>>, call = 0): Record<string, string> {
  const form = sentForm(erp.mock.calls[call]?.[1]);
  return JSON.parse(form.get('data') ?? '') as Record<string, string>;
}

describe('the entry the route reads', () => {
  it('keeps a trimmed email and splits the name into first and last', async () => {
    const erp = erpThatAccepts();
    const { POST } = createWaitlistRoute({ webForm: FORM, app: 'App', enquiry: 'Accounts', fetch: erp });
    await POST(entry({ email: ' ada@example.com ', name: ' Ada King Lovelace ' }));
    expect(leadSent(erp)).toEqual({
      doctype: 'CRM Lead',
      web_form_name: FORM,
      first_name: 'Ada',
      last_name: 'King Lovelace',
      email: ADA,
      source: WEBSITE,
      status: NEW,
      crm_business: 'Zephyrex',
      enquiry: ACCOUNTS_LINE,
    });
  });

  it('uses the email’s local part as the first name when the name is blank', async () => {
    const erp = erpThatAccepts();
    const { POST } = createWaitlistRoute({ webForm: FORM, app: 'App', fetch: erp });
    await POST(entry({ email: 'ada.l@example.com', name: '  ' }));
    expect(leadSent(erp)).toEqual({
      doctype: 'CRM Lead',
      web_form_name: FORM,
      first_name: 'ada.l',
      email: 'ada.l@example.com',
      source: WEBSITE,
      status: NEW,
      crm_business: 'Zephyrex',
      enquiry: 'App waitlist: joined from the website',
    });
  });

  it.each([
    [{ email: 'not an email' }, BAD_EMAIL],
    [{ email: 7 }, BAD_EMAIL],
    [{ email: `${'a'.repeat(250)}@example.com` }, BAD_EMAIL],
    [{ email: ADA, name: 'x'.repeat(141) }, 'Keep the name under 140'],
    [{ email: ADA, name: 3 }, 'Keep the name under 140'],
    [null, 'Send the email as JSON'],
    [{ email: ADA, consent: false }, 'needs your agreement to be emailed'],
    [{ email: ADA, consent: 'yes' }, 'needs your agreement to be emailed'],
  ])('refuses %j with 422 and a reason', async (body, reason) => {
    const erp = erpThatAccepts();
    const { POST } = createWaitlistRoute({ webForm: FORM, app: 'App', fetch: erp });
    const answer = await POST(entry(body));
    expect(answer.status).toBe(422);
    expect(await detail(answer)).toContain(reason);
    expect(erp).not.toHaveBeenCalled();
  });
});

describe('createWaitlistRoute', () => {
  it('hands the lead to the ERP web form, form-encoded, and answers 202', async () => {
    const erp = erpThatAccepts();
    const { POST } = createWaitlistRoute({ webForm: FORM, app: 'App', enquiry: 'Accounts', fetch: erp });
    const answer = await POST(entry({ email: ADA, name: 'Ada' }));
    expect(answer.status).toBe(202);
    expect(erp).toHaveBeenCalledOnce();
    const [url, init] = erp.mock.calls[0] ?? [];
    expect(url).toBe(ACCEPT);
    expect(init?.method).toBe('POST');
    expect(init?.headers).toMatchObject({ 'Content-Type': 'application/x-www-form-urlencoded' });
    const form = sentForm(init);
    expect(form.get('web_form')).toBe(FORM);
    expect(JSON.parse(form.get('data') ?? '')).toMatchObject({
      doctype: 'CRM Lead',
      first_name: 'Ada',
      email: ADA,
      enquiry: ACCOUNTS_LINE,
    });
  });

  it('refuses an unusable entry with 422 and never calls the ERP', async () => {
    const erp = erpThatAccepts();
    const { POST } = createWaitlistRoute({ webForm: FORM, app: 'App', fetch: erp });
    const bad = await POST(entry({ email: 'nope' }));
    expect(bad.status).toBe(422);
    expect(await detail(bad)).toContain(BAD_EMAIL);
    const notJson = await POST(entry('{'));
    expect(notJson.status).toBe(422);
    expect(erp).not.toHaveBeenCalled();
  });

  it('holds one address to its entries an hour, and lets it in again after the hour', async () => {
    let clock = 0;
    const erp = erpThatAccepts();
    const { POST } = createWaitlistRoute({ webForm: FORM, app: 'App', perHour: 2, fetch: erp, now: () => clock });
    expect((await POST(entry({ email: 'a@example.com' }))).status).toBe(202);
    expect((await POST(entry({ email: 'b@example.com' }))).status).toBe(202);
    const third = await POST(entry({ email: THIRD }));
    expect(third.status).toBe(429);
    expect(await detail(third)).toContain('Try again in an hour');
    expect((await POST(entry({ email: THIRD }, '198.51.100.2'))).status).toBe(202);
    clock = 60 * 60 * 1000 + 1;
    expect((await POST(entry({ email: THIRD }))).status).toBe(202);
    expect(erp).toHaveBeenCalledTimes(4);
  });

  it('paces everyone together: a burst, then one sign-up per interval, whatever address each claims', async () => {
    let clock = 0;
    const erp = erpThatAccepts();
    const { POST } = createWaitlistRoute({
      webForm: FORM,
      app: 'App',
      pace: { burst: 2, everyMs: 1000 },
      fetch: erp,
      now: () => clock,
    });
    expect((await POST(entry({ email: ADA }, '192.0.2.1'))).status).toBe(202);
    expect((await POST(entry({ email: ADA }, '192.0.2.2'))).status).toBe(202);
    const crowded = await POST(entry({ email: ADA }, '192.0.2.3'));
    expect(crowded.status).toBe(429);
    expect(await detail(crowded)).toContain('Many people are joining');
    clock = 1000;
    expect((await POST(entry({ email: ADA }, '192.0.2.4'))).status).toBe(202);
    expect(erp).toHaveBeenCalledTimes(3);
  });

  it('records which offer a person waits for, only from the offers the route declares', async () => {
    const erp = erpThatAccepts();
    const interests = { full_report: 'Full report', group_seats: 'Group seats' };
    const { POST } = createWaitlistRoute({ webForm: FORM, app: '16 Worldviews', interests, fetch: erp });
    expect((await POST(entry({ email: ADA, interest: 'group_seats' }))).status).toBe(202);
    expect(leadSent(erp).enquiry).toBe('16 Worldviews waitlist: Group seats (group_seats)');
    expect((await POST(entry({ email: ADA }))).status).toBe(202);
    expect(leadSent(erp, 1).enquiry).toBe('16 Worldviews waitlist: joined from the website');
    const refused = await Promise.all(
      ['research_api', 'toString', 7].map(async (interest) => POST(entry({ email: ADA, interest }))),
    );
    expect(refused.map((answer) => answer.status)).toEqual([422, 422, 422]);
    for (const reason of await Promise.all(refused.map(detail))) {
      expect(reason).toContain('Choose one of the offers');
    }
    expect(erp).toHaveBeenCalledTimes(2);
  });

  it('writes a Boden-shaped lead: the line in wp_form_message, and no business', async () => {
    const erp = erpThatAccepts();
    const { POST } = createWaitlistRoute({
      webForm: 'waitlist-cule',
      app: 'Cule',
      enquiry: 'accounts',
      erpOrigin: 'https://erp.bodenresearch.com',
      messageField: 'wp_form_message',
      business: null,
      fetch: erp,
    });
    expect((await POST(entry({ email: ADA }))).status).toBe(202);
    expect(erp.mock.calls[0]?.[0]).toBe(
      'https://erp.bodenresearch.com/api/method/frappe.website.doctype.web_form.web_form.accept',
    );
    const lead = leadSent(erp);
    expect(lead.wp_form_message).toBe('Cule waitlist: accounts');
    expect(lead).not.toHaveProperty('enquiry');
    expect(lead).not.toHaveProperty('crm_business');
    expect(lead).toMatchObject({ source: WEBSITE, status: NEW, web_form_name: 'waitlist-cule' });
  });

  it('ignores an interest where the route declares none, as before', async () => {
    const erp = erpThatAccepts();
    const { POST } = createWaitlistRoute({ webForm: FORM, app: 'App', enquiry: 'Accounts', fetch: erp });
    expect((await POST(entry({ email: ADA, interest: 'anything' }))).status).toBe(202);
    expect(leadSent(erp).enquiry).toBe(ACCOUNTS_LINE);
  });

  it('reaches the ERP through the fetch in force at each request, so a later stub still catches it', async () => {
    const { POST } = createWaitlistRoute({ webForm: FORM, app: 'App' });
    const stub = vi.fn<typeof fetch>().mockResolvedValue(Response.json({ message: {} }));
    vi.stubGlobal('fetch', stub);
    try {
      expect((await POST(entry({ email: ADA }))).status).toBe(202);
      expect(stub).toHaveBeenCalledOnce();
    } finally {
      vi.unstubAllGlobals();
    }
  });

  it('answers 502 when the ERP refuses or cannot be reached', async () => {
    const refusing = createWaitlistRoute({
      webForm: FORM,
      app: 'App',
      fetch: vi.fn<typeof fetch>().mockResolvedValue(new Response('no', { status: 417 })),
    });
    const refused = await refusing.POST(entry({ email: ADA }));
    expect(refused.status).toBe(502);
    expect(await detail(refused)).toContain('could not be reached');

    const down = createWaitlistRoute({
      webForm: FORM,
      app: 'App',
      fetch: vi.fn<typeof fetch>().mockRejectedValue(new TypeError('fetch failed')),
    });
    expect((await down.POST(entry({ email: ADA }))).status).toBe(502);
  });
});

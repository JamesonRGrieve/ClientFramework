// SPDX-License-Identifier: AGPL-3.0-or-later
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { WAITLIST_PATH } from './waitlist';
import { WaitlistForm } from './WaitlistForm';

const EMAIL = 'Email';
const JOIN = 'Join the waitlist';
const ADA = 'ada@example.com';
const CONSENT = /Email me when it opens/;

function answering(status: number, body: object | string): ReturnType<typeof vi.fn<typeof fetch>> {
  const fake = vi.fn<typeof fetch>(() => Promise.resolve(Response.json(body, { status })));
  vi.stubGlobal('fetch', fake);
  return fake;
}

/** The body the form posted on its first call, as sent. */
function sentBody(fake: ReturnType<typeof vi.fn<typeof fetch>>): string {
  const body = fake.mock.calls[0]?.[1]?.body;
  return typeof body === 'string' ? body : '';
}

function renderForm(): void {
  render(
    <WaitlistForm title='Accounts are waitlist only for now' body='Leave your email and we’ll write when they open.' />,
  );
}

describe('WaitlistForm', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('names its region by its title, with a required email and an optional name', () => {
    renderForm();
    expect(screen.getByRole('region', { name: 'Accounts are waitlist only for now' })).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: EMAIL })).toBeRequired();
    expect(screen.getByRole('textbox', { name: 'Name (optional)' })).not.toBeRequired();
    expect(screen.getByRole('checkbox', { name: CONSENT })).toBeRequired();
    expect(screen.getByRole('link', { name: 'privacy policy' })).toHaveAttribute('href', '/docs/privacy');
  });

  it('posts the entry to the app’s waitlist route and says the person is on the list', async () => {
    const fake = answering(202, { ok: true });
    renderForm();
    await userEvent.type(screen.getByRole('textbox', { name: EMAIL }), ADA);
    await userEvent.type(screen.getByRole('textbox', { name: 'Name (optional)' }), 'Ada');
    await userEvent.click(screen.getByRole('checkbox', { name: CONSENT }));
    await userEvent.click(screen.getByRole('button', { name: JOIN }));
    expect(await screen.findByRole('status')).toHaveTextContent('We’ll write to ada@example.com');
    expect(fake).toHaveBeenCalledWith(WAITLIST_PATH, expect.objectContaining({ method: 'POST' }));
    expect(JSON.parse(sentBody(fake))).toEqual({ email: ADA, name: 'Ada', consent: true });
  });

  it('leaves out a blank name', async () => {
    const fake = answering(202, { ok: true });
    renderForm();
    await userEvent.type(screen.getByRole('textbox', { name: EMAIL }), ADA);
    await userEvent.click(screen.getByRole('checkbox', { name: CONSENT }));
    await userEvent.click(screen.getByRole('button', { name: JOIN }));
    await screen.findByRole('status');
    expect(JSON.parse(sentBody(fake))).toEqual({ email: ADA, consent: true });
  });

  it('shows the server’s reason when it refuses, and keeps the form', async () => {
    answering(429, { detail: { message: 'That is a lot of tries from one place. Try again in an hour.' } });
    renderForm();
    await userEvent.type(screen.getByRole('textbox', { name: EMAIL }), ADA);
    await userEvent.click(screen.getByRole('checkbox', { name: CONSENT }));
    await userEvent.click(screen.getByRole('button', { name: JOIN }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Try again in an hour');
    expect(screen.getByRole('textbox', { name: EMAIL })).toHaveValue(ADA);
  });

  it('says what went wrong when the answer has no reason', async () => {
    answering(500, 'oops');
    renderForm();
    await userEvent.type(screen.getByRole('textbox', { name: EMAIL }), ADA);
    await userEvent.click(screen.getByRole('checkbox', { name: CONSENT }));
    await userEvent.click(screen.getByRole('button', { name: JOIN }));
    expect(await screen.findByRole('alert')).toHaveTextContent('You could not be added to the waitlist');
  });
});

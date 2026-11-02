// SPDX-License-Identifier: AGPL-3.0-or-later
import { within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createElement } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ALEX_ID, agreementsFixture, emptyAgreementsStore, SAM_ID } from './agreements.mocks';
import { AgreementsPage, listed } from './AgreementsPage';
import { nth, renderAgreements } from './testing.mocks';

const PEOPLE = [
  { userId: ALEX_ID, name: 'Alex' },
  { userId: SAM_ID, name: 'Sam' },
];

describe('listed', () => {
  it('joins names the way a sentence does', () => {
    expect(listed([])).toBe('');
    expect(listed(['Alex'])).toBe('Alex');
    expect(listed(['Alex', 'Sam'])).toBe('Alex and Sam');
    expect(listed(['Alex', 'Sam', 'Jordan'])).toBe('Alex, Sam and Jordan');
  });
});

describe('AgreementsPage', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('shows where each agreement stands, its terms by kind, and who wrote them', async () => {
    const view = renderAgreements(createElement(AgreementsPage, { people: PEOPLE }));
    expect(await view.findByRole('status', { name: 'Where Us stands' })).toHaveTextContent(
      'Everyone has confirmed this version.',
    );
    expect(view.getByRole('status', { name: 'Where Household stands' })).toHaveTextContent('Waiting for Sam to confirm.');
    expect(view.getByRole('status', { name: 'Where Household stands' })).toHaveTextContent('Time to revisit it');
    const limits = view.getByRole('region', { name: 'Us: Limits' });
    expect(limits).toHaveTextContent('No sleepovers on work nights');
    expect(view.getByRole('region', { name: 'Us: Likes' })).toHaveTextContent('Written by Alex');
  });

  it('starts an agreement with the people chosen', async () => {
    const store = emptyAgreementsStore();
    const user = userEvent.setup();
    const view = renderAgreements(createElement(AgreementsPage, { people: PEOPLE }), store);
    await user.type(await view.findByLabelText('What to call it'), 'Us');
    await user.click(view.getByLabelText('Alex'));
    await user.click(view.getByRole('button', { name: 'Start the agreement' }));
    expect(await view.findByRole('heading', { name: 'Us', level: 2 })).toBeInTheDocument();
    expect(store.agreements[0]?.parties.map((p) => p.user_id)).toEqual(['user-me', ALEX_ID]);
  });

  it('asks everyone to confirm again after a term changes', async () => {
    const store = agreementsFixture();
    const user = userEvent.setup();
    const view = renderAgreements(createElement(AgreementsPage, { people: PEOPLE }), store);
    const add = await view.findByRole('form', { name: 'Add to Us' });
    await user.type(within(add).getByLabelText('New term'), 'Date nights on Fridays');
    await user.click(within(add).getByRole('button', { name: 'Add' }));
    const status = view.getByRole('status', { name: 'Where Us stands' });
    await vi.waitFor(() => {
      expect(status).toHaveTextContent('Waiting for You and Alex to confirm.');
    });
    await user.click(nth(view.getAllByRole('button', { name: 'Confirm this version' }), 0));
    await vi.waitFor(() => {
      expect(status).toHaveTextContent('Waiting for Alex to confirm.');
    });
  });

  it('rewords a term in place', async () => {
    const store = agreementsFixture();
    const user = userEvent.setup();
    const view = renderAgreements(createElement(AgreementsPage, { people: PEOPLE }), store);
    await user.click(await view.findByRole('button', { name: 'Change “No sleepovers on work nights”' }));
    const form = view.getByRole('form', { name: 'Change “No sleepovers on work nights”' });
    const wording = within(form).getByLabelText('Wording');
    await user.clear(wording);
    await user.type(wording, 'No sleepovers on Sundays');
    await user.click(within(form).getByRole('button', { name: 'Save' }));
    expect(await view.findByText('No sleepovers on Sundays')).toBeInTheDocument();
  });

  it('lets the owner add someone, and anyone else leave', async () => {
    const store = agreementsFixture();
    const user = userEvent.setup();
    const view = renderAgreements(createElement(AgreementsPage, { people: PEOPLE }), store);
    const toggles = await view.findAllByRole('button', { name: 'Date and people' });
    await user.click(nth(toggles, 1));
    await user.selectOptions(view.getByLabelText('Add someone'), 'Sam');
    await user.click(view.getByRole('button', { name: 'Add them' }));
    await vi.waitFor(() => {
      expect(store.agreements[0]?.parties.map((p) => p.user_id)).toContain(SAM_ID);
    });
    await user.click(nth(toggles, 0));
    await user.click(view.getByRole('button', { name: 'Leave it' }));
    await vi.waitFor(() => {
      expect(view.queryByRole('heading', { name: 'Household' })).not.toBeInTheDocument();
    });
  });

  it('wraps the start form, to offer a plan instead', async () => {
    const view = renderAgreements(
      createElement(AgreementsPage, { people: PEOPLE, wrapStart: () => 'Upgrade to start one' }),
      emptyAgreementsStore(),
    );
    expect(await view.findByText('Upgrade to start one')).toBeInTheDocument();
    expect(view.queryByRole('button', { name: 'Start the agreement' })).not.toBeInTheDocument();
    expect(await view.findByText('No agreements yet.')).toBeInTheDocument();
  });
});

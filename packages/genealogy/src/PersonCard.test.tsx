// SPDX-License-Identifier: AGPL-3.0-or-later
import { within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { polyculeFixture, type Store } from './genealogy.mocks';
import { type CardSection, PersonCard } from './PersonCard';
import { renderGenealogy } from './testing.mocks';

const SECTIONS: readonly CardSection[] = [
  {
    name: 'allergies',
    title: 'Allergies',
    fields: [
      { label: 'dietary', units: [] },
      { label: 'medical', units: [] },
    ],
  },
  { name: 'sizes', title: 'Sizes', fields: [{ label: 'ring', units: ['US', 'EU'] }], locked: true, feature: 'card_full' },
];

const VERSION = '2026-01-01T00:00:00';

function withCard(): Store {
  const store = polyculeFixture();
  store.attributes = [
    { id: 'a1', person_id: 'ben', category: 'allergies', label: 'dietary', value: 'peanuts', created_at: VERSION },
    { id: 'a2', person_id: 'ben', category: 'hobbies', label: 'climbing', value: 'weekly', created_at: VERSION },
  ];
  store.published = { ben: [{ id: 'p1', category: 'sizes', label: 'ring', value: '7', unit: 'US', created_at: VERSION }] };
  return store;
}

describe('PersonCard', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('shows notes by section, unknown ones under Other, and what was shared, read-only', async () => {
    const view = renderGenealogy(<PersonCard personId='ben' sections={SECTIONS} />, withCard());
    const allergies = await view.findByRole('region', { name: 'Allergies' });
    expect(allergies).toHaveTextContent('peanuts');
    expect(view.getByRole('region', { name: 'Other' })).toHaveTextContent('weekly');
    const shared = view.getByRole('region', { name: 'Shared with you' });
    expect(shared).toHaveTextContent('7 US');
    expect(within(shared).queryByRole('button')).toBeNull();
  });

  it('offers an upgrade, not new fields, in a locked section', async () => {
    const view = renderGenealogy(<PersonCard personId='ben' sections={SECTIONS} />, withCard());
    const sizes = await view.findByRole('region', { name: 'Sizes' });
    expect(within(sizes).getByRole('note', { name: 'Upgrade' })).toBeInTheDocument();
    expect(within(sizes).queryByRole('form')).toBeNull();
  });

  it('adds, edits and removes a fact, each write guarded by the version it was read at', async () => {
    const store = withCard();
    const user = userEvent.setup();
    const view = renderGenealogy(<PersonCard personId='ben' sections={SECTIONS} />, store);
    const allergies = await view.findByRole('region', { name: 'Allergies' });
    const form = within(allergies).getByRole('form', { name: 'Add to Allergies' });
    await user.selectOptions(within(form).getByLabelText('Field'), 'medical');
    await user.type(within(form).getByLabelText('Value'), 'penicillin');
    await user.click(within(form).getByRole('button', { name: 'Add' }));
    expect(await within(allergies).findByText('penicillin')).toBeInTheDocument();
    expect(store.attributes?.at(-1)).toMatchObject({ person_id: 'ben', category: 'allergies', label: 'medical' });

    await user.click(within(allergies).getByRole('button', { name: 'Edit Dietary' }));
    const value = within(allergies).getByLabelText('Dietary');
    await user.clear(value);
    await user.type(value, 'tree nuts');
    await user.click(within(allergies).getByRole('button', { name: 'Save' }));
    expect(await within(allergies).findByText('tree nuts')).toBeInTheDocument();

    await user.click(within(allergies).getByRole('button', { name: 'Remove Dietary' }));
    await vi.waitFor(() => {
      expect(store.attributes?.some((row) => row.value === 'tree nuts')).toBe(false);
    });
  });

  it('offers a field with choices as a list, when adding and when editing', async () => {
    const store = withCard();
    const user = userEvent.setup();
    const sections: readonly CardSection[] = [
      ...SECTIONS,
      { name: 'personality', title: 'Personality', fields: [{ label: 'MBTI', units: [], choices: ['INFJ', 'ENFP'] }] },
    ];
    const view = renderGenealogy(<PersonCard personId='ben' sections={sections} />, store);
    const personality = await view.findByRole('region', { name: 'Personality' });
    const value = within(personality).getByLabelText('Value');
    expect(value.tagName).toBe('SELECT');
    await user.selectOptions(value, 'INFJ');
    await user.click(within(personality).getByRole('button', { name: 'Add' }));
    expect(await within(personality).findByRole('listitem')).toHaveTextContent('INFJ');
    await user.click(within(personality).getByRole('button', { name: 'Edit MBTI' }));
    const editing = within(personality).getByLabelText('MBTI');
    expect(editing.tagName).toBe('SELECT');
    await user.selectOptions(editing, 'ENFP');
    await user.click(within(personality).getByRole('button', { name: 'Save' }));
    await vi.waitFor(() => {
      expect(within(personality).getByRole('listitem')).toHaveTextContent('ENFP');
    });
  });

  it('puts the app’s own controls beside each fact', async () => {
    const view = renderGenealogy(
      <PersonCard
        personId='ben'
        sections={SECTIONS}
        actions={(fact) => <button type='button'>Share {fact.label}</button>}
      />,
      withCard(),
    );
    const allergies = await view.findByRole('region', { name: 'Allergies' });
    expect(within(allergies).getByRole('button', { name: 'Share dietary' })).toBeInTheDocument();
  });
});

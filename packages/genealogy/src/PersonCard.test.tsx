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

  it('names the empty locked sections together in one upgrade, with no fields to add', async () => {
    const view = renderGenealogy(<PersonCard personId='ben' sections={SECTIONS} />, withCard());
    const locked = await view.findByRole('region', { name: 'Locked sections' });
    expect(within(locked).getByRole('note', { name: 'Upgrade' })).toHaveTextContent('A paid plan unlocks sizes.');
    expect(view.queryByRole('region', { name: 'Sizes' })).toBeNull();
    expect(within(locked).queryByRole('form')).toBeNull();
  });

  it('adds, edits and removes a fact, each write guarded by the version it was read at', async () => {
    const store = withCard();
    const user = userEvent.setup();
    const view = renderGenealogy(<PersonCard personId='ben' sections={SECTIONS} />, store);
    const allergies = await view.findByRole('region', { name: 'Allergies' });
    // A section with facts keeps its form behind a button, which opens on a field not yet filled.
    expect(within(allergies).queryByRole('form')).toBeNull();
    await user.click(within(allergies).getByRole('button', { name: '+ Add to allergies' }));
    const form = within(allergies).getByRole('form', { name: 'Add to Allergies' });
    expect(within(form).getByLabelText('Field')).toHaveValue('medical');
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

  it('takes a scaled field as a pole of each axis, with the strengths a result gives', async () => {
    const store = withCard();
    const user = userEvent.setup();
    const pole = (letter: string, name: string) => ({ letter, name });
    const sections: readonly CardSection[] = [
      ...SECTIONS,
      {
        name: 'personality',
        title: 'Personality',
        fields: [
          {
            label: 'MBTI',
            units: [],
            scales: [
              { poles: [pole('E', 'Extraversion'), pole('I', 'Introversion')] },
              { poles: [pole('S', 'Sensing'), pole('N', 'Intuition')] },
            ],
          },
        ],
      },
    ];
    const view = renderGenealogy(<PersonCard personId='ben' sections={sections} />, store);
    const personality = await view.findByRole('region', { name: 'Personality' });
    const mind = within(personality).getByRole('group', { name: 'Extraversion or Introversion' });
    const energy = within(personality).getByRole('group', { name: 'Sensing or Intuition' });
    await user.selectOptions(within(mind).getByRole('combobox'), 'I');
    await user.type(within(mind).getByRole('spinbutton'), '62');
    await user.selectOptions(within(energy).getByRole('combobox'), 'N');
    await user.click(within(personality).getByRole('button', { name: 'Add' }));
    expect(await within(personality).findByRole('listitem')).toHaveTextContent('IN (I 62%)');
    expect(store.attributes?.at(-1)).toMatchObject({ label: 'MBTI', value: 'IN (I 62%)' });
    // Editing starts from the stored value, read back onto the axes.
    await user.click(within(personality).getByRole('button', { name: 'Edit MBTI' }));
    const editMind = within(within(personality).getByRole('listitem')).getByRole('group', {
      name: 'Extraversion or Introversion',
    });
    expect(within(editMind).getByRole('combobox')).toHaveValue('I');
    expect(within(editMind).getByRole('spinbutton')).toHaveValue(62);
    await user.clear(within(editMind).getByRole('spinbutton'));
    await user.type(within(editMind).getByRole('spinbutton'), '30');
    expect(within(within(personality).getByRole('listitem')).getByRole('alert')).toHaveTextContent('from 50 to 100');
  });

  it('hides a sensitive section’s values until asked', async () => {
    const store = withCard();
    store.attributes = [
      ...(store.attributes ?? []),
      { id: 'c1', person_id: 'ben', category: 'codes', label: 'locker', value: '4321', created_at: VERSION },
    ];
    const user = userEvent.setup();
    const sections: readonly CardSection[] = [
      ...SECTIONS,
      { name: 'codes', title: 'Codes', fields: [{ label: 'locker', units: [] }], sensitive: true },
    ];
    const view = renderGenealogy(<PersonCard personId='ben' sections={sections} />, store);
    const codes = await view.findByRole('region', { name: 'Codes' });
    expect(codes).not.toHaveTextContent('4321');
    await user.click(within(codes).getByRole('button', { name: 'Show Locker' }));
    expect(codes).toHaveTextContent('4321');
    await user.click(within(codes).getByRole('button', { name: 'Hide Locker' }));
    expect(codes).not.toHaveTextContent('4321');
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

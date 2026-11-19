// SPDX-License-Identifier: AGPL-3.0-or-later
import { within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { familyFixture, personOf, polyculeFixture, type Store } from './genealogy.mocks';
import type { Person } from './genealogyApi';
import { type AppTie, FAMILY_TREE } from './options';
import { GenealogyOptionsProvider } from './OptionsProvider';
import { Relatives } from './Relatives';
import { SocialCircle } from './SocialCircle';
import { renderGenealogy } from './testing.mocks';

const ada = (store: Store): Person => personOf(store, 'ada');
const WILLIAM = 'William King';
const ADD_RELATIVE = 'Add relative';
const DYNAMIC: AppTie = {
  kind: 'dynamic',
  objectRelative: 'Sub',
  subjectRelative: 'Dom',
  details: ['dominant', 'master'],
  detailLabel: 'Dynamic',
};

type View = ReturnType<typeof renderGenealogy>;
type User = ReturnType<typeof userEvent.setup>;

/** A row as "Role (detail): Name": its name, then the role line under it. */
const lineOf = (item: HTMLElement): string =>
  `${item.querySelector('.text-xs.text-muted-foreground')?.textContent ?? ''}: ${item.querySelector('.font-medium')?.textContent ?? ''}`;

/** The add form: inline while nobody is recorded, otherwise in the dialog the header button opens. */
const openAdd = async (user: User, view: View): Promise<HTMLElement> => {
  const trigger = view.queryByRole('button', { name: /^Add (a relative|connection)$/ });
  if (trigger !== null && view.queryByRole('dialog') === null) {
    await user.click(trigger);
    return view.findByRole('dialog');
  }
  return view.container;
};

/** Chooses someone in the searchable person picker labelled `label`. */
const pickWho = async (user: User, form: HTMLElement, view: View, label: string, name: string): Promise<void> => {
  await user.click(within(form).getByRole('combobox', { name: label }));
  await user.click(await view.findByRole('option', { name }));
};

/** Presses the chip `chip` in the group named `group`. */
const pickChip = async (user: User, form: HTMLElement, group: string, chip: string): Promise<void> => {
  await user.click(within(within(form).getByRole('group', { name: group })).getByRole('button', { name: chip }));
};

describe('Relatives', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("lists Ana's partners and marks the one that has ended", async () => {
    const store = polyculeFixture();
    const view = renderGenealogy(<Relatives person={personOf(store, 'ana')} people={store.persons} />, store);
    const list = await view.findByRole('list', { name: 'Relatives' });
    const lines = within(list).getAllByRole('listitem').map(lineOf);
    expect(lines.sort()).toEqual(['Partner (dating, ended): Eli', 'Partner (nesting): Ben']);
  });

  it("lists Ada's parents, husband and children, her marriage once", async () => {
    const store = familyFixture();
    const view = renderGenealogy(<Relatives person={ada(store)} people={store.persons} />, store);
    const list = await view.findByRole('list', { name: 'Relatives' });
    const lines = within(list).getAllByRole('listitem').map(lineOf);
    expect(lines.sort()).toEqual(
      [
        'Child (biological): Byron King-Noel',
        'Child (biological): Anne Blunt',
        'Child (biological): Ralph King-Milbanke',
        'Parent (biological): George Gordon Byron',
        'Parent (biological): Anne Isabella Milbanke',
        `Partner (marriage): ${WILLIAM}`,
      ].sort(),
    );
    expect(within(list).getByRole('link', { name: WILLIAM })).toHaveAttribute('href', '/genealogy/william');
  });

  it('removes a partnership in both directions', async () => {
    const store = familyFixture();
    const user = userEvent.setup();
    const view = renderGenealogy(<Relatives person={ada(store)} people={store.persons} />, store);
    await user.click(await view.findByRole('button', { name: `Remove ${WILLIAM} as partner` }));
    await vi.waitFor(() => {
      expect(store.relationships.some((row) => row.kind === 'partnership')).toBe(false);
    });
    expect(await view.findByRole('list', { name: 'Relatives' })).not.toHaveTextContent(WILLIAM);
  });

  it("offers an app's own ties from both ends, and no parents without lineage", async () => {
    const store = polyculeFixture();
    const user = userEvent.setup();
    const ana = personOf(store, 'ana');
    const view = renderGenealogy(
      <GenealogyOptionsProvider options={{ ...FAMILY_TREE, lineage: false, gedcom: false, ties: [DYNAMIC] }}>
        <Relatives person={ana} people={store.persons} />
      </GenealogyOptionsProvider>,
      store,
    );
    await view.findByRole('list', { name: 'Connections' });
    const form = await openAdd(user, view);
    const offered = within(within(form).getByRole('group', { name: `Is ${ana.name ?? ''}’s` }))
      .getAllByRole('button')
      .map((option) => option.textContent);
    expect(offered).not.toContain('Parent');
    expect(offered).toEqual(expect.arrayContaining(['Partner', 'Sub', 'Dom']));
    await pickWho(user, form, view, 'Who', 'Ben');
    await pickChip(user, form, `Is ${ana.name ?? ''}’s`, 'Sub');
    await pickChip(user, form, 'Dynamic', 'master');
    await user.click(within(form).getByRole('button', { name: 'Add connection' }));
    expect(await view.findByText('Sub (master)')).toBeInTheDocument();
    expect(store.relationships.at(-1)).toMatchObject({
      person_id: 'ana',
      target_person_id: 'ben',
      kind: 'dynamic',
      discriminator: 'master',
    });
  });

  it('records when a tie began, both ways, for anniversaries', async () => {
    const store = polyculeFixture();
    const user = userEvent.setup();
    const ana = personOf(store, 'ana');
    const view = renderGenealogy(
      <GenealogyOptionsProvider options={{ ...FAMILY_TREE, lineage: false, gedcom: false }}>
        <Relatives person={ana} people={store.persons} />
      </GenealogyOptionsProvider>,
      store,
    );
    await view.findByRole('list', { name: 'Connections' });
    const form = await openAdd(user, view);
    await pickWho(user, form, view, 'Who', 'Fay');
    await user.type(within(form).getByLabelText('Since'), '2020-06-07');
    await user.click(within(form).getByRole('button', { name: 'Add connection' }));
    await vi.waitFor(() => {
      expect(store.relationships.slice(-2).map((row) => row.valid_from)).toEqual([
        '2020-06-07T00:00:00',
        '2020-06-07T00:00:00',
      ]);
    });
  });

  it('records a new relative, with the role the parent has', async () => {
    const store = familyFixture();
    const user = userEvent.setup();
    const view = renderGenealogy(<Relatives person={ada(store)} people={store.persons} />, store);
    await view.findByRole('list', { name: 'Relatives' });
    const form = await openAdd(user, view);
    await pickWho(user, form, view, 'Relative', WILLIAM);
    await pickChip(user, form, 'Is Ada Lovelace’s', 'Parent');
    await pickChip(user, form, 'Parent’s role', 'step');
    await user.click(within(form).getByRole('button', { name: ADD_RELATIVE }));
    expect(await view.findByText('Parent (step)')).toBeInTheDocument();
    expect(store.relationships.at(-1)).toMatchObject({
      person_id: 'william',
      target_person_id: 'ada',
      discriminator: 'step',
    });
  });

  it("redraws the person's circle once a new tie is recorded", async () => {
    const store = polyculeFixture();
    const user = userEvent.setup();
    const eli = personOf(store, 'eli');
    const view = renderGenealogy(
      <>
        <Relatives person={eli} people={store.persons} />
        <SocialCircle person={eli} people={store.persons} />
      </>,
      store,
    );
    expect(await view.findByText('No partners are recorded for Eli.')).toBeInTheDocument();
    const form = await openAdd(user, view);
    await pickWho(user, form, view, 'Relative', 'Fay');
    await pickChip(user, form, 'Is Eli’s', 'Partner');
    await user.click(within(form).getByRole('button', { name: ADD_RELATIVE }));
    expect(await view.findByRole('region', { name: 'Directly connected' })).toHaveTextContent('Fay');
  });

  it('adds someone not yet recorded by name, and ties them in the same step', async () => {
    const store = familyFixture();
    const before = store.persons.length;
    const user = userEvent.setup();
    const view = renderGenealogy(<Relatives person={ada(store)} people={store.persons} />, store);
    await view.findByRole('list', { name: 'Relatives' });
    const form = await openAdd(user, view);
    await pickWho(user, form, view, 'Relative', 'Someone new…');
    await user.click(within(form).getByRole('button', { name: ADD_RELATIVE }));
    expect(within(form).getByRole('alert')).toHaveTextContent('Give their name.');
    await user.type(within(form).getByLabelText('Their name'), 'Mary Somerville');
    await pickChip(user, form, 'Is Ada Lovelace’s', 'Friend');
    await user.click(within(form).getByRole('button', { name: ADD_RELATIVE }));
    await vi.waitFor(() => {
      expect(store.persons).toHaveLength(before + 1);
    });
    const mary = store.persons.at(-1);
    expect(mary).toMatchObject({ name: 'Mary Somerville' });
    expect(store.relationships.some((row) => row.target_person_id === mary?.id || row.person_id === mary?.id)).toBe(true);
  });

  it('asks who the relative is before recording one', async () => {
    const store = familyFixture();
    const user = userEvent.setup();
    const view = renderGenealogy(<Relatives person={ada(store)} people={store.persons} />, store);
    await view.findByRole('list', { name: 'Relatives' });
    const form = await openAdd(user, view);
    await user.click(within(form).getByRole('button', { name: ADD_RELATIVE }));
    expect(within(form).getByRole('alert')).toHaveTextContent('Choose who the relative is.');
  });
});

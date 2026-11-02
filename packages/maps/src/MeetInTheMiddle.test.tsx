// SPDX-License-Identifier: AGPL-3.0-or-later
import { within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { mapsFixture } from './maps.mocks';
import { MeetInTheMiddle } from './MeetInTheMiddle';
import { renderMaps } from './testing.mocks';

const ALEX = 'Alex’s place';
const SAM = 'Sam’s place';
const PICK = 'Add someone’s place';
const TYPE = 'Or type an address';
const THERE = { name: 'Getting there' };
const KNOWN = [
  { label: ALEX, location: '53.5461,-113.4938' },
  { label: SAM, location: '51.0447,-114.0719' },
];
const FIND = { name: 'Find the middle' };
const PLACES = { name: 'Places to meet' };

describe('MeetInTheMiddle', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('finds the middle of two known places, everyone’s way there and places to meet', async () => {
    const store = mapsFixture();
    const user = userEvent.setup();
    const view = renderMaps(<MeetInTheMiddle known={KNOWN} />, store);
    const pick = view.getByLabelText(PICK);
    await user.selectOptions(pick, ALEX);
    await user.selectOptions(view.getByLabelText(PICK), SAM);
    expect(view.queryByLabelText(PICK)).toBeNull();
    await user.click(view.getByRole('button', FIND));
    const there = await view.findByRole('list', THERE);
    const legs = within(there).getAllByRole('listitem');
    expect(legs[0]).toHaveTextContent(ALEX);
    expect(legs[0]).toHaveTextContent('20 min by car (30.0 km)');
    expect(legs[1]).toHaveTextContent('40 min by car');
    expect(view.getByText('The longest journey is 20 min longer than the shortest.')).toBeInTheDocument();
    expect(view.getByRole('list', PLACES)).toHaveTextContent('The Halfway House');
    expect(store.asked).toEqual([
      { locations: ['53.5461,-113.4938', '51.0447,-114.0719'], mode: 'driving', category: 'restaurant' },
    ]);
  });

  it('takes typed addresses, a way of travelling and just the middle', async () => {
    const store = mapsFixture();
    const user = userEvent.setup();
    const view = renderMaps(<MeetInTheMiddle />, store);
    expect(view.getByRole('button', FIND)).toBeDisabled();
    await user.type(view.getByLabelText(TYPE), 'Edmonton{Enter}');
    await user.type(view.getByLabelText(TYPE), 'Calgary');
    await user.click(view.getByRole('button', { name: 'Add' }));
    await user.selectOptions(view.getByLabelText('Travelling'), 'Walking');
    await view.findByRole('option', { name: 'Cafés' });
    await user.selectOptions(view.getByLabelText('Places to meet'), 'Just the middle');
    await user.click(view.getByRole('button', FIND));
    expect(await view.findByRole('list', THERE)).toHaveTextContent('20 min on foot');
    expect(view.queryByRole('list', PLACES)).toBeNull();
    expect(store.asked).toEqual([{ locations: ['Edmonton', 'Calgary'], mode: 'walking', category: null }]);
  });

  it('removes a place', async () => {
    const user = userEvent.setup();
    const view = renderMaps(<MeetInTheMiddle known={KNOWN} />);
    await user.selectOptions(view.getByLabelText(PICK), ALEX);
    await user.click(view.getByRole('button', { name: 'Remove Alex’s place' }));
    expect(view.getByText('Add at least two places.')).toBeInTheDocument();
  });

  it('says when no route reaches the middle', async () => {
    const user = userEvent.setup();
    const view = renderMaps(<MeetInTheMiddle known={KNOWN} />, { ...mapsFixture(), routed: false });
    await user.selectOptions(view.getByLabelText(PICK), ALEX);
    await user.selectOptions(view.getByLabelText(PICK), SAM);
    await user.click(view.getByRole('button', FIND));
    expect(await view.findByRole('list', THERE)).toHaveTextContent('No route found; 140.0 km in a straight line');
    expect(view.queryByText(/The longest journey/)).toBeNull();
  });

  it('says when the map does not know a place', async () => {
    const user = userEvent.setup();
    const view = renderMaps(<MeetInTheMiddle />);
    await user.type(view.getByLabelText(TYPE), 'Nowhere{Enter}');
    await user.type(view.getByLabelText(TYPE), 'Calgary{Enter}');
    await user.click(view.getByRole('button', FIND));
    expect(await view.findByRole('alert')).toHaveTextContent('No place found');
  });

  it('credits OpenStreetMap', () => {
    const view = renderMaps(<MeetInTheMiddle />);
    expect(view.getByRole('link', { name: 'OpenStreetMap' })).toHaveAttribute(
      'href',
      'https://www.openstreetmap.org/copyright',
    );
  });
});

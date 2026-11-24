// SPDX-License-Identifier: AGPL-3.0-or-later
import { afterEach, describe, expect, it, vi } from 'vitest';
import { personTone, personToneClass } from 'zephyrex/ui/person-tone';
import { familyFixture } from './genealogy.mocks';
import { renderGenealogy } from './testing.mocks';
import { usePersonColor } from './usePersonColor';

const IDS = familyFixture().persons.map((person) => person.id);

function Colours({ ids }: { ids: readonly string[] }): React.JSX.Element {
  const colorOf = usePersonColor();
  return (
    <ul>
      {ids.map((id) => (
        <li key={id}>{colorOf(id)}</li>
      ))}
    </ul>
  );
}

const shown = (container: HTMLElement): (string | null)[] =>
  [...container.querySelectorAll('li')].map((item) => item.textContent);

describe('usePersonColor', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('gives everyone in a tree of up to eight a colour of their own, the same whatever the order', async () => {
    const view = renderGenealogy(<Colours ids={IDS} />);
    // Once the tree has loaded, no two people share a colour.
    await vi.waitFor(() => {
      expect(new Set(shown(view.container)).size).toBe(IDS.length);
    });
    const first = shown(view.container);
    view.unmount();
    // Listed the other way round, each person still gets the same colour.
    const reversed = renderGenealogy(<Colours ids={[...IDS].reverse()} />);
    await vi.waitFor(() => {
      expect(shown(reversed.container).reverse()).toEqual(first);
    });
  });

  it('keeps their own colour for someone not in the tree', () => {
    const view = renderGenealogy(<Colours ids={['stranger']} />);
    expect(view.container.querySelector('li')).toHaveTextContent(personToneClass(personTone('stranger')));
  });
});

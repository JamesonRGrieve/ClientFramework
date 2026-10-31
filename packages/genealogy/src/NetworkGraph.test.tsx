// SPDX-License-Identifier: AGPL-3.0-or-later
import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { TestWrapper } from 'zephyrex/testing';
import type { Network } from './genealogyApi';
import { polyculeFixture } from './genealogy.mocks';
import { aspectOf, NetworkGraph } from './NetworkGraph';
import { fromNetwork, NODE_HEIGHT, NODE_WIDTH, type PersonNode } from './socialLayout';

const store = polyculeFixture();

const network: Network = {
  person_id: 'ana',
  kinds: ['partnership', 'friendship'],
  members: [
    { person_id: 'ben', distance: 1 },
    { person_id: 'fay', distance: 2 },
  ],
  ties: [
    { person_id: 'ana', target_person_id: 'ben', kind: 'partnership', discriminator: 'nesting', directed: false },
    { person_id: 'ben', target_person_id: 'fay', kind: 'friendship', discriminator: 'best_friend', directed: false },
  ],
};

describe('NetworkGraph', () => {
  it('draws everyone in the network, the person marked, behind an accessible legend', () => {
    const view = render(
      <TestWrapper>
        <NetworkGraph graph={fromNetwork(network, new Map(store.persons.map((person) => [person.id, person])))} />
      </TestWrapper>,
    );
    const nodes = view.container.querySelectorAll('.genealogy-node');
    expect([...nodes].map((node) => node.textContent)).toEqual(['Ana', 'Ben', 'Fay']);
    expect(view.container.querySelector('.genealogy-node--focus')).toHaveTextContent('Ana');
    // The canvas is a picture of the lists beside it; the legend names the kinds drawn.
    expect(view.container.querySelector('.genealogy-network__canvas')).toHaveAttribute('aria-hidden', 'true');
    expect(view.getByText('Partners')).toBeInTheDocument();
    expect(view.getByText('Friends')).toBeInTheDocument();
    expect(view.queryByText('Siblings')).toBeNull();
  });
});

describe('aspectOf', () => {
  const at = (x: number, y: number): PersonNode => ({
    id: `${String(x)},${String(y)}`,
    position: { x, y },
    data: { label: '', focus: false },
  });

  it('is the width over the height of the box round the people', () => {
    expect(aspectOf([at(0, 0), at(400, 60)])).toBeCloseTo((400 + NODE_WIDTH) / (60 + NODE_HEIGHT));
  });

  it('is square with nobody to draw', () => {
    expect(aspectOf([])).toBe(1);
  });
});

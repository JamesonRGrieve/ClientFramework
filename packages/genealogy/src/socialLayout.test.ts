// SPDX-License-Identifier: AGPL-3.0-or-later
import { describe, expect, it } from 'vitest';
import type { Network } from './genealogyApi';
import { personOf, polyculeFixture } from './genealogy.mocks';
import {
  alignTo,
  borderPoint,
  fromNetwork,
  type GraphInput,
  type GraphPerson,
  mergedTies,
  NODE_HEIGHT,
  NODE_WIDTH,
  RING_GAP,
  socialLayout,
} from './socialLayout';

const store = polyculeFixture();
const people = new Map(store.persons.map((person) => [person.id, person]));

const tie = (a: string, b: string, kind: string, discriminator: string | null = null): Network['ties'][number] => ({
  person_id: a,
  target_person_id: b,
  kind,
  discriminator,
  directed: false,
});

/** Each node's centre, by id, rounded to whole flow units. */
const centres = (network: Network): Record<string, [number, number]> =>
  Object.fromEntries(
    socialLayout(fromNetwork(network, people)).nodes.map((node) => [
      node.id,
      // + 0 turns -0 into 0, so a point on an axis compares equal.
      [Math.round(node.position.x + NODE_WIDTH / 2) + 0, Math.round(node.position.y + NODE_HEIGHT / 2) + 0],
    ]),
  );

const distanceBetween = (a: [number, number] | undefined, b: [number, number] | undefined): number =>
  a === undefined || b === undefined ? Number.NaN : Math.hypot(a[0] - b[0], a[1] - b[1]);

const polycule: Network = {
  person_id: 'ana',
  kinds: ['partnership', 'friendship'],
  members: [
    { person_id: 'ben', distance: 1 },
    { person_id: 'cleo', distance: 2 },
    { person_id: 'fay', distance: 2 },
    { person_id: 'dev', distance: 3 },
  ],
  ties: [
    tie('ana', 'ben', 'partnership', 'nesting'),
    tie('ben', 'cleo', 'partnership', 'dating'),
    tie('ben', 'fay', 'friendship', 'best_friend'),
    tie('cleo', 'dev', 'partnership', 'anchor'),
    tie('dev', 'fay', 'friendship'),
  ],
};

describe('socialLayout', () => {
  it('pins the person at the centre', () => {
    expect(centres(polycule)['ana']).toEqual([0, 0]);
  });

  it('keeps nearer people nearer the centre', () => {
    const placed = centres(polycule);
    const fromAna = (id: string): number => distanceBetween(placed['ana'], placed[id]);
    expect(fromAna('ben')).toBeLessThan(fromAna('cleo'));
    expect(fromAna('cleo')).toBeLessThan(fromAna('dev'));
  });

  it('never lets two people overlap, so every name stays readable', () => {
    const placed = Object.values(centres(polycule));
    for (const [index, a] of placed.entries()) {
      for (const b of placed.slice(index + 1)) {
        const apart = Math.abs(a[0] - b[0]) >= NODE_WIDTH || Math.abs(a[1] - b[1]) >= NODE_HEIGHT;
        expect(apart).toBe(true);
      }
    }
  });

  it('does not lay a chain out as a straight line through the centre', () => {
    const placed = centres(polycule);
    const xs = new Set(Object.values(placed).map(([x]) => x));
    expect(xs.size).toBeGreaterThan(2);
  });

  it('bends a pure chain of partners instead of stacking it on one line', () => {
    // Sam's polycule: theo ═ morgan ═ jordan ═ sam ═ alex ═ priya ═ riley.
    const chain = ['theo', 'morgan', 'jordan', 'sam', 'alex', 'priya', 'riley'];
    const network: Network = {
      person_id: 'sam',
      kinds: ['partnership'],
      members: [
        { person_id: 'jordan', distance: 1 },
        { person_id: 'alex', distance: 1 },
        { person_id: 'morgan', distance: 2 },
        { person_id: 'priya', distance: 2 },
        { person_id: 'theo', distance: 3 },
        { person_id: 'riley', distance: 3 },
      ],
      ties: chain.slice(1).map((id, index) => tie(chain[index] ?? '', id, 'partnership')),
    };
    const placed = Object.values(centres(network));
    const width = Math.max(...placed.map(([x]) => x)) - Math.min(...placed.map(([x]) => x));
    const height = Math.max(...placed.map(([, y]) => y)) - Math.min(...placed.map(([, y]) => y));
    expect(Math.min(width, height) / Math.max(width, height)).toBeGreaterThan(0.4);
  });

  it('lays the same network out the same way every time', () => {
    expect(centres(polycule)).toEqual(centres(polycule));
  });

  it('starts a ring evenly spread from the top', () => {
    // With no ties to pull them, the four only push apart, keeping their starting order round the circle.
    const network: Network = {
      person_id: 'ben',
      kinds: ['partnership', 'friendship'],
      members: ['ana', 'cleo', 'fay', 'dev'].map((id) => ({ person_id: id, distance: 1 })),
      ties: [],
    };
    const placed = centres(network);
    const angle = (id: string): number => {
      const point = Object.entries(placed).find(([placedId]) => placedId === id)?.[1];
      if (point === undefined) {
        throw new Error(`${id} was not placed`);
      }
      return Math.atan2(point[1], point[0]);
    };
    expect(angle('ana')).toBeLessThan(angle('cleo'));
    expect(angle('cleo')).toBeLessThan(angle('fay'));
    expect(RING_GAP).toBeGreaterThan(NODE_WIDTH);
  });

  it('names each node, marks the person, and classes each tie by kind with its subkind as the label', () => {
    const network: Network = {
      person_id: 'ben',
      kinds: ['friendship'],
      members: [{ person_id: 'fay', distance: 1 }],
      ties: [tie('ben', 'fay', 'friendship', 'best_friend')],
    };
    const { nodes, edges } = socialLayout(fromNetwork(network, people));
    expect(nodes.map((node) => [node.data.label, node.data.focus])).toEqual([
      [personOf(store, 'ben').name, true],
      [personOf(store, 'fay').name, false],
    ]);
    expect(edges).toEqual([
      expect.objectContaining({
        source: 'ben',
        target: 'fay',
        label: 'best friend',
        className: 'genealogy-tie genealogy-tie--friendship',
      }),
    ]);
  });

  it('sends each group off the centre in its own direction', () => {
    // Three polycules round "me": each group's members end up on their own side.
    const person = (id: string, distance: number, group: number): GraphPerson => ({ id, label: id, distance, group });
    const input: GraphInput = {
      center: { id: 'me', label: 'Me', distance: 0 },
      people: [
        person('a1', 1, 0),
        person('a2', 2, 0),
        person('b1', 1, 1),
        person('b2', 2, 1),
        person('c1', 1, 2),
        person('c2', 2, 2),
      ],
      ties: [
        { source: 'me', target: 'a1', kind: 'partnership', discriminator: null },
        { source: 'a1', target: 'a2', kind: 'partnership', discriminator: null },
        { source: 'me', target: 'b1', kind: 'partnership', discriminator: null },
        { source: 'b1', target: 'b2', kind: 'partnership', discriminator: null },
        { source: 'me', target: 'c1', kind: 'partnership', discriminator: null },
        { source: 'c1', target: 'c2', kind: 'partnership', discriminator: null },
      ],
    };
    const centre = new Map(
      socialLayout(input).nodes.map((node) => [
        node.id,
        [node.position.x + NODE_WIDTH / 2, node.position.y + NODE_HEIGHT / 2],
      ]),
    );
    const point = (id: string): number[] => {
      const found = centre.get(id);
      if (found === undefined) {
        throw new Error(`${id} was not placed`);
      }
      return found;
    };
    const direction = (ids: string[]): number => {
      const x = ids.reduce((sum, id) => sum + (point(id)[0] ?? 0), 0);
      const y = ids.reduce((sum, id) => sum + (point(id)[1] ?? 0), 0);
      return Math.atan2(y, x);
    };
    const directions = [direction(['a1', 'a2']), direction(['b1', 'b2']), direction(['c1', 'c2'])];
    const apart = (a: number, b: number): number => Math.abs(Math.atan2(Math.sin(a - b), Math.cos(a - b)));
    const MIN_SEPARATION = Math.PI / 3;
    for (const [index, a] of directions.entries()) {
      for (const b of directions.slice(index + 1)) {
        expect(apart(a, b)).toBeGreaterThan(MIN_SEPARATION);
      }
    }
  });

  it('ends a directed tie in an arrow', () => {
    const { edges } = socialLayout({
      center: { id: 'dana', label: 'Dana', distance: 0 },
      people: [{ id: 'casey', label: 'Casey', distance: 1 }],
      ties: [{ source: 'dana', target: 'casey', kind: 'mentorship', discriminator: 'mentor', directed: true }],
    });
    expect(edges[0]?.markerEnd).toEqual({ type: 'arrowclosed' });
  });
});

describe('mergedTies', () => {
  it('draws two ties between the same pair as one line, from the directed one, labelled with both', () => {
    expect(
      mergedTies([
        { source: 'morgan', target: 'theo', kind: 'partnership', discriminator: 'comet' },
        { source: 'theo', target: 'morgan', kind: 'partnership', discriminator: 'comet' },
        { source: 'morgan', target: 'theo', kind: 'dynamic', discriminator: 'dominant', directed: true },
      ]),
    ).toEqual([
      {
        source: 'morgan',
        target: 'theo',
        kinds: ['partnership', 'dynamic'],
        labels: ['comet', 'dominant'],
        directed: true,
      },
    ]);
  });

  it('labels the symmetric tie before the directed one, whichever came first', () => {
    const lines = mergedTies([
      { source: 'jordan', target: 'morgan', kind: 'dynamic', discriminator: 'dominant', directed: true },
      { source: 'jordan', target: 'morgan', kind: 'partnership', discriminator: 'nesting' },
    ]);
    expect(lines.map((line) => line.labels)).toEqual([['nesting', 'dominant']]);
  });
});

describe('socialLayout spacing', () => {
  it('leaves room for a long label between the boxes it joins', () => {
    const input: GraphInput = {
      center: { id: 'jordan', label: 'Jordan', distance: 0 },
      people: [{ id: 'morgan', label: 'Morgan', distance: 1 }],
      ties: [
        { source: 'jordan', target: 'morgan', kind: 'partnership', discriminator: 'nesting' },
        { source: 'jordan', target: 'morgan', kind: 'dynamic', discriminator: 'dominant', directed: true },
      ],
    };
    const at = new Map(socialLayout(input).nodes.map((node) => [node.id, node.position]));
    const jordan = at.get('jordan') ?? { x: 0, y: 0 };
    const morgan = at.get('morgan') ?? { x: 0, y: 0 };
    const apart = Math.hypot(morgan.x - jordan.x, morgan.y - jordan.y);
    // 'nesting · dominant' is 18 characters at about 7 units each, between two boxes' halves.
    expect(apart).toBeGreaterThan(NODE_WIDTH + 18 * 7);
  });
});

describe('borderPoint', () => {
  it('leaves a box at its side or its top, whichever the line crosses first', () => {
    expect(borderPoint({ x: 0, y: 0 }, { x: 500, y: 0 })).toEqual({ x: NODE_WIDTH / 2, y: 0 });
    expect(borderPoint({ x: 0, y: 0 }, { x: 0, y: -500 })).toEqual({ x: 0, y: -NODE_HEIGHT / 2 });
    expect(borderPoint({ x: 3, y: 4 }, { x: 3, y: 4 })).toEqual({ x: 3, y: 4 });
  });
});

describe('alignTo', () => {
  // A diagonal chain through the centre, as a two-polycule network often settles.
  const diagonal = new Map([
    ['me', { x: 0, y: 0 }],
    ['a', { x: -100, y: -100 }],
    ['b', { x: -200, y: -200 }],
    ['c', { x: 100, y: 100 }],
    ['d', { x: 200, y: 210 }],
  ]);
  const spread = (positions: Map<string, { x: number; y: number }>, axis: 'x' | 'y'): number =>
    Math.max(...[...positions.values()].map((point) => point[axis])) -
    Math.min(...[...positions.values()].map((point) => point[axis]));

  it('lays a long network along a wide box', () => {
    const aligned = alignTo(diagonal, 'landscape');
    expect(spread(aligned, 'x')).toBeGreaterThan(spread(aligned, 'y') * 5);
  });

  it('and down a tall one', () => {
    const aligned = alignTo(diagonal, 'portrait');
    expect(spread(aligned, 'y')).toBeGreaterThan(spread(aligned, 'x') * 5);
  });

  it('turns about the centre person without mirroring', () => {
    const aligned = alignTo(diagonal, 'landscape');
    expect(aligned.get('me')?.x).toBeCloseTo(0);
    expect(aligned.get('me')?.y).toBeCloseTo(0);
    // a and c stay on opposite sides, b beyond a and d beyond c.
    const x = (id: string): number => aligned.get(id)?.x ?? Number.NaN;
    expect(Math.sign(x('a'))).toBe(-Math.sign(x('c')));
    expect(Math.abs(x('b'))).toBeGreaterThan(Math.abs(x('a')));
    expect(Math.abs(x('d'))).toBeGreaterThan(Math.abs(x('c')));
  });

  it('leaves a roughly round network as it is', () => {
    const round = new Map([
      ['me', { x: 0, y: 0 }],
      ['n', { x: 0, y: -100 }],
      ['e', { x: 100, y: 0 }],
      ['s', { x: 0, y: 100 }],
      ['w', { x: -100, y: 0 }],
    ]);
    expect(alignTo(round, 'portrait')).toEqual(round);
  });
});

describe('socialLayout on a tall box', () => {
  it('runs the network top to bottom, and a wide one side to side', () => {
    const chain: Network = {
      person_id: 'ana',
      kinds: ['partnership'],
      members: ['ben', 'cleo', 'dev'].map((id, index) => ({ person_id: id, distance: index + 1 })),
      ties: [tie('ana', 'ben', 'partnership'), tie('ben', 'cleo', 'partnership'), tie('cleo', 'dev', 'partnership')],
    };
    const spread = (nodes: { position: { x: number; y: number } }[], axis: 'x' | 'y'): number =>
      Math.max(...nodes.map((node) => node.position[axis])) - Math.min(...nodes.map((node) => node.position[axis]));
    const tall = socialLayout(fromNetwork(chain, people), 'portrait').nodes;
    const wide = socialLayout(fromNetwork(chain, people), 'landscape').nodes;
    expect(spread(tall, 'y')).toBeGreaterThan(spread(tall, 'x'));
    expect(spread(wide, 'x')).toBeGreaterThan(spread(wide, 'y'));
  });
});

// SPDX-License-Identifier: AGPL-3.0-or-later
import { type Edge, type Node as FlowNode, MarkerType } from '@xyflow/react';
import {
  forceCollide,
  forceLink,
  forceManyBody,
  forceSimulation,
  forceX,
  forceY,
  type SimulationLinkDatum,
  type SimulationNodeDatum,
} from 'd3-force';
import type { LinkedNetwork, Network, Person } from './genealogyApi';
import { personName } from './people';
import { personPath } from './routes';

/** How far apart the rings the layout starts from are, in flow units. */
export const RING_GAP = 190;
/** The node box, centred on its point, so distances measure from node centres. */
export const NODE_WIDTH = 132;
export const NODE_HEIGHT = 40;
// The force layout: ties pull to TIE_LENGTH, everyone repels, no two boxes overlap.
const TIE_LENGTH = 170;
/** A tie label's width per character, at the graph's label size, in flow units. */
const LABEL_CHAR_WIDTH = 7;
/** Clear line left either side of a tie's label, so the line still shows between the boxes. */
const LABEL_ROOM = 16;
const REPULSION = -900;
// A little over half a node's width, so two boxes side by side keep a gap.
const COLLISION_RADIUS_RATIO = 0.62;
const COLLISION_RADIUS = NODE_WIDTH * COLLISION_RADIUS_RATIO;
const CENTRING = 0.04;
// How hard each group is drawn toward its own direction, so groups stay apart.
const GROUP_PULL = 0.12;
// The share of a group's sector its members start spread across, leaving a gap between groups.
const SECTOR_FILL = 0.7;
// Enough ticks for a few dozen people to settle; run once, synchronously, so the layout is fixed.
const SETTLE_TICKS = 300;
// The first member sits straight above the person; later rings follow their neighbours round.
const FIRST_ANGLE = -Math.PI / 2;
const FULL_TURN = 2 * Math.PI;
// Each ring starts turned a little further than the one inside it. Without the turn a chain (a
// partner's partner's partner) starts on one straight axis, and the forces, all along that axis,
// never bend it.
const RING_TWIST = 0.6;
// Grouped, each group's members curl a little further round with each step out, so a chain
// of partners within a polycule bends instead of running out in a straight line.
const GROUP_CURL = 0.35;
const SOMEONE = 'Someone';

/** One person to draw: how far they are from the centre, and which group (polycule) they are in. */
export interface GraphPerson {
  id: string;
  label: string;
  distance: number;
  /** Their group, when the graph is grouped: each group branches off the centre on its own. */
  group?: number | null | undefined;
  /** Their page, when there is one to open. */
  href?: string | undefined;
}

/** One tie to draw; a directed one runs from `source` (its subject) and ends in an arrow. */
export interface GraphTie {
  source: string;
  target: string;
  kind: string;
  discriminator: string | null;
  directed?: boolean | undefined;
}

/** What the graph draws: the person at the centre, everyone else, and the ties among them. */
export interface GraphInput {
  center: GraphPerson;
  people: GraphPerson[];
  ties: GraphTie[];
}

/** A network walk as graph input, each person named from `people` and linking to their page. */
export function fromNetwork(network: Network, people: ReadonlyMap<string, Person>): GraphInput {
  const person = (id: string, distance: number): GraphPerson => ({
    id,
    label: personName(people.get(id)),
    distance,
    href: personPath(id),
  });
  return {
    center: person(network.person_id, 0),
    people: network.members.map((member) => person(member.person_id, member.distance)),
    ties: network.ties.map((tie) => ({
      source: tie.person_id,
      target: tie.target_person_id,
      kind: tie.kind,
      discriminator: tie.discriminator,
      directed: tie.directed,
    })),
  };
}

/**
 * A merged network as graph input, grouped by polycule. Anyone shown anonymously is "Someone";
 * only the requester's own records link to a page.
 */
export function fromLinkedNetwork(linked: LinkedNetwork): GraphInput {
  const person = (node: LinkedNetwork['nodes'][number]): GraphPerson => ({
    id: node.key,
    label: node.name ?? SOMEONE,
    distance: node.distance,
    group: node.group,
    href: node.person_id === null ? undefined : personPath(node.person_id),
  });
  const center = linked.nodes.find((node) => node.key === linked.center);
  if (center === undefined) {
    throw new Error('The merged network does not include its own centre');
  }
  return {
    center: person(center),
    people: linked.nodes.filter((node) => node.key !== linked.center).map(person),
    ties: linked.ties.map((tie) => ({ ...tie })),
  };
}

interface PersonNodeData extends Record<string, unknown> {
  label: string;
  /** The person whose network this is, drawn at the centre. */
  focus: boolean;
  href?: string | undefined;
}

export type PersonNode = FlowNode<PersonNodeData>;

/** A network laid out round its person, who sits at the centre. */
export interface SocialLayout {
  nodes: PersonNode[];
  edges: Edge[];
}

interface Point extends SimulationNodeDatum {
  id: string;
}

export interface Placed {
  x: number;
  y: number;
}

const angleOf = (index: number, count: number): number => FIRST_ANGLE + (FULL_TURN * index) / count;

/** The mean of `angles` as a direction, so neighbours either side of the top average to the top. */
function meanAngle(angles: readonly number[]): number {
  const x = angles.reduce((sum, angle) => sum + Math.cos(angle), 0);
  const y = angles.reduce((sum, angle) => sum + Math.sin(angle), 0);
  return Math.atan2(y, x);
}

/**
 * The direction group `group` of `groups` branches off in: the groups share the circle evenly,
 * offset half a share from the top so two groups sit side by side, suiting a wide screen.
 */
const sectorOf = (group: number, groups: number): number => FIRST_ANGLE + (FULL_TURN * (group + 1 / 2)) / groups;

/** Where a grouped person is drawn toward: out along their group's direction, curling with distance. */
const homeOf = (person: GraphPerson, groups: number): Placed => {
  const angle = sectorOf(person.group ?? 0, groups) + (person.distance - 1) * GROUP_CURL;
  return { x: person.distance * RING_GAP * Math.cos(angle), y: person.distance * RING_GAP * Math.sin(angle) };
};

/** Clockwise from the top, as `angleOf` places them. */
const fromTop = (angle: number): number => (((angle - FIRST_ANGLE) % FULL_TURN) + FULL_TURN) % FULL_TURN;

/**
 * Ungrouped: everyone starts on the ring for their distance, each ring after the first ordered
 * by where its members' ties to the ring inside sit (so ties start out running outward).
 */
function ringStart(input: GraphInput, neighbours: ReadonlyMap<string, string[]>): Map<string, Placed> {
  const angles = new Map<string, number>([[input.center.id, FIRST_ANGLE]]);
  const rings = new Map<number, string[]>();
  for (const person of input.people) {
    rings.set(person.distance, [...(rings.get(person.distance) ?? []), person.id]);
  }
  const positions = new Map<string, Placed>([[input.center.id, { x: 0, y: 0 }]]);
  for (const distance of [...rings.keys()].sort((a, b) => a - b)) {
    const ring = rings.get(distance) ?? [];
    const inward = (id: string): number[] =>
      (neighbours.get(id) ?? []).flatMap((other) => {
        const angle = angles.get(other);
        return angle === undefined ? [] : [angle];
      });
    const ordered =
      distance === 1 ? ring : [...ring].sort((a, b) => fromTop(meanAngle(inward(a))) - fromTop(meanAngle(inward(b))));
    ordered.forEach((id, index) => {
      const angle = angleOf(index, ordered.length) + (distance - 1) * RING_TWIST;
      angles.set(id, angle);
      positions.set(id, { x: distance * RING_GAP * Math.cos(angle), y: distance * RING_GAP * Math.sin(angle) });
    });
  }
  return positions;
}

/**
 * Grouped: each group gets its own sector round the centre, and its members start in it, each
 * distance one ring further out, spread across the sector.
 */
function sectorStart(input: GraphInput, groups: number): Map<string, Placed> {
  const positions = new Map<string, Placed>([[input.center.id, { x: 0, y: 0 }]]);
  const width = (FULL_TURN / groups) * SECTOR_FILL;
  const byGroupAndRing = new Map<string, GraphPerson[]>();
  for (const person of input.people) {
    const slot = `${String(person.group ?? 0)}|${String(person.distance)}`;
    byGroupAndRing.set(slot, [...(byGroupAndRing.get(slot) ?? []), person]);
  }
  for (const members of byGroupAndRing.values()) {
    members.forEach((person, index) => {
      const sector = sectorOf(person.group ?? 0, groups) + (person.distance - 1) * GROUP_CURL;
      const angle = sector + width * ((index + 1) / (members.length + 1) - 1 / 2);
      const radius = person.distance * RING_GAP;
      positions.set(person.id, { x: radius * Math.cos(angle), y: radius * Math.sin(angle) });
    });
  }
  return positions;
}

/**
 * Settles `start` under the force layout, the centre pinned at the origin. In a grouped graph each
 * member is also drawn toward its group's direction, so every polycule stays on its own side.
 * d3-force jiggles with a fixed seed, so the same graph lays out the same way.
 */
function settle(input: GraphInput, start: ReadonlyMap<string, Placed>, groups: number): Map<string, Placed> {
  const people = new Map(input.people.map((person) => [person.id, person]));
  const points: Point[] = [...start.entries()].map(([id, { x, y }]) =>
    id === input.center.id ? { id, x, y, fx: 0, fy: 0 } : { id, x, y },
  );
  // One spring per drawn line, long enough that its label fits between the boxes even side to side.
  const links: (SimulationLinkDatum<Point> & { length: number })[] = mergedTies(input.ties).map((line) => ({
    source: line.source,
    target: line.target,
    length: Math.max(TIE_LENGTH, NODE_WIDTH + labelOf(line).length * LABEL_CHAR_WIDTH + 2 * LABEL_ROOM),
  }));
  const home = (point: Point): Placed => {
    const person = people.get(point.id);
    if (groups === 0 || person === undefined) {
      return { x: 0, y: 0 };
    }
    return homeOf(person, groups);
  };
  const pull = groups === 0 ? CENTRING : GROUP_PULL;
  forceSimulation(points)
    .force(
      'ties',
      forceLink<Point, SimulationLinkDatum<Point> & { length: number }>(links)
        .id((point) => point.id)
        .distance((link) => link.length),
    )
    .force('repel', forceManyBody().strength(REPULSION))
    .force('collide', forceCollide(COLLISION_RADIUS))
    .force('x', forceX<Point>((point) => home(point).x).strength(pull))
    .force('y', forceY<Point>((point) => home(point).y).strength(pull))
    .stop()
    .tick(SETTLE_TICKS);
  return new Map(points.map((point) => [point.id, { x: point.x ?? 0, y: point.y ?? 0 }]));
}

/** The ties between one pair of people, drawn as one line. */
export interface MergedTie {
  source: string;
  target: string;
  kinds: string[];
  labels: string[];
  directed: boolean;
}

/**
 * One line per pair of people: two ties between the same two (comet partners who are also in a
 * dynamic) would otherwise be drawn exactly over each other. The line runs from a directed tie's
 * subject, ends in an arrow, and carries every tie's kind and subkind.
 */
export function mergedTies(ties: readonly GraphTie[]): MergedTie[] {
  const pairs = new Map<string, MergedTie>();
  // Symmetric ties' labels first, then directed ones, whichever order the ties came in.
  const ordered = [...ties].sort((a, b) => Number(a.directed === true) - Number(b.directed === true));
  for (const tie of ordered) {
    const key = [tie.source, tie.target].sort().join('|');
    const line = pairs.get(key) ?? { source: tie.source, target: tie.target, kinds: [], labels: [], directed: false };
    if (tie.directed === true && !line.directed) {
      line.source = tie.source;
      line.target = tie.target;
      line.directed = true;
    }
    if (!line.kinds.includes(tie.kind)) {
      line.kinds.push(tie.kind);
    }
    // A symmetric tie is stored both ways round; it is one tie, labelled once.
    const label = tie.discriminator?.replaceAll('_', ' ');
    if (label !== undefined && !line.labels.includes(label)) {
      line.labels.push(label);
    }
    pairs.set(key, line);
  }
  return [...pairs.values()];
}

/** The text a drawn line carries: its ties' subkinds, symmetric first. */
function labelOf(line: MergedTie): string {
  return line.labels.join(' · ');
}

/**
 * Where a line from `from` toward `to` (both box centres) leaves the box round `from`: lines
 * start and end at the boxes' borders, so an arrowhead is not hidden under the box it points at.
 */
export function borderPoint(from: Placed, to: Placed): Placed {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  if (dx === 0 && dy === 0) {
    return from;
  }
  const scale = Math.min(
    dx === 0 ? Number.POSITIVE_INFINITY : NODE_WIDTH / 2 / Math.abs(dx),
    dy === 0 ? Number.POSITIVE_INFINITY : NODE_HEIGHT / 2 / Math.abs(dy),
  );
  return { x: from.x + dx * scale, y: from.y + dy * scale };
}

/** Which way the box the graph is drawn in is longer. */
export type Orientation = 'landscape' | 'portrait';

/**
 * On a tall box, how much further apart people are spread side to side than up and down: the
 * boxes are wider than tall, so a tie running across needs more room than one running down to
 * show its line and label between them. A wide box already runs the network side to side.
 */
const ACROSS_STRETCH = 1.4;

/** How much longer the spread along one axis must be before turning the layout is worth it. */
const ELONGATION = 1.2;

/**
 * `positions` turned about the origin (the centre person) so the way they spread furthest runs
 * along the box's longer side: a network that settles as a diagonal line fills a wide box side to
 * side, and a phone's tall one top to bottom. A turn, never a mirror, so groups keep their order
 * round the centre. Roughly round layouts are left as they are.
 */
export function alignTo(positions: ReadonlyMap<string, Placed>, orientation: Orientation): Map<string, Placed> {
  const points = [...positions.values()];
  const meanX = points.reduce((sum, point) => sum + point.x, 0) / Math.max(points.length, 1);
  const meanY = points.reduce((sum, point) => sum + point.y, 0) / Math.max(points.length, 1);
  let xx = 0;
  let yy = 0;
  let xy = 0;
  for (const { x, y } of points) {
    xx += (x - meanX) ** 2;
    yy += (y - meanY) ** 2;
    xy += (x - meanX) * (y - meanY);
  }
  // The spreads along the principal axes (the covariance's eigenvalues), and the major one's angle.
  const half = (xx + yy) / 2;
  const offset = Math.sqrt(((xx - yy) / 2) ** 2 + xy ** 2);
  const major = half + offset;
  const minor = half - offset;
  if (major <= minor * ELONGATION ** 2) {
    return new Map(positions);
  }
  const axis = Math.atan2(2 * xy, xx - yy) / 2;
  const turn = (orientation === 'landscape' ? 0 : Math.PI / 2) - axis;
  const cos = Math.cos(turn);
  const sin = Math.sin(turn);
  return new Map([...positions.entries()].map(([id, { x, y }]) => [id, { x: x * cos - y * sin, y: x * sin + y * cos }]));
}

/**
 * Lays `input` out round its centre, then lets a force layout settle it: ties pull together,
 * people push apart and no two overlap. When people are grouped, each group branches off the
 * centre in its own direction, the whole turned to run along the longer side of an
 * `orientation` box. Each tie becomes one edge, classed by its kind, with an arrow when it is
 * directed.
 */
export function socialLayout(input: GraphInput, orientation: Orientation = 'landscape'): SocialLayout {
  const neighbours = new Map<string, string[]>();
  for (const tie of input.ties) {
    neighbours.set(tie.source, [...(neighbours.get(tie.source) ?? []), tie.target]);
    neighbours.set(tie.target, [...(neighbours.get(tie.target) ?? []), tie.source]);
  }
  const grouped = input.people.filter((person) => person.group !== null && person.group !== undefined);
  const groups = grouped.length === 0 ? 0 : Math.max(...grouped.map((person) => person.group ?? 0)) + 1;
  const start = groups === 0 ? ringStart(input, neighbours) : sectorStart(input, groups);
  const aligned = alignTo(settle(input, start, groups), orientation);
  const stretch = orientation === 'portrait' ? ACROSS_STRETCH : 1;
  const settled = new Map([...aligned.entries()].map(([id, { x, y }]) => [id, { x: x * stretch, y }]));
  const everyone = new Map([input.center, ...input.people].map((person) => [person.id, person]));
  const nodes: PersonNode[] = [...settled.entries()].map(([id, { x, y }]) => {
    const isCenter = id === input.center.id;
    return {
      id,
      position: { x: x - NODE_WIDTH / 2, y: y - NODE_HEIGHT / 2 },
      data: { label: everyone.get(id)?.label ?? SOMEONE, focus: isCenter, href: everyone.get(id)?.href },
      className: isCenter ? 'genealogy-node genealogy-node--focus' : 'genealogy-node',
      width: NODE_WIDTH,
      height: NODE_HEIGHT,
      draggable: false,
      connectable: false,
    };
  });
  const edges = mergedTies(input.ties).map((tie) => ({
    id: `${tie.source}|${tie.target}`,
    source: tie.source,
    target: tie.target,
    type: 'tie',
    label: tie.labels.length === 0 ? undefined : labelOf(tie),
    className: ['genealogy-tie', ...tie.kinds.map((kind) => `genealogy-tie--${kind}`)].join(' '),
    focusable: false,
    ...(tie.directed ? { markerEnd: { type: MarkerType.ArrowClosed } } : {}),
  }));
  return { nodes, edges };
}

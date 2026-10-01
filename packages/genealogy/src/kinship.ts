// SPDX-License-Identifier: AGPL-3.0-or-later
import type { Kinship } from './genealogyApi';

const ORDINALS = ['first', 'second', 'third', 'fourth', 'fifth', 'sixth', 'seventh', 'eighth', 'ninth', 'tenth'];
const TIMES = ['once', 'twice'];
/** "th", "st", "nd", "rd" by last digit; the teens (11th–13th) and every other digit take "th". */
const SUFFIXES = ['th', 'st', 'nd', 'rd'];
const DECIMAL = 10;
const GRAND_STEPS = 2;
const SIBLING_STEPS = 1;

function ordinal(n: number): string {
  const named = ORDINALS.at(n - 1);
  if (named !== undefined) {
    return named;
  }
  const inTeens = Math.floor(n / DECIMAL) % DECIMAL === 1;
  return `${n}${inTeens ? 'th' : (SUFFIXES.at(n % DECIMAL) ?? 'th')}`;
}

const times = (n: number): string => TIMES.at(n - 1) ?? `${n} times`;

/** "", "grand", "great-grand", "2× great-grand"…: the prefix for a lineal relative `generations` away. */
function grandPrefix(generations: number): string {
  const greats = generations - GRAND_STEPS;
  return greats < 0 ? '' : greats === 0 ? 'grand' : greats === 1 ? 'great-grand' : `${greats}× great-grand`;
}

/** "", "great-", "2× great-"…: the prefix for an aunt, uncle, niece or nephew `generations` away. */
function greatPrefix(generations: number): string {
  const greats = generations - SIBLING_STEPS - 1;
  return greats <= 0 ? '' : greats === 1 ? 'great-' : `${greats}× great-`;
}

/** Sharing a line of descent: the other is the person's ancestor (`down` 0) or descendant. */
const linealLabel = (up: number, down: number): string =>
  down === 0 ? `${grandPrefix(up)}parent` : `${grandPrefix(down)}child`;

/** Descended from the same ancestor along different lines. */
function collateralLabel(up: number, down: number, cousin: number, removed: number): string {
  if (cousin > 0) {
    const base = `${ordinal(cousin)} cousin`;
    return removed === 0 ? base : `${base} ${times(removed)} removed`;
  }
  if (removed === 0) {
    return 'sibling';
  }
  // The other person is a generation nearer the common ancestor: an aunt or uncle.
  return down < up ? `${greatPrefix(up)}aunt or uncle` : `${greatPrefix(down)}niece or nephew`;
}

/**
 * What the other person is to the first, in words: "grandparent", "first cousin once removed",
 * "great-aunt or uncle"; null when they share no recorded ancestor or are the same person. The roles
 * are gender-neutral, since gender is free text on a person.
 */
export function kinshipLabel(kinship: Kinship): string | null {
  const { related, up_from_person: up, up_from_other: down, cousin, removed, lineal } = kinship;
  if (!related || up === null || down === null || cousin === null || removed === null || up + down === 0) {
    return null;
  }
  return lineal === true ? linealLabel(up, down) : collateralLabel(up, down, cousin, removed);
}

/** The kinship as a sentence: "Ada is Byron's grandchild." */
export function describeKinship(kinship: Kinship, personName: string, otherName: string): string {
  const label = kinshipLabel(kinship);
  if (label !== null) {
    return `${otherName} is ${personName}’s ${label}.`;
  }
  return kinship.related
    ? `${personName} and ${otherName} are the same person.`
    : `${personName} and ${otherName} share no recorded ancestor.`;
}

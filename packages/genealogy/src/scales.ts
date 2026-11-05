// SPDX-License-Identifier: AGPL-3.0-or-later
/**
 * A card value made of scales: a personality type read as one pole of each axis (I or E, N or S…),
 * each with how strongly, as a test result gives it ("62% Introverted"). Kept as readable text, so
 * anyone it is shared with sees it as written: "INTJ (I 62%, N 70%, T 55%, J 80%)", or just
 * "INTJ" when no strengths are given.
 */

/** One end of an axis: the letter it adds to the type, and its name. */
export interface CardPole {
  letter: string;
  name: string;
}

/** An axis of a scaled field, its two poles in the order to offer them. */
export interface CardScale {
  poles: readonly [CardPole, CardPole];
}

/** Where a value stands on one axis: the pole chosen (its letter, or none yet), and how strongly. */
export interface ScalePoint {
  letter: string;
  /** Percent towards the chosen pole, 50 to 100; null when only the pole is known. */
  strength: number | null;
}

export const MIN_STRENGTH = 50;
export const MAX_STRENGTH = 100;

const STRENGTH = /^([A-Za-z]) ?(\d{1,3}) ?%$/;

const blank = (scales: readonly CardScale[]): ScalePoint[] => scales.map(() => ({ letter: '', strength: null }));

/** The points a stored value stands for; all blank when it is empty or not in this shape. */
export function parseScaled(value: string, scales: readonly CardScale[]): ScalePoint[] {
  const text = value.trim();
  const open = text.indexOf('(');
  const letters = (open === -1 ? text : text.slice(0, open)).trim().toUpperCase();
  const inside = open === -1 ? '' : text.slice(open + 1);
  if (!/^[A-Z]+$/.test(letters) || letters.length !== scales.length || (open !== -1 && !inside.endsWith(')'))) {
    return blank(scales);
  }
  const strengths = new Map<string, number>();
  for (const part of inside
    .slice(0, -1)
    .split(',')
    .filter((piece) => piece.trim() !== '')) {
    const found = STRENGTH.exec(part.trim());
    if (found === null) {
      return blank(scales);
    }
    const [, letter = '', digits = ''] = found;
    strengths.set(letter.toUpperCase(), Number(digits));
  }
  const points = scales.map((scale, index): ScalePoint | null => {
    const letter = letters.charAt(index);
    return scale.poles.some((pole) => pole.letter === letter) ? { letter, strength: strengths.get(letter) ?? null } : null;
  });
  return points.every((point) => point !== null) ? points : blank(scales);
}

/** The value to store for `points`: empty until every axis has a pole. */
export function formatScaled(points: readonly ScalePoint[]): string {
  if (points.length === 0 || points.some((point) => point.letter === '')) {
    return '';
  }
  const type = points.map((point) => point.letter).join('');
  const strengths = points.flatMap((point) =>
    point.strength === null ? [] : [`${point.letter} ${String(point.strength)}%`],
  );
  return strengths.length === 0 ? type : `${type} (${strengths.join(', ')})`;
}

/** Why `points` cannot be stored, or null: a strength must be a whole percent from 50 to 100. */
export function scaledProblem(points: readonly ScalePoint[]): string | null {
  const bad = points.find(
    (point) =>
      point.strength !== null &&
      (!Number.isInteger(point.strength) || point.strength < MIN_STRENGTH || point.strength > MAX_STRENGTH),
  );
  return bad === undefined
    ? null
    : `A strength is a whole percent from ${String(MIN_STRENGTH)} to ${String(MAX_STRENGTH)}, towards the letter chosen.`;
}

// SPDX-License-Identifier: AGPL-3.0-or-later
import { describe, expect, it } from 'vitest';
import { type CardScale, formatScaled, parseScaled, scaledProblem } from './scales';

const axis = (a: string, b: string): CardScale => ({
  poles: [
    { letter: a, name: a },
    { letter: b, name: b },
  ],
});
const MBTI = [axis('E', 'I'), axis('S', 'N'), axis('T', 'F'), axis('J', 'P')];

describe('scaled values', () => {
  it('writes the type, then each strength given', () => {
    expect(
      formatScaled([
        { letter: 'I', strength: 62 },
        { letter: 'N', strength: 70 },
        { letter: 'T', strength: null },
        { letter: 'J', strength: 80 },
      ]),
    ).toBe('INTJ (I 62%, N 70%, J 80%)');
    expect(formatScaled(MBTI.map((_, index) => ({ letter: 'ISTJ'.charAt(index), strength: null })))).toBe('ISTJ');
  });

  it('stores nothing until every axis has a pole', () => {
    expect(
      formatScaled([
        { letter: 'I', strength: 60 },
        { letter: '', strength: null },
      ]),
    ).toBe('');
  });

  it('reads a value back, a bare type included, and leaves what it cannot read blank', () => {
    expect(parseScaled('INTJ (I 62%, N 70%, T 55%, J 80%)', MBTI).map((point) => point.strength)).toEqual([62, 70, 55, 80]);
    expect(parseScaled('enfp', MBTI).map((point) => point.letter)).toEqual(['E', 'N', 'F', 'P']);
    expect(parseScaled('the architect', MBTI).every((point) => point.letter === '')).toBe(true);
    expect(parseScaled('XNTJ', MBTI).every((point) => point.letter === '')).toBe(true);
  });

  it('refuses a strength outside 50 to 100', () => {
    expect(scaledProblem([{ letter: 'I', strength: 49 }])).not.toBeNull();
    expect(scaledProblem([{ letter: 'I', strength: 100 }])).toBeNull();
  });
});

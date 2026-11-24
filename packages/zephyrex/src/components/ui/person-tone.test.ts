// SPDX-License-Identifier: AGPL-3.0-or-later
import { describe, expect, it } from 'vitest';
import { PERSON_TONES, personTone, personToneClass, personTones } from './person-tone';

const IDS = ['u-ada', 'u-alex', 'u-jo', 'u-sam', 'u-kim', 'u-lee', 'u-max', 'u-ren', 'u-ola'];

describe('personTone', () => {
  it('gives each id one of the eight colours, the same every time', () => {
    for (const id of IDS) {
      const tone = personTone(id);
      expect(tone).toBeGreaterThanOrEqual(1);
      expect(tone).toBeLessThanOrEqual(PERSON_TONES);
      expect(personTone(id)).toBe(tone);
    }
  });
});

describe('personTones', () => {
  it('keeps each person’s own colour when nobody before them has it', () => {
    const [first = ''] = IDS;
    expect(personTones([first]).get(first)).toBe(personTone(first));
  });

  it('never gives two of up to eight people in a view the same colour', () => {
    const view = IDS.slice(0, PERSON_TONES);
    const tones = personTones(view);
    expect(new Set(view.map((id) => tones.get(id))).size).toBe(PERSON_TONES);
  });

  it('moves a clash to the next free colour, and counts a repeated id once', () => {
    // Two ids whose own colours are the same.
    const clashing = IDS.flatMap((a) => IDS.map((b) => [a, b] as const)).find(
      ([a, b]) => a !== b && personTone(a) === personTone(b),
    );
    const [one = 'a', other = 'b'] = clashing ?? ['a', 'i'];
    const tones = personTones([one, other, one]);
    expect(tones.get(one)).toBe(personTone(one));
    expect(tones.get(other)).not.toBe(tones.get(one));
    expect(tones.size).toBe(2);
  });

  it('lets colours repeat past eight people, each keeping their own', () => {
    const tones = personTones(IDS);
    expect(tones.size).toBe(IDS.length);
    const last = IDS.at(-1) ?? '';
    expect(tones.get(last)).toBe(personTone(last));
  });
});

describe('personToneClass', () => {
  it('names the tone’s background and the initials’ colour, wrapping out-of-range tones', () => {
    expect(personToneClass(3)).toBe('bg-person-3 text-person-foreground');
    expect(personToneClass(9)).toBe('bg-person-1 text-person-foreground');
    expect(personToneClass(0)).toBe('bg-person-8 text-person-foreground');
  });
});

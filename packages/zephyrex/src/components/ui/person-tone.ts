// SPDX-License-Identifier: AGPL-3.0-or-later
/**
 * A person's colour: one of eight theme tokens (`--person-1` … `--person-8` in zephyrex.css, each
 * checked for contrast with its initials and with the page in every theme), so it follows light and
 * dark and the theme ratchet sees it. A person keeps their colour by id on every page; in one view
 * of a few people (a rota, a watch-list, an agreement), personTones moves a clash to the next free
 * colour, so two people side by side never share one.
 */

/** How many person colours the themes define. */
export const PERSON_TONES = 8;

/** The classes for each tone, spelled out so Tailwind finds them. */
const TONE_CLASSES = [
  'bg-person-1',
  'bg-person-2',
  'bg-person-3',
  'bg-person-4',
  'bg-person-5',
  'bg-person-6',
  'bg-person-7',
  'bg-person-8',
] as const;

/** A string hash's multiplier. */
const HASH_SEED = 31;

/** A person's own colour, 1 to 8, from their id: the same on every page. */
export function personTone(id: string): number {
  let hash = 0;
  for (const char of id) {
    hash = (hash * HASH_SEED + (char.codePointAt(0) ?? 0)) % PERSON_TONES;
  }
  return hash + 1;
}

/**
 * The colours for the people in one view: each keeps their own colour unless someone before them in
 * `ids` already has it, then takes the next free one. Past eight people colours repeat (each keeps
 * their own).
 */
export function personTones(ids: readonly string[]): ReadonlyMap<string, number> {
  const tones = new Map<string, number>();
  const taken = new Set<number>();
  for (const id of ids) {
    if (tones.has(id)) {
      continue;
    }
    const own = personTone(id);
    let tone = own;
    for (let step = 0; step < PERSON_TONES && taken.has(tone); step += 1) {
      tone = (tone % PERSON_TONES) + 1;
    }
    const chosen = taken.has(tone) ? own : tone;
    tones.set(id, chosen);
    taken.add(chosen);
  }
  return tones;
}

/** The background and initials classes for a tone (1 to 8; anything else wraps into range). */
export function personToneClass(tone: number): string {
  const index = (((Math.trunc(tone) - 1) % PERSON_TONES) + PERSON_TONES) % PERSON_TONES;
  return `${TONE_CLASSES[index] ?? TONE_CLASSES[0]} text-person-foreground`;
}

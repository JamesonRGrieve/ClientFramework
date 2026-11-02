// SPDX-License-Identifier: AGPL-3.0-or-later
import { describe, expect, it } from 'vitest';
import { everyoneOn, titleLabel, WatchListSchema } from './mediaModel';

describe('the media model', () => {
  it('puts the keeper first among everyone on a list', () => {
    expect(everyoneOn({ keeper_id: 'k', member_ids: ['a', 'b'] })).toEqual(['k', 'a', 'b']);
  });

  it('labels a title with its year when it has one', () => {
    expect(titleLabel({ title: 'The Matrix', year: 1999 })).toBe('The Matrix (1999)');
    expect(titleLabel({ title: 'Untitled', year: null })).toBe('Untitled');
  });

  it('reads a list whose titles have no poster', () => {
    const list = WatchListSchema.parse({
      id: 'l',
      name: 'Films',
      keeper_id: 'k',
      member_ids: [],
      titles: [{ title_id: 't', id: 'tmdb:movie:1', title: 'A', kind: 'movie', wanted_by: [] }],
    });
    expect(list.titles[0]?.image).toBeUndefined();
  });
});

// SPDX-License-Identifier: AGPL-3.0-or-later
import { describe, expect, it } from 'vitest';
import { ALEX, mediaFixture, ME, pickOf } from './media.mocks';
import { present } from './testing.mocks';

describe('the media mock', () => {
  it('picks what everyone wants', () => {
    const list = present(mediaFixture().lists[0], 'a list');
    expect(pickOf(list)).toMatchObject({
      everyone: true,
      wanted_by: 2,
      of: 2,
      title: { title: 'The Matrix' },
    });
  });

  it('else what most want, and nothing once all is watched', () => {
    const list = present(mediaFixture().lists[0], 'a list');
    list.member_ids = [ALEX, 'u-sam'];
    expect(pickOf(list)).toMatchObject({ everyone: false, wanted_by: 2, of: 3 });
    for (const entry of list.titles) {
      entry.watched_on = '2026-11-01';
    }
    expect(pickOf(list).title).toBeNull();
    expect(list.keeper_id).toBe(ME);
  });
});

// SPDX-License-Identifier: AGPL-3.0-or-later
import { describe, expect, it } from 'vitest';
import { roomsExtension } from './extension';

describe('roomsExtension', () => {
  it('is the registry’s rooms entry, with no pages of its own', () => {
    expect(roomsExtension.name).toBe('rooms');
    expect(roomsExtension.pages ?? []).toEqual([]);
  });
});

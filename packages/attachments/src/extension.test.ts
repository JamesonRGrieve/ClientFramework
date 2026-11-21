// SPDX-License-Identifier: AGPL-3.0-or-later
import { describe, expect, it } from 'vitest';
import { attachmentsExtension as registered } from 'zephyrex/extensions';
import { attachmentsExtension } from './extension';

describe('attachmentsExtension', () => {
  it('is the registered attachments extension, with no pages of its own', () => {
    expect(attachmentsExtension).toMatchObject({ name: 'attachments', serverExtension: 'attachments' });
    expect(attachmentsExtension.displayName).toBe(registered.displayName);
    expect(attachmentsExtension.pages ?? []).toEqual([]);
  });
});

// SPDX-License-Identifier: AGPL-3.0-or-later
import { within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Artifacts, sizeLabel } from './Artifacts';
import { emptyStore, PLANS_ID } from './conversations.mocks';
import { renderConversations } from './testing.mocks';

describe('sizeLabel', () => {
  it('reads a size in bytes, KiB or MiB, and nothing for none', () => {
    expect([34, 2048, 3 * 1024 * 1024, null].map(sizeLabel)).toEqual(['34 B', '2.0 KiB', '3.0 MiB', '']);
  });
});

describe('Artifacts', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('lists the files by name, with their content when it is held and not encrypted', async () => {
    const view = renderConversations(<Artifacts conversationId={PLANS_ID} />);
    const list = await view.findByRole('list', { name: 'Files' });
    const [keys = '', schedule = ''] = within(list)
      .getAllByRole('listitem')
      .map((item) => item.textContent);
    expect(keys).toContain('keys.binapplication/octet-stream · 2.0 KiB');
    expect(keys).toContain('Encrypted: its content is not shown.');
    expect(schedule).toContain('schedule.mdtext/markdown · 34 B');
    expect(schedule).toContain('Run the engine at nine.');
  });

  it('says so when there are no files', async () => {
    const view = renderConversations(<Artifacts conversationId={PLANS_ID} />, emptyStore());
    expect(await view.findByText('No files yet.')).toBeInTheDocument();
  });
});

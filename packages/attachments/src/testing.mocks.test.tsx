// SPDX-License-Identifier: AGPL-3.0-or-later
import { afterEach, describe, expect, it, vi } from 'vitest';
import { emptyAttachmentStore, storeAsset, storeAttachment, TERRA } from './attachments.mocks';
import { useAttachments } from './attachmentsApi';
import { renderAttachments } from './testing.mocks';

function AttachmentCount(): string {
  return `${String(useAttachments(TERRA).data?.length ?? -1)} attachments`;
}

describe('renderAttachments', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('renders signed in over an empty store by default', async () => {
    const view = renderAttachments(<AttachmentCount />);
    expect(await view.findByText('0 attachments')).toBeInTheDocument();
  });

  it('answers from the store it is given', async () => {
    const store = emptyAttachmentStore();
    storeAttachment(store, storeAsset(store, 'a.pdf', 'application/pdf', 3), TERRA, 'document');
    const view = renderAttachments(<AttachmentCount />, store);
    expect(await view.findByText('1 attachments')).toBeInTheDocument();
  });
});

// SPDX-License-Identifier: AGPL-3.0-or-later
import { within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { fakeXhr } from 'zephyrex/testing';
import { AttachmentGallery } from './AttachmentGallery';
import { emptyAttachmentStore, FAR_MOON, storeAsset, storeAttachment, TERRA } from './attachments.mocks';
import { GALLERY } from './attachmentsModel';
import { renderAttachments } from './testing.mocks';

const HTTP_CREATED = 201;
const PDF = 'application/pdf';

const fileInput = (container: HTMLElement): HTMLInputElement => {
  const found = container.querySelector('input[type=file]');
  if (!(found instanceof HTMLInputElement)) {
    throw new Error('The test expected a file input');
  }
  return found;
};

const withFiles = (): ReturnType<typeof emptyAttachmentStore> => {
  const store = emptyAttachmentStore();
  storeAttachment(store, storeAsset(store, 'harbour.png', 'image/png', 2048), TERRA, GALLERY);
  storeAttachment(store, storeAsset(store, 'charter.pdf', PDF, 14_336), TERRA, GALLERY);
  return store;
};

describe('AttachmentGallery', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('shows pictures as thumbnails and documents as links with their sizes, read-only for a viewer', async () => {
    const view = renderAttachments(<AttachmentGallery target={TERRA} />, withFiles());
    const pictures = await view.findByRole('list', { name: 'Pictures' });
    expect(within(pictures).getByRole('img', { name: 'harbour.png' })).toHaveAttribute(
      'src',
      expect.stringContaining('/content'),
    );
    const documents = view.getByRole('list', { name: 'Documents' });
    expect(within(documents).getByRole('link', { name: 'charter.pdf' })).toHaveAttribute('target', '_blank');
    expect(documents).toHaveTextContent('14 KB');
    expect(view.queryByRole('button')).toBeNull();
  });

  it('adds a file and removes one for an editor', async () => {
    const store = withFiles();
    const user = userEvent.setup();
    const view = renderAttachments(<AttachmentGallery target={TERRA} canEdit />, store);
    await user.click(await view.findByRole('button', { name: 'Remove charter.pdf' }));
    await vi.waitFor(() => {
      expect(view.queryByRole('list', { name: 'Documents' })).toBeNull();
    });
    const asset = storeAsset(store, 'notes.pdf', PDF, 900);
    vi.stubGlobal('XMLHttpRequest', fakeXhr(HTTP_CREATED, JSON.stringify({ asset })).Xhr);
    await user.upload(fileInput(view.container), new File(['%PDF'], 'notes.pdf', { type: PDF }));
    expect(
      await within(await view.findByRole('list', { name: 'Documents' })).findByRole('link', { name: 'notes.pdf' }),
    ).toBeInTheDocument();
    expect(store.attachments.map((one) => one.role)).toEqual([GALLERY, GALLERY]);
  });

  it('says when there is nothing yet, and when the list could not be read', async () => {
    const empty = renderAttachments(<AttachmentGallery target={TERRA} />, emptyAttachmentStore());
    expect(await empty.findByText('Nothing here yet.')).toBeInTheDocument();
    empty.unmount();
    const store = emptyAttachmentStore();
    store.viewable.delete(`${FAR_MOON.type}:${FAR_MOON.id}`);
    const hidden = renderAttachments(<AttachmentGallery target={FAR_MOON} />, store);
    expect(await hidden.findByRole('button', { name: 'Try again' })).toBeInTheDocument();
  });
});

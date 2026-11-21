// SPDX-License-Identifier: AGPL-3.0-or-later
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { fakeXhr } from 'zephyrex/testing';
import { emptyAttachmentStore, FAR_MOON, storeAsset, storeAttachment, TERRA } from './attachments.mocks';
import { PRIMARY_IMAGE } from './attachmentsModel';
import { RecordPicture } from './RecordPicture';
import { renderAttachments } from './testing.mocks';

const HTTP_CREATED = 201;

const input = (container: HTMLElement): HTMLInputElement => {
  const found = container.querySelector('input[type=file]');
  if (!(found instanceof HTMLInputElement)) {
    throw new Error('The test expected a file input');
  }
  return found;
};

describe('RecordPicture', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('says there is no picture yet, and adds one for someone who may edit', async () => {
    const store = emptyAttachmentStore();
    const user = userEvent.setup();
    const view = renderAttachments(<RecordPicture target={TERRA} name='Terra' canEdit />, store);
    expect(await view.findByText('No picture of Terra yet')).toBeInTheDocument();
    const asset = storeAsset(store, 'terra.png', 'image/png', 4);
    vi.stubGlobal('XMLHttpRequest', fakeXhr(HTTP_CREATED, JSON.stringify({ asset })).Xhr);
    await user.upload(input(view.container), new File(['png!'], 'terra.png', { type: 'image/png' }));
    expect(await view.findByRole('img', { name: 'Terra' })).toHaveAttribute(
      'src',
      expect.stringContaining(`/v1/asset/${asset.id}/content`),
    );
    expect(store.attachments).toMatchObject([{ asset_id: asset.id, role: PRIMARY_IMAGE }]);
    expect(view.getByRole('button', { name: 'Replace picture' })).toBeInTheDocument();
  });

  it('removes the picture', async () => {
    const store = emptyAttachmentStore();
    storeAttachment(store, storeAsset(store, 'terra.png', 'image/png', 4), TERRA, PRIMARY_IMAGE);
    const user = userEvent.setup();
    const view = renderAttachments(<RecordPicture target={TERRA} name='Terra' canEdit />, store);
    await user.click(await view.findByRole('button', { name: 'Remove picture' }));
    expect(await view.findByText('No picture of Terra yet')).toBeInTheDocument();
    expect(store.attachments).toEqual([]);
  });

  it('shows the picture without controls to someone who may only view, and initials in a list', async () => {
    const store = emptyAttachmentStore();
    storeAttachment(store, storeAsset(store, 'moon.png', 'image/png', 4), FAR_MOON, PRIMARY_IMAGE);
    const view = renderAttachments(
      <>
        <RecordPicture target={FAR_MOON} name='Far Moon' />
        <RecordPicture target={TERRA} name='Terra Nova' size='sm' />
      </>,
      store,
    );
    expect(await view.findByRole('img', { name: 'Far Moon' })).toBeInTheDocument();
    expect(view.queryByRole('button')).toBeNull();
    expect(view.getByRole('img', { name: 'Terra Nova' })).toHaveTextContent('TN');
  });

  it('says the picture did not load for a record the user may not view', async () => {
    const store = emptyAttachmentStore();
    store.viewable.delete(`${FAR_MOON.type}:${FAR_MOON.id}`);
    const view = renderAttachments(<RecordPicture target={FAR_MOON} name='Far Moon' />, store);
    expect(await view.findByRole('button', { name: 'Try again' })).toBeInTheDocument();
  });
});

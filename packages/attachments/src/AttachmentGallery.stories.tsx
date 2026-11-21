// SPDX-License-Identifier: AGPL-3.0-or-later
import type { Meta, StoryObj } from '@storybook/nextjs';
import { expect, within } from 'storybook/test';
import { withSignedIn, withZephyrexApi } from 'zephyrex/testing';
import { AttachmentGallery } from './AttachmentGallery';
import { attachmentHandlers, emptyAttachmentStore, FAR_MOON, storeAsset, storeAttachment, TERRA } from './attachments.mocks';
import { GALLERY } from './attachmentsModel';

const withFiles = (): ReturnType<typeof emptyAttachmentStore> => {
  const store = emptyAttachmentStore();
  storeAttachment(store, storeAsset(store, 'harbour.png', 'image/png', 2048), TERRA, GALLERY);
  storeAttachment(store, storeAsset(store, 'lighthouse.png', 'image/png', 4096), TERRA, GALLERY);
  storeAttachment(
    store,
    storeAsset(store, 'a very long charter of the harbour guild, signed.pdf', 'application/pdf', 2_516_582),
    TERRA,
    GALLERY,
  );
  return store;
};

const meta: Meta<typeof AttachmentGallery> = {
  title: 'attachments/AttachmentGallery',
  component: AttachmentGallery,
  args: { target: TERRA, canEdit: true },
  parameters: { nextjs: { appDirectory: true }, msw: { handlers: attachmentHandlers(withFiles()) } },
  decorators: [withSignedIn, withZephyrexApi],
};
export default meta;

type Story = StoryObj<typeof AttachmentGallery>;

/** An editor's view: thumbnails and documents, each removable, and a way to add more. */
export const Editable: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(await canvas.findByRole('list', { name: 'Pictures' })).toBeInTheDocument();
    await expect(canvas.getByRole('button', { name: 'Add to Files' })).toBeInTheDocument();
  },
};

/** A viewer's view: no add or remove. */
export const ViewOnly: Story = {
  args: { canEdit: false },
};

/** Nothing attached yet. */
export const Empty: Story = {
  parameters: { msw: { handlers: attachmentHandlers(emptyAttachmentStore()) } },
  play: async ({ canvasElement }) => {
    await expect(await within(canvasElement).findByText('Nothing here yet.')).toBeInTheDocument();
  },
};

/** The list could not be read. */
export const Failed: Story = {
  args: { target: FAR_MOON, canEdit: false },
  parameters: {
    msw: {
      handlers: attachmentHandlers(
        (() => {
          const store = emptyAttachmentStore();
          store.viewable.clear();
          return store;
        })(),
      ),
    },
  },
};

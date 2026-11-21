// SPDX-License-Identifier: AGPL-3.0-or-later
import type { Meta, StoryObj } from '@storybook/nextjs';
import { expect, within } from 'storybook/test';
import { withSignedIn, withZephyrexApi } from 'zephyrex/testing';
import { attachmentHandlers, emptyAttachmentStore, FAR_MOON, storeAsset, storeAttachment, TERRA } from './attachments.mocks';
import { PRIMARY_IMAGE } from './attachmentsModel';
import { RecordPicture } from './RecordPicture';

const withPicture = (): ReturnType<typeof emptyAttachmentStore> => {
  const store = emptyAttachmentStore();
  storeAttachment(store, storeAsset(store, 'terra.png', 'image/png', 70), TERRA, PRIMARY_IMAGE);
  return store;
};

const meta: Meta<typeof RecordPicture> = {
  title: 'attachments/RecordPicture',
  component: RecordPicture,
  args: { target: TERRA, name: 'Terra', canEdit: true },
  parameters: { nextjs: { appDirectory: true }, msw: { handlers: attachmentHandlers(withPicture()) } },
  decorators: [withSignedIn, withZephyrexApi],
};
export default meta;

type Story = StoryObj<typeof RecordPicture>;

/** The record's picture, with replace and remove. */
export const Editable: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(await canvas.findByRole('img', { name: 'Terra' })).toBeInTheDocument();
    await expect(canvas.getByRole('button', { name: 'Replace picture' })).toBeInTheDocument();
  },
};

/** No picture yet. */
export const NoPicture: Story = {
  parameters: { msw: { handlers: attachmentHandlers(emptyAttachmentStore()) } },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(await canvas.findByText('No picture of Terra yet')).toBeInTheDocument();
    await expect(canvas.getByRole('button', { name: 'Add a picture' })).toBeInTheDocument();
  },
};

/** Someone who may only view the record. */
export const ViewOnly: Story = {
  args: { canEdit: false },
};

/** In a list row: the picture small, or the record's initials. */
export const Small: Story = {
  args: { target: FAR_MOON, name: 'Far Moon', size: 'sm', canEdit: false },
};

/** The picture did not load. */
export const Failed: Story = {
  args: { target: FAR_MOON, name: 'Far Moon', canEdit: false },
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
  play: async ({ canvasElement }) => {
    await expect(await within(canvasElement).findByRole('button', { name: 'Try again' })).toBeInTheDocument();
  },
};

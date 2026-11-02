// SPDX-License-Identifier: AGPL-3.0-or-later
import type { Meta, StoryObj } from '@storybook/nextjs';
import { http, HttpResponse } from 'msw';
import { expect, within } from 'storybook/test';
import { withSignedIn, withZephyrexApi } from 'zephyrex/testing';
import { ALEX_ID, agreementsHandlers, emptyAgreementsStore, ME_ID, SAM_ID } from './agreements.mocks';
import { AgreementsPage } from './AgreementsPage';

const me = http.get('*/v1/user', () => HttpResponse.json({ user: { id: ME_ID, email: 'me@example.com' } }));

const meta: Meta<typeof AgreementsPage> = {
  title: 'agreements/AgreementsPage',
  component: AgreementsPage,
  args: {
    people: [
      { userId: ALEX_ID, name: 'Alex' },
      { userId: SAM_ID, name: 'Sam' },
    ],
  },
  parameters: { nextjs: { appDirectory: true }, layout: 'padded', msw: { handlers: [me, ...agreementsHandlers()] } },
  decorators: [withSignedIn, withZephyrexApi],
};
export default meta;

type Story = StoryObj<typeof AgreementsPage>;

/** One agreement in effect, one waiting on someone and due for a revisit. */
export const InUse: Story = {
  play: async ({ canvasElement }) => {
    await expect(await within(canvasElement).findByRole('status', { name: 'Where Us stands' })).toHaveTextContent(
      'Everyone has confirmed this version.',
    );
  },
};

/** Nothing yet. */
export const Empty: Story = {
  parameters: { msw: { handlers: [me, ...agreementsHandlers(emptyAgreementsStore())] } },
};

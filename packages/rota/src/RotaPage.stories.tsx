// SPDX-License-Identifier: AGPL-3.0-or-later
import type { Meta, StoryObj } from '@storybook/nextjs';
import { withSignedIn, withZephyrexApi } from 'zephyrex/testing';
import { ALEX, emptyRotaStore, ME, rotaFixture, rotaHandlers, SAM } from './rota.mocks';
import { RotaPage } from './RotaPage';

const meta: Meta<typeof RotaPage> = {
  title: 'rota/RotaPage',
  component: RotaPage,
  args: {
    people: [
      { userId: ALEX, name: 'Alex' },
      { userId: SAM, name: 'Sam' },
    ],
  },
  parameters: { nextjs: { appDirectory: true }, layout: 'fullscreen', msw: { handlers: rotaHandlers() } },
  decorators: [withSignedIn, withZephyrexApi],
};
export default meta;

type Story = StoryObj<typeof RotaPage>;

/** The owner's view: the next two weeks, a night Alex offers, and the cycle. */
export const YourRota: Story = {};

/** A member's view of someone else's rota: no cycle to change. */
export const SomeoneElsesRota: Story = {
  args: { people: [{ userId: ME, name: 'Jo' }] },
  parameters: { msw: { handlers: rotaHandlers({ ...rotaFixture(), me: ALEX }) } },
};

export const NoRotas: Story = {
  parameters: { msw: { handlers: rotaHandlers(emptyRotaStore()) } },
};

// SPDX-License-Identifier: AGPL-3.0-or-later
import type { Meta, StoryObj } from '@storybook/nextjs';
import { expect, userEvent, within } from 'storybook/test';
import { WaitlistForm } from './WaitlistForm';

/** Answers the form's post the way the waitlist route would, for the story's lifetime. */
function answer(status: number, body: object): () => () => void {
  return () => {
    const real = globalThis.fetch;
    globalThis.fetch = () => Promise.resolve(Response.json(body, { status }));
    return () => {
      globalThis.fetch = real;
    };
  };
}

const EMAIL = 'Email';
const JOIN = 'Join the waitlist';

const meta: Meta<typeof WaitlistForm> = {
  title: 'marketing/WaitlistForm',
  component: WaitlistForm,
  parameters: { nextjs: { appDirectory: true }, layout: 'padded' },
  args: {
    title: 'Accounts are waitlist only for now',
    body: 'Every tool works without an account. Leave your email and we’ll write when accounts open.',
  },
};
export default meta;
type Story = StoryObj<typeof WaitlistForm>;

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole('textbox', { name: EMAIL })).toBeRequired();
    await expect(canvas.getByRole('checkbox', { name: /Email me when it opens/ })).toBeRequired();
    await expect(canvas.getByRole('button', { name: JOIN })).toBeEnabled();
  },
};

export const Joined: Story = {
  beforeEach: answer(202, { ok: true }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.type(canvas.getByRole('textbox', { name: EMAIL }), 'a.very.long.address.for.wrapping@example.com');
    await userEvent.click(canvas.getByRole('checkbox', { name: /Email me when it opens/ }));
    await userEvent.click(canvas.getByRole('button', { name: JOIN }));
    await expect(await canvas.findByRole('status')).toHaveTextContent('You’re on the waitlist');
  },
};

export const Refused: Story = {
  beforeEach: answer(429, { detail: { message: 'That is a lot of tries from one place. Try again in an hour.' } }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.type(canvas.getByRole('textbox', { name: EMAIL }), 'ada@example.com');
    await userEvent.click(canvas.getByRole('checkbox', { name: /Email me when it opens/ }));
    await userEvent.click(canvas.getByRole('button', { name: JOIN }));
    await expect(await canvas.findByRole('alert')).toHaveTextContent('Try again in an hour');
  },
};

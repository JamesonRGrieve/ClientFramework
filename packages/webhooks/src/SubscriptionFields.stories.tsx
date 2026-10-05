// SPDX-License-Identifier: AGPL-3.0-or-later
import type { Meta, StoryObj } from '@storybook/nextjs';
import { useState } from 'react';
import { SubscriptionFields } from './SubscriptionFields';
import type { SubscriptionDraft } from './webhookModel';

const meta: Meta<typeof SubscriptionFields> = {
  title: 'webhooks/SubscriptionFields',
  component: SubscriptionFields,
  parameters: { layout: 'centered' },
};
export default meta;

type Story = StoryObj<typeof SubscriptionFields>;

function Editing({
  start,
  secretRequired,
}: {
  start: SubscriptionDraft;
  secretRequired: boolean;
}): ReturnType<typeof SubscriptionFields> {
  const [draft, setDraft] = useState(start);
  return <SubscriptionFields draft={draft} onChange={setDraft} secretRequired={secretRequired} />;
}

export const New: Story = {
  render: () => <Editing start={{ target_url: '', event_types: '*', active: true, secret: '' }} secretRequired />,
};

export const Existing: Story = {
  render: () => (
    <Editing
      start={{ target_url: 'https://hooks.example.com/orders', event_types: 'order.created', active: true, secret: '' }}
      secretRequired={false}
    />
  ),
};

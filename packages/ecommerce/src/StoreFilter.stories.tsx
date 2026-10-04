// SPDX-License-Identifier: AGPL-3.0-or-later
import type { Meta, StoryObj } from '@storybook/nextjs';
import { STORE_PROVIDERS } from './ecommerce.mocks';
import { StoreFilter } from './StoreFilter';

const meta: Meta<typeof StoreFilter> = {
  title: 'ecommerce/StoreFilter',
  component: StoreFilter,
  parameters: { layout: 'centered' },
  args: { stores: STORE_PROVIDERS.instances, value: null, onChange: () => undefined },
};
export default meta;

type Story = StoryObj<typeof StoreFilter>;

export const AllStores: Story = {};

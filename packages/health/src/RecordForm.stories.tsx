// SPDX-License-Identifier: AGPL-3.0-or-later
import type { Meta, StoryObj } from '@storybook/nextjs';
import { RecordForm } from './RecordForm';
import { mealType } from './recordTypes';

const meta: Meta = {
  title: 'health/RecordForm',
  parameters: { layout: 'centered' },
};
export default meta;

type Story = StoryObj;

export const NewMeal: Story = {
  render: () => (
    <RecordForm
      type={mealType}
      draft={{ ...mealType.draftOf(null), food: 'Porridge', calories: '350' }}
      label='New meal'
      onEdit={() => undefined}
      onSubmit={() => undefined}
    >
      <button type='submit'>Record meal</button>
    </RecordForm>
  ),
};

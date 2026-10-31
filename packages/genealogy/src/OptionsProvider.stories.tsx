// SPDX-License-Identifier: AGPL-3.0-or-later
import type { Meta, StoryObj } from '@storybook/nextjs';
import type { ReactElement } from 'react';
import { expect, within } from 'storybook/test';
import { FAMILY_TREE } from './options';
import { GenealogyOptionsProvider, useGenealogyOptions } from './OptionsProvider';

function Framing(): ReactElement {
  const options = useGenealogyOptions();
  return (
    <dl className='grid grid-cols-[auto_1fr] gap-x-4 text-sm'>
      <dt>Tree</dt>
      <dd>{options.tree}</dd>
      <dt>Lineage</dt>
      <dd>{options.lineage ? 'shown' : 'hidden'}</dd>
      <dt>GEDCOM</dt>
      <dd>{options.gedcom ? 'shown' : 'hidden'}</dd>
      <dt>Circles walk</dt>
      <dd>{options.circleKinds.join(', ')}</dd>
    </dl>
  );
}

const meta: Meta<typeof GenealogyOptionsProvider> = {
  title: 'genealogy/GenealogyOptionsProvider',
  component: GenealogyOptionsProvider,
  parameters: { layout: 'padded' },
  args: { options: FAMILY_TREE, children: <Framing /> },
};
export default meta;

type Story = StoryObj<typeof GenealogyOptionsProvider>;

export const FamilyHistory: Story = {};

export const SocialApp: Story = {
  args: {
    options: { ...FAMILY_TREE, tree: 'People', lineage: false, gedcom: false, circleKinds: ['partnership', 'dynamic'] },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText('People')).toBeInTheDocument();
    await expect(canvas.getByText('partnership, dynamic')).toBeInTheDocument();
  },
};

// SPDX-License-Identifier: AGPL-3.0-or-later
import type { Meta, StoryObj } from '@storybook/nextjs';

const meta: Meta = {
  title: 'Markdown/MarkdownBlock',
  tags: ['autodocs'],
};

export default meta;

export const Default: StoryObj = {
  render: () => <div>MarkdownBlock component</div>,
};

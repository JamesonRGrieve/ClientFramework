// SPDX-License-Identifier: AGPL-3.0-or-later
import { Controls, Description, Primary, Stories, Subtitle, Title } from '@storybook/addon-docs/blocks';
import { mswLoader } from 'msw-storybook-addon/csf3';
import React from 'react';
import './../src/app/globals.css'; // Import global styles for the app

const preview = {
  parameters: {
    actions: { argTypesRegex: '^on[A-Z].*' },
    controls: { matchers: { color: /(background|color)$/i, date: /Date$/ } },
    docs: {
      page: () => (
        <>
          <Title />
          <Subtitle />
          <Description />
          <Primary />
          <Controls />
          <Stories />
        </>
      ),
    },
    nextjs: {
      appDirectory: true, // Set to true if your project uses the app directory
    },
  },
  // A loader, not a parameter: Storybook runs preview-level loaders before each story. The addon's
  // default worker starts quietly and lets requests no story mocks through to the network.
  loaders: [mswLoader()],
};

export default preview;

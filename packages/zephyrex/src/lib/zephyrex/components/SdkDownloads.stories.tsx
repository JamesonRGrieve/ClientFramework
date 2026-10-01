// SPDX-License-Identifier: AGPL-3.0-or-later
import type { Meta, StoryObj } from '@storybook/nextjs';
import { http, HttpResponse } from 'msw';
import { SDK_LIST_PATH, type Sdk } from '../useSdks';
import { withZephyrexApi } from '../../../testing/storyRoot';
import { SdkDownloads } from './SdkDownloads';

const HTTP_UNAUTHORIZED = 401;

const sdk = (language: string, extension: string, size: number): Sdk => ({
  language,
  extension,
  version: '1.0.0a1',
  filename: `zephyrex-sdk-${language}.zip`,
  size,
  sha256: '3f786850e387550fdab836ed7e6dc881de23001b'.padEnd(64, '0'),
});

const listRoute = `*${SDK_LIST_PATH}`;
const serving = (sdks: Sdk[]) => ({ msw: { handlers: [http.get(listRoute, () => HttpResponse.json({ sdks }))] } });

const meta: Meta<typeof SdkDownloads> = {
  title: 'zephyrex/SdkDownloads',
  component: SdkDownloads,
  tags: ['autodocs'],
  decorators: [withZephyrexApi],
};

export default meta;

type Story = StoryObj<typeof SdkDownloads>;

export const AllThree: Story = {
  parameters: serving([
    sdk('python', 'meta_sdk_py', 184_320),
    sdk('typescript', 'meta_sdk_ts', 96_512),
    sdk('rust', 'meta_sdk_rs', 1_245_184),
  ]),
};

export const NoneGenerated: Story = { parameters: serving([]) };

export const SignedOut: Story = {
  parameters: {
    msw: {
      handlers: [
        http.get(listRoute, () => HttpResponse.json({ detail: 'Not authenticated' }, { status: HTTP_UNAUTHORIZED })),
      ],
    },
  },
};

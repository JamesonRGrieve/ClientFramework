// SPDX-License-Identifier: AGPL-3.0-or-later
import { readFile } from 'node:fs/promises';
import type { ReactNode } from 'react';
import { PrivacyPage } from 'zephyrex/pages/docs';

export default async function Privacy(): Promise<ReactNode> {
  return <PrivacyPage content={await readFile('src/content/PRIVACY_POLICY.md', 'utf8')} />;
}

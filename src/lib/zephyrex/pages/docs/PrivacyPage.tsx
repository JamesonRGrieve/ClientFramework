// SPDX-License-Identifier: AGPL-3.0-or-later
import type { ReactNode } from 'react';
import { SidebarPage } from '../../../../components/appwrapper/src/SidebarPage';
import MarkdownBlock from '../../../../components/markdown/MarkdownBlock';

/**
 * The app's privacy policy, given as Markdown. The app owns the policy text, so its
 * `app/docs/privacy/page.tsx` reads its own file and passes it in:
 *   export default async function Privacy() {
 *     return <PrivacyPage content={await readFile('src/content/PRIVACY_POLICY.md', 'utf8')} />;
 *   }
 */
export function PrivacyPage({ content }: { content: string }): ReactNode {
  return (
    <SidebarPage title='Privacy Policy'>
      <MarkdownBlock content={content} />
    </SidebarPage>
  );
}

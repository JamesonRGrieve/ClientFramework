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
  // The page body owns the one h1 (a SidebarPage title is chrome): the policy's own `# ` heading
  // when it starts with one, or "Privacy Policy" above it when it doesn't.
  const titled = /^\s*# /.test(content);
  return (
    <SidebarPage title='Privacy Policy'>
      {!titled && <h1 className='mb-4 text-2xl font-semibold tracking-tight sm:text-3xl'>Privacy Policy</h1>}
      <MarkdownBlock content={content} />
    </SidebarPage>
  );
}

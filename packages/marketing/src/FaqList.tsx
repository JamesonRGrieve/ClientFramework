// SPDX-License-Identifier: AGPL-3.0-or-later
import type { ReactNode } from 'react';
import type { Faq } from './content';

/** Questions as native disclosure widgets: keyboard- and screen-reader-friendly with no script. */
export function FaqList({ faqs }: { faqs: readonly Faq[] }): ReactNode {
  return (
    <div className='divide-y rounded-xl border'>
      {faqs.map((faq) => (
        <details key={faq.question} className='group p-4'>
          <summary className='flex cursor-pointer list-none items-center justify-between gap-4 font-medium marker:hidden focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring'>
            {faq.question}
            <span
              aria-hidden
              className='text-muted-foreground transition-transform group-open:rotate-45 motion-reduce:transition-none'
            >
              +
            </span>
          </summary>
          <p className='mt-3 text-muted-foreground'>{faq.answer}</p>
        </details>
      ))}
    </div>
  );
}

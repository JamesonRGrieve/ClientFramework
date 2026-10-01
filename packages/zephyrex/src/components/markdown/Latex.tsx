'use client';
// SPDX-License-Identifier: AGPL-3.0-or-later
import renderMathInElement, { type DelimiterSpec } from 'katex/contrib/auto-render';
import { type ReactElement, useEffect, useRef } from 'react';

/** Display math first, so `$$…$$` is not read as two empty inline spans. */
export const LATEX_DELIMITERS: DelimiterSpec[] = [
  { left: '$$', right: '$$', display: true },
  { left: '\\[', right: '\\]', display: true },
  { left: '$', right: '$', display: false },
  { left: '\\(', right: '\\)', display: false },
];

/**
 * Text with LaTeX between the usual delimiters, typeset by KaTeX. The text is set as text and
 * KaTeX builds the math nodes itself, so nothing is parsed as HTML; bad LaTeX shows as an error
 * in place instead of breaking the page.
 */
export function Latex({ children }: { children: string }): ReactElement {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = ref.current;
    if (element === null) {
      return;
    }
    element.textContent = children;
    renderMathInElement(element, { delimiters: LATEX_DELIMITERS, throwOnError: false });
  }, [children]);

  return <div ref={ref} className='latex' />;
}

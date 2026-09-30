// SPDX-License-Identifier: AGPL-3.0-or-later
// katex ships its auto-render entry (`katex/contrib/auto-render`) without typings.
declare module 'katex/contrib/auto-render' {
  import type { KatexOptions } from 'katex';

  export interface DelimiterSpec {
    left: string;
    right: string;
    display: boolean;
  }

  export interface RenderMathInElementOptions extends KatexOptions {
    delimiters?: DelimiterSpec[];
    ignoredTags?: string[];
    ignoredClasses?: string[];
    errorCallback?: (message: string, error: Error) => void;
  }

  export default function renderMathInElement(element: HTMLElement, options?: RenderMathInElementOptions): void;
}

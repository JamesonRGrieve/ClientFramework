// SPDX-License-Identifier: AGPL-3.0-or-later
import { createElement, type HTMLAttributes, type ReactNode } from 'react';

export type HeadingLevel = 1 | 2 | 3 | 4;

const DEEPEST: HeadingLevel = 4;

/** A heading whose level is chosen by the caller, so nested sections keep an unbroken outline. */
export function Heading({ level, ...props }: { level: HeadingLevel } & HTMLAttributes<HTMLHeadingElement>): ReactNode {
  return createElement(`h${level}`, props);
}

/** The next level down, capped at h4. */
export function subLevel(level: HeadingLevel): HeadingLevel {
  return level >= DEEPEST ? DEEPEST : ((level + 1) as HeadingLevel);
}

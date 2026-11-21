// SPDX-License-Identifier: AGPL-3.0-or-later
import React, { type ReactNode } from 'react';
import generateId from './generateID';

interface MarkdownHeadingProps {
  tag: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
  children: ReactNode;
  className?: string;
}

export default function MarkdownHeading({ tag, children, className, ...props }: MarkdownHeadingProps): ReactNode {
  let text = '';
  if (React.isValidElement<{ children?: ReactNode }>(children)) {
    const childText = children.props.children;
    text = typeof childText === 'string' ? childText : '';
  } else if (typeof children === 'string') {
    text = children;
  }

  const id = generateId(text);

  // A section heading has more room above it than below, so it reads as the start of what follows
  // (my-1 left it sitting on the list before it); none above when it opens the block.
  const baseClasses = 'mt-8 mb-3 first:mt-0 font-semibold tracking-tight text-balance';
  const sizeClasses = {
    h1: 'text-4xl',
    h2: 'text-3xl',
    h3: 'text-2xl',
    h4: 'text-xl',
    h5: 'text-lg',
    h6: 'text-base',
  };

  const HeadingTag = tag;

  return (
    <HeadingTag id={id} className={`${baseClasses} ${sizeClasses[tag]} ${className ?? ''}`} {...props}>
      {children}
    </HeadingTag>
  );
}

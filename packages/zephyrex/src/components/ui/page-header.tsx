// SPDX-License-Identifier: AGPL-3.0-or-later
import type { ReactNode } from 'react';

/**
 * The top of an app page: its title, a line on what it is for, and the page's own actions on the
 * right (on a phone, under the title). Forms to add something open from an action here rather than
 * filling the page. The page body owns its one h1, and this is it (a SidebarPage title is chrome).
 */
export function PageHeader({
  title,
  description,
  actions,
  meta,
}: {
  title: string;
  description?: ReactNode;
  actions?: ReactNode;
  /** A small line under the description: a count, a status, a last-updated time. */
  meta?: ReactNode;
}): ReactNode {
  return (
    <header className='flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between'>
      <div className='flex min-w-0 flex-col gap-1'>
        <h1 className='text-2xl font-semibold tracking-tight text-balance sm:text-3xl'>{title}</h1>
        {description !== undefined && <p className='max-w-prose text-muted-foreground'>{description}</p>}
        {meta !== undefined && <div className='text-sm text-muted-foreground'>{meta}</div>}
      </div>
      {actions !== undefined && <div className='flex shrink-0 flex-wrap items-center gap-2'>{actions}</div>}
    </header>
  );
}

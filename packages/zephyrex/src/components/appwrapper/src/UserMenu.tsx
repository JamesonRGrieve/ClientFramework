// SPDX-License-Identifier: AGPL-3.0-or-later
'use client';

import { LayoutGrid, MoonIcon } from 'lucide-react';
import type { ReactElement } from 'react';
import { useAppearance } from '@/components/theme/useAppearance';
import { useTheme } from '@/components/theme/useTheme';
import {
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuPortal,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

/** The theme picker submenu for the user menu. */
export const Themes = (): ReactElement => {
  const { themes, currentTheme, setTheme } = useTheme();
  return (
    <DropdownMenuSub>
      <DropdownMenuSubTrigger>
        <MoonIcon className='w-4 h-4 mr-2' />
        Themes
      </DropdownMenuSubTrigger>
      <DropdownMenuPortal>
        <DropdownMenuSubContent>
          <DropdownMenuLabel>Themes</DropdownMenuLabel>
          {themes.map((theme) => (
            <DropdownMenuItem
              key={theme}
              className={cn('capitalize', theme === currentTheme && 'bg-muted')}
              onClick={() => setTheme(theme)}
            >
              {theme}
            </DropdownMenuItem>
          ))}
        </DropdownMenuSubContent>
      </DropdownMenuPortal>
    </DropdownMenuSub>
  );
};
/** The appearance (layout density) picker submenu for the user menu. */
export const Appearances = (): ReactElement => {
  const { appearances, appearance, setAppearance } = useAppearance();
  return (
    <DropdownMenuSub>
      <DropdownMenuSubTrigger>
        <LayoutGrid className='w-4 h-4 mr-2' />
        Appearances
      </DropdownMenuSubTrigger>
      <DropdownMenuPortal>
        <DropdownMenuSubContent>
          <DropdownMenuLabel>Appearances</DropdownMenuLabel>
          {appearances.map((thisAppearance) => (
            <DropdownMenuItem
              key={thisAppearance}
              className={cn('capitalize', thisAppearance === appearance && 'bg-muted')}
              onClick={() => setAppearance(thisAppearance)}
            >
              {thisAppearance}
            </DropdownMenuItem>
          ))}
        </DropdownMenuSubContent>
      </DropdownMenuPortal>
    </DropdownMenuSub>
  );
};

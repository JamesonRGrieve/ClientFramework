'use client';

import { LuEye as Eye, LuMoon as Moon, LuSun as Sun } from 'react-icons/lu';
import { useTheme } from './useTheme';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

const icons = {
  dark: <Moon className='h-[1.2rem] w-[1.2rem]' />,
  colorblind: <Eye className='h-[1.2rem] w-[1.2rem]' />,
  light: <Sun className='h-[1.2rem] w-[1.2rem]' />,
  default: <Sun className='h-[1.2rem] w-[1.2rem]' />,
};

export function ThemeToggle({ initialTheme }: { initialTheme?: string }) {
  const { currentTheme, themes, setTheme } = useTheme([], initialTheme);
  const key = currentTheme?.includes('colorblind')
    ? 'colorblind'
    : currentTheme?.includes('dark')
      ? 'dark'
      : currentTheme === 'default'
        ? 'default'
        : 'light';

  const Icon = icons[key as keyof typeof icons];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant='outline' size='icon' className='rounded-full'>
          {Icon}
          <span className='sr-only'>Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align='end'>
        {themes.map((t) => {
          const label = t === 'default' ? 'light' : t;
          const value = t === 'default' ? 'light' : t;
          return (
            <DropdownMenuItem key={t} onClick={() => setTheme(value)} className='capitalize'>
              {label}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// SPDX-License-Identifier: AGPL-3.0-or-later
'use client';

import { Search, X } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';

export interface SearchInputProps {
  placeholder?: string;
  onSearch: (query: string) => void;
  onClear?: () => void;
  debounceMs?: number;
  className?: string;
}

export function SearchInput({
  placeholder = 'Search...',
  onSearch,
  onClear,
  debounceMs = 300,
  className,
}: SearchInputProps) {
  const [value, setValue] = useState('');
  const timerRef = useRef<ReturnType<typeof setTimeout>>();

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value;
      setValue(newValue);

      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        onSearch(newValue);
      }, debounceMs);
    },
    [onSearch, debounceMs],
  );

  const handleClear = useCallback(() => {
    setValue('');
    onSearch('');
    onClear?.();
  }, [onSearch, onClear]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  return (
    <div className={`relative flex items-center ${className ?? ''}`}>
      <Search className='absolute left-3 h-4 w-4 text-muted-foreground' />
      <input
        type='search'
        value={value}
        onChange={handleChange}
        placeholder={placeholder}
        className='h-9 w-full rounded-md border border-input bg-background pl-9 pr-9 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'
      />
      {value && (
        <button
          onClick={handleClear}
          className='absolute right-2 rounded-sm p-0.5 hover:bg-accent'
          aria-label='Clear search'
        >
          <X className='h-3 w-3' />
        </button>
      )}
    </div>
  );
}

'use client';

import { Check, ChevronsUpDown } from 'lucide-react';
import { type ReactElement, useId, useState } from 'react';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from 'zephyrex/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from 'zephyrex/ui/popover';
import type { Person } from './genealogyApi';
import { personColor, personInitials, personName } from './people';

/** A person's initials in their hue, sized for a list row. */
function Initials({ person }: { person: Pick<Person, 'id' | 'name'> }): ReactElement {
  return (
    <span
      aria-hidden='true'
      className={`inline-flex size-6 shrink-0 items-center justify-center rounded-full text-[0.65rem] font-semibold ${personColor(person)}`}
    >
      {personInitials(person)}
    </span>
  );
}

/**
 * A searchable person picker: a button that opens a filterable list of people, with an
 * optional extra choice at the top (such as "Someone new…"). Trees grow past what a row of
 * chips can hold, so this replaces a native select where any number of people may appear.
 */
export function PersonPicker({
  id,
  people,
  value,
  onChange,
  placeholder,
  extra,
}: {
  id: string;
  people: readonly Pick<Person, 'id' | 'name'>[];
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  extra?: { value: string; label: string };
}): ReactElement {
  const [open, setOpen] = useState(false);
  const listId = useId();
  const picked = people.find((person) => person.id === value);
  const choose = (next: string): void => {
    onChange(next);
    setOpen(false);
  };
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          id={id}
          type='button'
          role='combobox'
          aria-expanded={open}
          aria-controls={listId}
          className='flex h-9 w-full min-w-0 items-center gap-2 rounded-md border bg-background px-2 text-left text-sm shadow-xs transition-colors hover:bg-muted/50 focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none'
        >
          {picked !== undefined && <Initials person={picked} />}
          <span
            className={`min-w-0 flex-1 truncate ${picked === undefined && value !== extra?.value ? 'text-muted-foreground' : ''}`}
          >
            {picked !== undefined ? personName(picked) : value === extra?.value ? extra.label : placeholder}
          </span>
          <ChevronsUpDown aria-hidden='true' className='size-4 shrink-0 opacity-50' />
        </button>
      </PopoverTrigger>
      <PopoverContent id={listId} className='w-(--radix-popover-trigger-width) min-w-56 p-0' align='start'>
        <Command>
          <CommandInput placeholder='Search people…' />
          <CommandList>
            <CommandEmpty>Nobody by that name.</CommandEmpty>
            {extra !== undefined && (
              <CommandGroup>
                <CommandItem value={extra.label} onSelect={() => choose(extra.value)} className='gap-2'>
                  <span
                    aria-hidden='true'
                    className='inline-flex size-6 items-center justify-center rounded-full border border-dashed text-xs'
                  >
                    +
                  </span>
                  {extra.label}
                </CommandItem>
              </CommandGroup>
            )}
            <CommandGroup heading='People'>
              {people.map((person) => (
                <CommandItem
                  key={person.id}
                  value={`${personName(person)} ${person.id}`}
                  onSelect={() => choose(person.id)}
                  className='gap-2'
                >
                  <Initials person={person} />
                  <span className='min-w-0 flex-1 truncate'>{personName(person)}</span>
                  {person.id === value && <Check aria-hidden='true' className='size-4' />}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

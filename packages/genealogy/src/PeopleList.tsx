// SPDX-License-Identifier: AGPL-3.0-or-later
'use client';

import { Search } from 'lucide-react';
import { LoadProblem } from 'zephyrex/ui/load-problem';
import Link from 'next/link.js';
import { useRouter } from 'next/navigation.js';
import { type ReactElement, useId, useState } from 'react';
import { useClient, useUser } from 'zephyrex';
import { notify } from 'zephyrex/hooks/useToast';
import { Badge } from 'zephyrex/ui/badge';
import { Button } from 'zephyrex/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from 'zephyrex/ui/dialog';
import { Input } from 'zephyrex/ui/input';
import { SkeletonRows } from 'zephyrex/ui/skeleton';
import {
  ANCESTRY,
  genealogyApi,
  type Person,
  SIBLING_OF,
  useConnections,
  useMetamours,
  usePersons,
  useRelationships,
} from './genealogyApi';
import { relationshipLines } from './relationships';
import { lifeSpan, personHue, personInitials, personName } from './people';
import { PersonForm } from './PersonForm';
import { personPath } from './routes';
import { StartWithYou } from './StartWithYou';
import { useGenealogyOptions } from './OptionsProvider';

/** Above this many people the list gets a search box. */
const SEARCH_FROM = 6;

/** Someone's face in the list: their initials on their own colour. */
/** The kinds the Connection column reads from relationships rather than connections. */
const FAMILY_KINDS: ReadonlySet<string> = new Set([ANCESTRY, SIBLING_OF]);

function PersonInitials({ person }: { person: Person }): ReactElement {
  return (
    <span
      aria-hidden='true'
      className='inline-flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold text-white'
      style={{ backgroundColor: `hsl(${String(personHue(person))} 55% 30%)` }}
    >
      {personInitials(person)}
    </span>
  );
}

/** Adding someone: the person form in a dialog, then straight to them. */
function AddPerson({ onAdded }: { onAdded: () => Promise<unknown> }): ReactElement {
  const client = useClient();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Add person</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add a person</DialogTitle>
          <DialogDescription>
            Anyone in your life, on this app or not. You can record how you are connected next.
          </DialogDescription>
        </DialogHeader>
        <PersonForm
          submitLabel='Add person'
          onSave={async (fields) => {
            try {
              const added = await genealogyApi.createPerson(client, fields);
              await onAdded();
              setOpen(false);
              notify('Added', personName(added));
              // Straight to them, where how they are connected is recorded next.
              router.push(personPath(added.id));
              return null;
            } catch (error) {
              return error instanceof Error ? error.message : 'The person could not be added.';
            }
          }}
        />
      </DialogContent>
    </Dialog>
  );
}

/** The tie kinds' everyday names, for a tie without a subkind. */
const KIND_NAMES: Readonly<Record<string, string>> = {
  partnership: 'Partner',
  friendship: 'Friend',
  sibling: 'Sibling',
  acquaintance: 'Acquaintance',
  mentorship: 'Mentor',
};

const sentence = (value: string): string => {
  const words = value.replaceAll('_', ' ');
  return `${words.charAt(0).toUpperCase()}${words.slice(1)}`;
};

/** How each person is tied to you, by their id: "Dating", "Friend", "Metamour via Alex". */
type TieLabels = ReadonlyMap<string, string>;

/** Your ties, read from your own record; the table renders with them once they arrive. */
function YourTies({
  selfId,
  nameOf,
  children,
}: {
  selfId: string;
  nameOf: (id: string) => string;
  children: (ties: TieLabels) => ReactElement;
}): ReactElement {
  const connections = useConnections(selfId);
  const metamours = useMetamours(selfId);
  // Family ties (parents, children, siblings) are not connections; read them as the person page does.
  const asSubject = useRelationships(selfId, 'person_id');
  const asObject = useRelationships(selfId, 'target_person_id');
  const ties = new Map<string, string>();
  for (const metamour of metamours.data?.metamours ?? []) {
    ties.set(metamour.person_id, `Metamour via ${metamour.via.map((id) => nameOf(id).split(' ')[0]).join(', ')}`);
  }
  for (const tie of connections.data?.connections ?? []) {
    const label =
      tie.discriminator !== null && tie.discriminator !== ''
        ? sentence(tie.discriminator)
        : (KIND_NAMES[tie.kind] ?? sentence(tie.kind));
    const known = ties.get(tie.person_id);
    ties.set(
      tie.person_id,
      known === undefined || known.startsWith('Metamour') ? label : `${known}, ${label.toLowerCase()}`,
    );
  }
  for (const line of relationshipLines(asSubject.data ?? [], asObject.data ?? [])) {
    if (FAMILY_KINDS.has(line.relationships[0]?.kind ?? '') && !ties.has(line.relativeId)) {
      ties.set(line.relativeId, line.role);
    }
  }
  return children(ties);
}

/** Your ties when you are in your own tree; none (every Connection cell a dash) when you are not. */
function TiesOrNone({
  selfId,
  nameOf,
  children,
}: {
  selfId: string | null;
  nameOf: (id: string) => string;
  children: (ties: TieLabels) => ReactElement;
}): ReactElement {
  return selfId === null ? (
    children(new Map())
  ) : (
    <YourTies selfId={selfId} nameOf={nameOf}>
      {children}
    </YourTies>
  );
}

/** Everyone the user has recorded, as a searchable table, with a dialog to add someone. */
export function PeopleList(): ReactElement {
  const options = useGenealogyOptions();
  const persons = usePersons();
  const me = useUser().data?.id;
  const searchId = useId();
  const [query, setQuery] = useState('');
  const isSelf = (person: Person): boolean => me !== undefined && person.linked_user_id === me;
  // You first, then everyone else by name.
  const sorted = [...(persons.data ?? [])].sort(
    (a, b) => Number(isSelf(b)) - Number(isSelf(a)) || personName(a).localeCompare(personName(b)),
  );
  const needle = query.trim().toLowerCase();
  const selfId = sorted.find(isSelf)?.id ?? null;
  const nameOf = (id: string): string => {
    const found = sorted.find((person) => person.id === id);
    return found === undefined ? 'someone' : personName(found);
  };
  const shown = needle === '' ? sorted : sorted.filter((person) => personName(person).toLowerCase().includes(needle));

  return (
    <section aria-labelledby={`${searchId}-title`} className='grid gap-4'>
      <div className='flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between'>
        <div className='grid gap-1'>
          <h2 id={`${searchId}-title`} className='text-lg font-semibold'>
            {options.lineage ? 'People' : 'Everyone'}
            {sorted.length > 0 && (
              <span className='ml-2 text-sm font-normal tabular-nums text-muted-foreground'>{String(sorted.length)}</span>
            )}
          </h2>
          <p className='text-sm text-muted-foreground'>
            {options.lineage
              ? 'Everyone in your family tree. Open someone to record their relatives.'
              : 'Everyone you have recorded. Open someone to record how you are connected.'}
          </p>
        </div>
        <div className='flex flex-wrap items-center gap-2'>
          {sorted.length >= SEARCH_FROM && (
            <span className='relative'>
              <Search
                aria-hidden='true'
                className='pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground'
              />
              <Input
                id={searchId}
                type='search'
                aria-label='Search people'
                placeholder='Search people'
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                className='w-52 pl-8'
              />
            </span>
          )}
          <AddPerson onAdded={async () => persons.mutate()} />
        </div>
      </div>
      {persons.error !== undefined && (
        <LoadProblem what='your tree' error={persons.error} onRetry={async () => persons.mutate()} />
      )}
      {persons.error === undefined && persons.isLoading && sorted.length === 0 && (
        <SkeletonRows avatar label='Loading people' />
      )}
      {persons.error === undefined && !persons.isLoading && sorted.length === 0 && (
        <div className='rounded-lg border border-dashed'>
          <StartWithYou
            heading='Start with you'
            description='Nobody is recorded yet. Add yourself first, then the people in your life.'
            onStarted={async () => persons.mutate()}
          />
        </div>
      )}
      {sorted.length > 0 && (
        <TiesOrNone selfId={selfId} nameOf={nameOf}>
          {(ties) => (
            <div className='overflow-x-auto rounded-lg border'>
              <table aria-label='People' className='w-full text-sm'>
                <thead className='bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground'>
                  <tr>
                    <th scope='col' className='px-4 py-2 font-medium'>
                      Name
                    </th>
                    <th scope='col' className='hidden px-4 py-2 font-medium lg:table-cell'>
                      Connection
                    </th>
                    <th scope='col' className='hidden px-4 py-2 font-medium sm:table-cell'>
                      Born
                    </th>
                    <th scope='col' className='px-4 py-2 text-right font-medium'>
                      <span className='sr-only'>Account</span>
                    </th>
                  </tr>
                </thead>
                <tbody className='divide-y'>
                  {shown.map((person) => (
                    <tr key={person.id} className='group hover:bg-muted/50'>
                      <td className='px-4 py-2'>
                        <Link href={personPath(person.id)} className='flex items-center gap-3 font-medium'>
                          <PersonInitials person={person} />
                          <span className='min-w-0'>
                            <span className='block truncate group-hover:underline'>{personName(person)}</span>
                            {person.description !== null && person.description !== '' && (
                              <span className='block truncate text-xs font-normal text-muted-foreground'>
                                {person.description}
                              </span>
                            )}
                            {/* The Connection column shows from lg; below it, the tie sits under the name. */}
                            {person.id !== selfId && ties.get(person.id) !== undefined && (
                              <span className='block truncate text-xs font-normal text-muted-foreground lg:hidden'>
                                {ties.get(person.id)}
                              </span>
                            )}
                          </span>
                        </Link>
                      </td>
                      <td className='hidden px-4 py-2 text-muted-foreground lg:table-cell'>
                        {person.id === selfId ? '—' : (ties.get(person.id) ?? '—')}
                      </td>
                      <td className='hidden whitespace-nowrap px-4 py-2 tabular-nums text-muted-foreground sm:table-cell'>
                        {lifeSpan(person) === '' ? '—' : lifeSpan(person)}
                      </td>
                      <td className='whitespace-nowrap px-4 py-2 text-right'>
                        {me !== undefined && person.linked_user_id === me && <Badge>You</Badge>}
                        {person.linked_user_id !== null &&
                          person.linked_user_id !== undefined &&
                          person.linked_user_id !== me && <Badge variant='secondary'>On the app</Badge>}
                      </td>
                    </tr>
                  ))}
                  {shown.length === 0 && (
                    <tr>
                      <td colSpan={4} className='px-4 py-6 text-center text-muted-foreground'>
                        Nobody matches “{query.trim()}”.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </TiesOrNone>
      )}
    </section>
  );
}

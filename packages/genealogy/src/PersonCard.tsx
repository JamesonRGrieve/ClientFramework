// SPDX-License-Identifier: AGPL-3.0-or-later
'use client';

import { Button } from '@jgrieve/forms/components/ui/button';
import { Input } from '@jgrieve/forms/components/ui/input';
import { Label } from '@jgrieve/forms/components/ui/label';
import { type ReactElement, type ReactNode, type SyntheticEvent, useId, useState } from 'react';
import { UpgradePrompt, useClient, writeProblem } from 'zephyrex';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from 'zephyrex/ui/card';
import { type Attribute, genealogyApi, personCardPath, usePersonCard } from './genealogyApi';

/** A field a card section offers, with the units or size systems its value can be in. */
export interface CardField {
  label: string;
  units: readonly string[];
}

/**
 * A section of the card. A `locked` section (one the user's plan does not include) shows what is
 * already in it but offers an upgrade instead of new fields, naming `feature`.
 */
export interface CardSection {
  name: string;
  title: string;
  fields: readonly CardField[];
  locked?: boolean;
  feature?: string;
}

/** Where a fact the catalogue does not name is kept. */
const OTHER: CardSection = { name: 'other', title: 'Other', fields: [] };

const SELECT_CLASS = 'h-9 rounded-md border bg-background px-3 text-sm';

const humanize = (value: string): string => value.replaceAll('_', ' ');
const shownValue = (fact: Attribute): string =>
  fact.unit === null || fact.unit === undefined || fact.unit === '' ? fact.value : `${fact.value} ${fact.unit}`;

/** `facts` in each of `sections`, then any the catalogue does not name under "Other". */
function bySection(sections: readonly CardSection[], facts: readonly Attribute[]): [CardSection, Attribute[]][] {
  const known = new Set(sections.map((section) => section.name));
  const grouped: [CardSection, Attribute[]][] = sections.map((section) => [
    section,
    facts.filter((fact) => fact.category === section.name),
  ]);
  const other = facts.filter((fact) => !known.has(fact.category));
  return other.length === 0 ? grouped : [...grouped, [OTHER, other]];
}

function AddFact({
  personId,
  section,
  onAdded,
}: {
  personId: string;
  section: CardSection;
  onAdded: () => Promise<unknown>;
}): ReactElement {
  const ids = { label: useId(), value: useId(), unit: useId() };
  const client = useClient();
  const first = section.fields.at(0);
  const [label, setLabel] = useState(first?.label ?? '');
  const [value, setValue] = useState('');
  const [unit, setUnit] = useState(first?.units.at(0) ?? '');
  const [problem, setProblem] = useState<string | null>(null);
  const units = section.fields.find((field) => field.label === label)?.units ?? [];

  const submit = (event: SyntheticEvent<HTMLFormElement>): void => {
    event.preventDefault();
    if (label.trim() === '' || value.trim() === '') {
      setProblem('Say what it is and its value.');
      return;
    }
    void (async (): Promise<void> => {
      const failed = await writeProblem(
        genealogyApi.createAttribute(client, personId, {
          category: section.name,
          label: label.trim(),
          value: value.trim(),
          unit: units.length === 0 ? null : unit,
        }),
        'The field could not be added.',
      );
      setProblem(failed);
      if (failed === null) {
        setValue('');
        await onAdded();
      }
    })();
  };

  return (
    <form onSubmit={submit} aria-label={`Add to ${section.title}`} className='grid gap-2 border-t pt-3'>
      <div className='grid grid-cols-1 gap-2 sm:grid-cols-[1fr_1fr_auto_auto] sm:items-end'>
        <div className='grid gap-1'>
          <Label htmlFor={ids.label}>Field</Label>
          {section.fields.length === 0 ? (
            <Input id={ids.label} value={label} onChange={(event) => setLabel(event.target.value)} />
          ) : (
            <select
              id={ids.label}
              value={label}
              onChange={(event) => {
                setLabel(event.target.value);
                setUnit(section.fields.find((field) => field.label === event.target.value)?.units.at(0) ?? '');
              }}
              className={SELECT_CLASS}
            >
              {section.fields.map((field) => (
                <option key={field.label} value={field.label}>
                  {humanize(field.label)}
                </option>
              ))}
            </select>
          )}
        </div>
        <div className='grid gap-1'>
          <Label htmlFor={ids.value}>Value</Label>
          <Input id={ids.value} value={value} onChange={(event) => setValue(event.target.value)} />
        </div>
        {units.length > 0 && (
          <div className='grid gap-1'>
            <Label htmlFor={ids.unit}>Unit</Label>
            <select id={ids.unit} value={unit} onChange={(event) => setUnit(event.target.value)} className={SELECT_CLASS}>
              {units.map((choice) => (
                <option key={choice} value={choice}>
                  {choice}
                </option>
              ))}
            </select>
          </div>
        )}
        <Button type='submit' variant='secondary'>
          Add
        </Button>
      </div>
      {problem !== null && (
        <p role='alert' className='text-sm text-destructive'>
          {problem}
        </p>
      )}
    </form>
  );
}

function FactRow({
  fact,
  editable,
  actions,
  onChanged,
}: {
  fact: Attribute;
  editable: boolean;
  actions: ReactNode;
  onChanged: () => Promise<unknown>;
}): ReactElement {
  const client = useClient();
  const valueId = useId();
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(fact.value);
  const [problem, setProblem] = useState<string | null>(null);
  // A write that fails (a stale one included) says why and reloads the card as it is now.
  const run = (write: () => Promise<unknown>, fallback: string): void => {
    void (async (): Promise<void> => {
      const failed = await writeProblem(write(), fallback);
      setProblem(failed);
      if (failed === null) {
        setEditing(false);
      }
      await onChanged();
    })();
  };
  const name = humanize(fact.label);

  return (
    <li className='grid gap-2 py-2'>
      <div className='flex flex-wrap items-center gap-x-4 gap-y-2'>
        <span className='w-32 shrink-0 text-sm text-muted-foreground'>{name}</span>
        {editing ? (
          <form
            className='flex flex-1 flex-wrap items-center gap-2'
            onSubmit={(event) => {
              event.preventDefault();
              run(
                async () => genealogyApi.updateAttribute(client, fact, { value: value.trim() }),
                'The field could not be saved.',
              );
            }}
          >
            <Label htmlFor={valueId} className='sr-only'>
              {name}
            </Label>
            <Input id={valueId} value={value} onChange={(event) => setValue(event.target.value)} className='max-w-xs' />
            <Button type='submit' size='sm'>
              Save
            </Button>
            <Button type='button' size='sm' variant='ghost' onClick={() => setEditing(false)}>
              Cancel
            </Button>
          </form>
        ) : (
          <span className='flex-1 font-medium'>{shownValue(fact)}</span>
        )}
        {editable && !editing && (
          <span className='flex flex-wrap items-center gap-1'>
            {actions}
            <Button size='sm' variant='ghost' onClick={() => setEditing(true)} aria-label={`Edit ${name}`}>
              Edit
            </Button>
            <Button
              size='sm'
              variant='ghost'
              aria-label={`Remove ${name}`}
              onClick={() => {
                run(async () => genealogyApi.deleteAttribute(client, fact), 'The field could not be removed.');
              }}
            >
              Remove
            </Button>
          </span>
        )}
      </div>
      {problem !== null && (
        <p role='alert' className='text-sm text-destructive'>
          {problem}
        </p>
      )}
    </li>
  );
}

/**
 * A person's card, section by section from `sections`: what the user keeps about them (on their
 * own record, their profile) to add to, edit and remove, then what the person published to the
 * user, read-only. `cardPath` reads it from an app's own route (one that reconciles sharing first);
 * `actions` adds controls beside each of the user's own facts, such as publishing one.
 */
export function PersonCard({
  personId,
  sections,
  title = 'Card',
  description,
  cardPath = personCardPath(personId),
  actions,
}: {
  personId: string;
  sections: readonly CardSection[];
  title?: ReactNode;
  description?: ReactNode;
  cardPath?: string;
  actions?: (fact: Attribute) => ReactNode;
}): ReactElement {
  const card = usePersonCard(personId, cardPath);
  const refresh = async (): Promise<unknown> => card.mutate();
  const published = card.data?.published ?? [];

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description !== undefined && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent className='grid gap-6'>
        {card.error !== undefined && (
          <p role='alert' className='text-sm text-destructive'>
            The card could not be loaded: {card.error.message}
          </p>
        )}
        {card.data === undefined && card.error === undefined && <p className='text-sm text-muted-foreground'>Loading…</p>}
        {card.data !== undefined &&
          bySection(sections, card.data.notes).map(([section, facts]) => (
            <section key={section.name} aria-label={section.title} className='grid gap-1 rounded-md border px-4 py-3'>
              <h3 className='text-sm font-semibold uppercase tracking-wide text-muted-foreground'>{section.title}</h3>
              {facts.length > 0 && (
                <ul className='divide-y'>
                  {facts.map((fact) => (
                    <FactRow
                      key={fact.id}
                      fact={fact}
                      editable={section.locked !== true}
                      actions={actions?.(fact)}
                      onChanged={refresh}
                    />
                  ))}
                </ul>
              )}
              {section.locked === true ? (
                <UpgradePrompt feature={section.feature ?? section.name} title={section.title} />
              ) : (
                section !== OTHER && <AddFact personId={personId} section={section} onAdded={refresh} />
              )}
            </section>
          ))}
        {published.length > 0 && (
          <section aria-label='Shared with you' className='grid gap-2'>
            <h3 className='text-sm font-semibold'>Shared with you</h3>
            {bySection(sections, published)
              .filter(([, facts]) => facts.length > 0)
              .map(([section, facts]) => (
                <dl
                  key={section.name}
                  className='grid grid-cols-[8rem_1fr] gap-x-4 gap-y-1 rounded-md border px-4 py-3 text-sm'
                >
                  <dt className='col-span-2 font-semibold uppercase tracking-wide text-muted-foreground'>{section.title}</dt>
                  {facts.map((fact) => (
                    <div key={fact.id} className='contents'>
                      <dt className='text-muted-foreground'>{humanize(fact.label)}</dt>
                      <dd className='font-medium'>{shownValue(fact)}</dd>
                    </div>
                  ))}
                </dl>
              ))}
          </section>
        )}
      </CardContent>
    </Card>
  );
}

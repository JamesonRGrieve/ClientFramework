// SPDX-License-Identifier: AGPL-3.0-or-later
'use client';

import { Button } from '@jgrieve/forms/components/ui/button';
import { Input } from '@jgrieve/forms/components/ui/input';
import { Label } from '@jgrieve/forms/components/ui/label';
import { type ReactElement, type ReactNode, type SyntheticEvent, useId, useState } from 'react';
import { UpgradePrompt, useClient, writeProblem } from 'zephyrex';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from 'zephyrex/ui/card';
import { type Attribute, genealogyApi, personCardPath, usePersonCard } from './genealogyApi';
import {
  type CardScale,
  formatScaled,
  MAX_STRENGTH,
  MIN_STRENGTH,
  parseScaled,
  type ScalePoint,
  scaledProblem,
} from './scales';

/**
 * A field a card section offers, with the units or size systems its value can be in, and the values
 * it may take when it is a type rather than free text (an MBTI type, say).
 */
export interface CardField {
  label: string;
  units: readonly string[];
  choices?: readonly string[];
  /**
   * When set, the value is a type read off these axes, one pole of each, with how strongly when a
   * result gives it (an MBTI type with its percentages); it is stored as readable text.
   */
  scales?: readonly CardScale[];
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
  /** Values hidden until asked for (codes and the like). */
  sensitive?: boolean;
}

/** Where a fact the catalogue does not name is kept. */
const OTHER: CardSection = { name: 'other', title: 'Other', fields: [] };

const SELECT_CLASS = 'h-9 rounded-md border bg-background px-3 text-sm';

/** A field's name as a heading: "dietary" → "Dietary", "best_friend" → "Best friend". */
const humanize = (value: string): string => {
  const words = value.replaceAll('_', ' ');
  return words.charAt(0).toUpperCase() + words.slice(1);
};
const shownValue = (fact: Attribute): string =>
  fact.unit === null || fact.unit === undefined || fact.unit === '' ? fact.value : `${fact.value} ${fact.unit}`;

const NO_CHOICES: readonly string[] = [];
const NO_SCALES: readonly CardScale[] = [];

/** A scaled value: a pole of each axis, with an optional strength towards it. */
function ScaleInput({
  id,
  value,
  scales,
  onChange,
}: {
  id: string;
  value: string;
  scales: readonly CardScale[];
  onChange: (value: string) => void;
}): ReactElement {
  const [points, setPoints] = useState<ScalePoint[]>(() => parseScaled(value, scales));
  const problem = scaledProblem(points);
  const change = (index: number, point: ScalePoint): void => {
    const next = points.map((current, at) => (at === index ? point : current));
    setPoints(next);
    // Nothing to store while a strength is out of range, so the form cannot save it.
    onChange(scaledProblem(next) === null ? formatScaled(next) : '');
  };
  return (
    <div className='grid gap-2'>
      {scales.map((scale, index) => {
        const point = points[index] ?? { letter: '', strength: null };
        const [first, second] = scale.poles;
        const axis = `${first.name} or ${second.name}`;
        const chosen = scale.poles.find((pole) => pole.letter === point.letter);
        return (
          <fieldset key={axis} aria-label={axis} className='m-0 flex flex-wrap items-center gap-2 border-0 p-0'>
            <select
              id={index === 0 ? id : undefined}
              aria-label={axis}
              value={point.letter}
              onChange={(event) => change(index, { ...point, letter: event.target.value })}
              className={SELECT_CLASS}
            >
              <option value=''>Choose…</option>
              {scale.poles.map((pole) => (
                <option key={pole.letter} value={pole.letter}>
                  {pole.letter} · {pole.name}
                </option>
              ))}
            </select>
            <Input
              type='number'
              inputMode='numeric'
              min={MIN_STRENGTH}
              max={MAX_STRENGTH}
              step={1}
              aria-label={`How strongly ${chosen?.name ?? axis}, in percent`}
              placeholder='%'
              disabled={chosen === undefined}
              value={point.strength === null ? '' : String(point.strength)}
              onChange={(event) =>
                change(index, { ...point, strength: event.target.value === '' ? null : Number(event.target.value) })
              }
              className='w-20'
            />
          </fieldset>
        );
      })}
      {problem !== null && (
        <p role='alert' className='text-sm text-destructive'>
          {problem}
        </p>
      )}
    </div>
  );
}

/** The value of a field: read off its `scales`, one of its `choices`, or otherwise free text. */
function ValueInput({
  id,
  value,
  choices,
  scales = NO_SCALES,
  onChange,
  className,
}: {
  id: string;
  value: string;
  choices: readonly string[];
  scales?: readonly CardScale[];
  onChange: (value: string) => void;
  className?: string;
}): ReactElement {
  if (scales.length > 0) {
    return <ScaleInput id={id} value={value} scales={scales} onChange={onChange} />;
  }
  if (choices.length === 0) {
    return <Input id={id} value={value} onChange={(event) => onChange(event.target.value)} className={className} />;
  }
  return (
    <select id={id} value={value} onChange={(event) => onChange(event.target.value)} className={SELECT_CLASS}>
      <option value=''>Choose…</option>
      {choices.map((choice) => (
        <option key={choice} value={choice}>
          {choice}
        </option>
      ))}
    </select>
  );
}

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
  used,
  onAdded,
}: {
  personId: string;
  section: CardSection;
  /** The fields already filled: the form starts on the first that is not. */
  used: readonly string[];
  onAdded: () => Promise<unknown>;
}): ReactElement {
  const ids = { label: useId(), value: useId(), unit: useId() };
  const client = useClient();
  // A section with nothing in it yet opens on its form; one with facts keeps it behind a button.
  const [open, setOpen] = useState(used.length === 0);
  const first = section.fields.find((candidate) => !used.includes(candidate.label)) ?? section.fields.at(0);
  const [label, setLabel] = useState(first?.label ?? '');
  const [value, setValue] = useState('');
  const [unit, setUnit] = useState(first?.units.at(0) ?? '');
  const [problem, setProblem] = useState<string | null>(null);
  const field = section.fields.find((candidate) => candidate.label === label);
  const units = field?.units ?? [];

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

  if (!open) {
    return (
      <div>
        <Button type='button' variant='ghost' size='sm' onClick={() => setOpen(true)}>
          + Add to {section.title.toLowerCase()}
        </Button>
      </div>
    );
  }
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
                setValue('');
                setUnit(section.fields.find((candidate) => candidate.label === event.target.value)?.units.at(0) ?? '');
              }}
              className={SELECT_CLASS}
            >
              {section.fields.map((option) => (
                <option key={option.label} value={option.label}>
                  {humanize(option.label)}
                </option>
              ))}
            </select>
          )}
        </div>
        <div className='grid gap-1'>
          <Label htmlFor={ids.value}>Value</Label>
          <ValueInput
            key={label}
            id={ids.value}
            value={value}
            choices={field?.choices ?? NO_CHOICES}
            scales={field?.scales ?? NO_SCALES}
            onChange={setValue}
          />
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
  choices,
  scales,
  hidden,
  editable,
  actions,
  onChanged,
}: {
  fact: Attribute;
  /** The values the fact's field may take; free text when empty. */
  choices: readonly string[];
  /** The axes the fact's value is read off, when it is scaled. */
  scales: readonly CardScale[];
  /** Whether the value starts hidden, shown only on asking. */
  hidden: boolean;
  editable: boolean;
  actions: ReactNode;
  onChanged: () => Promise<unknown>;
}): ReactElement {
  const client = useClient();
  const valueId = useId();
  const [editing, setEditing] = useState(false);
  const [shown, setShown] = useState(!hidden);
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
            <ValueInput
              id={valueId}
              value={value}
              choices={choices}
              scales={scales}
              onChange={setValue}
              className='max-w-xs'
            />
            <Button type='submit' size='sm'>
              Save
            </Button>
            <Button type='button' size='sm' variant='ghost' onClick={() => setEditing(false)}>
              Cancel
            </Button>
          </form>
        ) : (
          <span className='flex flex-1 items-center gap-2 font-medium'>
            {shown ? (
              shownValue(fact)
            ) : (
              <span>
                <span aria-hidden='true'>••••••</span>
                <span className='sr-only'>Hidden</span>
              </span>
            )}
            {hidden && (
              <Button
                size='sm'
                variant='ghost'
                onClick={() => setShown(!shown)}
                aria-label={`${shown ? 'Hide' : 'Show'} ${name}`}
              >
                {shown ? 'Hide' : 'Show'}
              </Button>
            )}
          </span>
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

/** The sections a plan locks that hold nothing: named together once, not one prompt each. */
function lockedAndEmpty(sections: readonly CardSection[], notes: readonly Attribute[]): CardSection[] {
  return bySection(sections, notes)
    .filter(([section, facts]) => section.locked === true && facts.length === 0)
    .map(([section]) => section);
}

/** "A paid plan unlocks measurements, sizes, favourites and codes", with where to see the plans. */
function LockedSections({ sections }: { sections: readonly CardSection[] }): ReactElement | null {
  const first = sections.at(0);
  if (first === undefined) {
    return null;
  }
  const titles = sections.map((section) => section.title.toLowerCase());
  const named = titles.length === 1 ? titles.join('') : `${titles.slice(0, -1).join(', ')} and ${titles.at(-1) ?? ''}`;
  return (
    <section aria-label='Locked sections' className='rounded-md border border-dashed px-4 py-3'>
      <UpgradePrompt feature={first.feature ?? first.name} title={named} />
    </section>
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
          bySection(sections, card.data.notes)
            .filter(([section, facts]) => section.locked !== true || facts.length > 0)
            .map(([section, facts]) => (
              <section key={section.name} aria-label={section.title} className='grid gap-1 rounded-md border px-4 py-3'>
                <h3 className='text-sm font-semibold uppercase tracking-wide text-muted-foreground'>{section.title}</h3>
                {facts.length > 0 && (
                  <ul className='divide-y'>
                    {facts.map((fact) => (
                      <FactRow
                        key={fact.id}
                        fact={fact}
                        choices={section.fields.find((field) => field.label === fact.label)?.choices ?? NO_CHOICES}
                        scales={section.fields.find((field) => field.label === fact.label)?.scales ?? NO_SCALES}
                        hidden={section.sensitive === true}
                        editable={section.locked !== true}
                        actions={actions?.(fact)}
                        onChanged={refresh}
                      />
                    ))}
                  </ul>
                )}
                {section.locked === true ? (
                  <UpgradePrompt feature={section.feature ?? section.name} title={section.title} compact />
                ) : (
                  section !== OTHER && (
                    <AddFact
                      personId={personId}
                      section={section}
                      used={facts.map((fact) => fact.label)}
                      onAdded={refresh}
                    />
                  )
                )}
              </section>
            ))}
        {card.data !== undefined && <LockedSections sections={lockedAndEmpty(sections, card.data.notes)} />}
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

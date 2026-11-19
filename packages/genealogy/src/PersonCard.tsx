// SPDX-License-Identifier: AGPL-3.0-or-later
'use client';

import { ChoiceChip } from 'zephyrex/ui/choice-chip';
import { CopyButton } from 'zephyrex/ui/copy-button';
import { chipGroup } from 'zephyrex/hooks/chipKeys';
import { LoadProblem } from 'zephyrex/ui/load-problem';
import { SkeletonRows } from 'zephyrex/ui/skeleton';
import { Button } from '@jgrieve/forms/components/ui/button';
import { Input } from '@jgrieve/forms/components/ui/input';
import { Label } from '@jgrieve/forms/components/ui/label';
import { type CSSProperties, type ReactElement, type ReactNode, type SyntheticEvent, useId, useState } from 'react';
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

/** A one-tap choice; pressed when chosen. */
/** Up to this many short choices show as a grid of codes rather than a list. */
const GRID_CHOICES_MOST = 24;
const GRID_CHOICE_LONGEST = 5;
const GRID_COLUMNS_WIDE = 9;

const CHIP =
  'rounded-full border px-3 py-1 text-sm text-muted-foreground transition-colors hover:bg-muted aria-pressed:border-primary aria-pressed:bg-primary/10 aria-pressed:text-foreground';
const SELECT_CLASS = 'h-9 rounded-md border bg-background px-3 text-sm';

/** Names whose usual spelling isn't the stored name with its first letter raised. */
const SPELLED: Readonly<Partial<Record<string, string>>> = { 'wi-fi': 'Wi-Fi', wifi: 'Wi-Fi', pin: 'PIN' };

/** A field's name as a heading: "dietary" → "Dietary", "best_friend" → "Best friend", "wi-fi" → "Wi-Fi". */
const humanize = (value: string): string => {
  const known = SPELLED[value.toLowerCase()];
  if (known !== undefined) {
    return known;
  }
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
          <fieldset
            key={axis}
            aria-label={axis}
            className='m-0 grid min-w-0 grid-cols-[minmax(0,1fr)_minmax(0,1fr)_4.5rem] items-center gap-2 border-0 p-0 max-sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_3.25rem] max-sm:gap-1.5'
          >
            {scale.poles.map((pole, at) => (
              <button
                key={pole.letter}
                id={index === 0 && at === 0 ? id : undefined}
                type='button'
                aria-pressed={point.letter === pole.letter}
                onClick={() => change(index, { ...point, letter: point.letter === pole.letter ? '' : pole.letter })}
                className={`${CHIP} truncate text-left max-sm:px-2.5 max-sm:text-xs`}
              >
                <span className='font-semibold'>{pole.letter}</span> · {pole.name}
              </button>
            ))}
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
              className='w-full'
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
  name,
}: {
  id: string;
  /** What the value is of, for a control a `<label>` cannot name (the code grid). */
  name: string;
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
  if (choices.length <= GRID_CHOICES_MOST && choices.every((choice) => choice.length <= GRID_CHOICE_LONGEST)) {
    // Short codes (Enneagram types): a dense grid shows them all at once; picking the chosen one clears it.
    return (
      <div
        id={id}
        role='radiogroup'
        aria-label={name}
        // From sm, fill down the columns, so a code's variants (an Enneagram core's two wings) stack.
        style={{ '--code-rows': String(Math.ceil(choices.length / GRID_COLUMNS_WIDE)) } as CSSProperties}
        className='grid w-full max-w-md grid-cols-6 gap-1 sm:grid-flow-col sm:grid-cols-9 sm:grid-rows-[repeat(var(--code-rows),auto)]'
      >
        <div className='contents' ref={chipGroup}>
          {choices.map((choice) => (
            <ChoiceChip
              key={choice}
              checked={value === choice}
              onClick={() => onChange(value === choice ? '' : choice)}
              className='rounded-md border py-1 text-center font-mono text-xs tabular-nums text-muted-foreground transition-colors hover:bg-muted aria-checked:border-primary aria-checked:bg-primary aria-checked:text-primary-foreground'
            >
              {choice}
            </ChoiceChip>
          ))}
        </div>
      </div>
    );
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
  startOpen = false,
}: {
  personId: string;
  section: CardSection;
  /** The fields already filled: the form starts on the first that is not. */
  used: readonly string[];
  onAdded: () => Promise<unknown>;
  /** Open the form straight away (the section was just picked to add to). */
  startOpen?: boolean;
}): ReactElement {
  const ids = { label: useId(), value: useId(), unit: useId() };
  const client = useClient();
  // Every section keeps its form behind a button, so an empty card reads as a list of what it can hold.
  const [open, setOpen] = useState(startOpen);
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
      <div className='grid grid-cols-1 gap-2 sm:grid-cols-[minmax(0,1fr)_auto_auto] sm:items-end'>
        <div className={section.fields.length === 0 ? 'grid gap-1 sm:col-span-full' : 'col-span-full grid gap-1'}>
          {section.fields.length === 0 ? (
            <Label htmlFor={ids.label}>Field</Label>
          ) : (
            <span className='text-sm font-medium'>Field</span>
          )}
          {section.fields.length === 0 ? (
            <Input id={ids.label} value={label} onChange={(event) => setLabel(event.target.value)} />
          ) : (
            <fieldset id={ids.label} aria-label='Field' className='min-w-0 flex flex-wrap gap-1.5'>
              <div className='contents' ref={chipGroup}>
                {section.fields.map((option) => (
                  <button
                    key={option.label}
                    type='button'
                    aria-pressed={label === option.label}
                    onClick={() => {
                      setLabel(option.label);
                      setValue('');
                      setUnit(option.units.at(0) ?? '');
                    }}
                    className={CHIP}
                  >
                    {humanize(option.label)}
                  </button>
                ))}
              </div>
            </fieldset>
          )}
        </div>
        <div className='grid min-w-0 gap-1'>
          <Label htmlFor={ids.value}>Value</Label>
          <ValueInput
            key={label}
            id={ids.value}
            name={humanize(label)}
            value={value}
            choices={field?.choices ?? NO_CHOICES}
            scales={field?.scales ?? NO_SCALES}
            onChange={setValue}
          />
        </div>
        {units.length > 0 && (
          <div className='grid gap-1'>
            <span className='text-sm font-medium'>Unit</span>
            <fieldset id={ids.unit} aria-label='Unit' className='min-w-0 flex h-9 items-center gap-1'>
              <div className='contents' ref={chipGroup}>
                {units.map((choice) => (
                  <button
                    key={choice}
                    type='button'
                    aria-pressed={unit === choice}
                    onClick={() => setUnit(choice)}
                    className={CHIP}
                  >
                    {choice}
                  </button>
                ))}
              </div>
            </fieldset>
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
    <li className='group grid gap-2 py-1.5 text-sm'>
      <div className='grid grid-cols-[6.5rem_minmax(0,1fr)] items-center gap-x-3 gap-y-1 sm:grid-cols-[6.5rem_minmax(0,1fr)_auto]'>
        <span className='text-muted-foreground'>{name}</span>
        {editing ? (
          <form
            className='col-span-2 flex flex-wrap items-center gap-2'
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
              name={name}
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
          <span className='flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1 font-medium'>
            {shown ? (
              <span className='min-w-24 flex-1 [overflow-wrap:anywhere]'>{shownValue(fact)}</span>
            ) : (
              <span className='whitespace-nowrap tracking-widest'>
                <span aria-hidden='true'>••••••</span>
                <span className='sr-only'>Hidden</span>
              </span>
            )}
            {hidden && (
              <Button
                size='sm'
                variant='ghost'
                className='h-7 px-2 text-xs'
                onClick={() => setShown(!shown)}
                aria-label={`${shown ? 'Hide' : 'Show'} ${name}`}
              >
                {shown ? 'Hide' : 'Show'}
              </Button>
            )}
            {hidden && shown && <CopyButton content={fact.value} />}
          </span>
        )}
        {editable && !editing && (
          <span className='col-start-2 flex min-w-0 flex-wrap items-center gap-0.5 sm:col-start-auto sm:justify-end'>
            {actions}
            <span className='flex items-center transition-opacity pointer-fine:opacity-0 pointer-fine:group-hover:opacity-100 pointer-fine:group-focus-within:opacity-100'>
              <Button
                size='sm'
                variant='ghost'
                className='h-7 px-2 text-xs'
                onClick={() => setEditing(true)}
                aria-label={`Edit ${name}`}
              >
                Edit
              </Button>
              <Button
                size='sm'
                variant='ghost'
                className='h-7 px-2 text-xs'
                aria-label={`Remove ${name}`}
                onClick={() => {
                  run(async () => genealogyApi.deleteAttribute(client, fact), 'The field could not be removed.');
                }}
              >
                Remove
              </Button>
            </span>
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

/** The sections with nothing in them yet, one chip each: picking one opens its form above. */
function EmptySections({
  sections,
  onPick,
}: {
  sections: readonly CardSection[];
  onPick: (name: string) => void;
}): ReactElement | null {
  if (sections.length === 0) {
    return null;
  }
  return (
    <fieldset aria-label='Add to the card' className='min-w-0 grid gap-2'>
      <span className='text-sm text-muted-foreground'>Add to the card</span>
      <div className='flex flex-wrap gap-1.5' ref={chipGroup}>
        {sections.map((section) => (
          <button key={section.name} type='button' onClick={() => onPick(section.name)} className={CHIP}>
            <span aria-hidden='true'>+ </span>
            {section.title}
          </button>
        ))}
      </div>
    </fieldset>
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
  // Empty sections picked from the chips below, shown with their form open.
  const [picked, setPicked] = useState<string[]>([]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description !== undefined && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent className='grid gap-6'>
        {card.error !== undefined && <LoadProblem what='the card' error={card.error} onRetry={async () => card.mutate()} />}
        {card.data === undefined && card.error === undefined && <SkeletonRows rows={3} label='Loading the card' />}
        {card.data !== undefined && (
          <div className='grid grid-cols-1 gap-3 md:grid-cols-2'>
            {bySection(sections, card.data.notes)
              .filter(([section, facts]) => section.locked !== true || facts.length > 0)
              // A section with nothing in it waits as a chip below until it is picked.
              .filter(([section, facts]) => facts.length > 0 || section.locked === true || picked.includes(section.name))
              .map(([section, facts]) => (
                <section
                  key={section.name}
                  aria-label={section.title}
                  className='grid content-start gap-1 rounded-md border px-4 py-3'
                >
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
                        startOpen={facts.length === 0}
                      />
                    )
                  )}
                </section>
              ))}
          </div>
        )}
        {card.data !== undefined && (
          <EmptySections
            sections={bySection(sections, card.data.notes)
              .filter(
                ([section, facts]) =>
                  facts.length === 0 && section.locked !== true && section !== OTHER && !picked.includes(section.name),
              )
              .map(([section]) => section)}
            onPick={(name) => setPicked([...picked, name])}
          />
        )}
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

// SPDX-License-Identifier: AGPL-3.0-or-later
'use client';

import { type ReactElement, type ReactNode, type SyntheticEvent, useId, useState } from 'react';
import { useClient, writeProblem } from 'zephyrex';
import { ChoiceChip } from 'zephyrex/ui/choice-chip';
import { Button } from 'zephyrex/ui/button';
import { Input } from 'zephyrex/ui/input';
import { findMidpoint, useNearby, usePlaceCategories } from './mapsApi';
import {
  distanceLabel,
  durationLabel,
  type KnownPlace,
  type Leg,
  mapLink,
  MAX_LOCATIONS,
  type Midpoint,
  type Mode,
  MODES,
  type Place,
} from './mapsModel';
import { MeetMap } from './MeetMap';

/** A small icon per way of travelling (shapes from Lucide, ISC licence). */
const MODE_ICON_PATHS: Readonly<Partial<Record<string, readonly string[]>>> = {
  driving: [
    'M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2',
    'M9 17h6',
    'M7 17m-2 0a2 2 0 1 0 4 0a2 2 0 1 0 -4 0',
    'M17 17m-2 0a2 2 0 1 0 4 0a2 2 0 1 0 -4 0',
  ],
  walking: [
    'M4 16v-2.38C4 11.5 2.97 10.5 3 8c.03-2.72 1.49-6 4.5-6C9.37 2 10 3.8 10 5.5c0 3.11-2 5.66-2 8.68V16a2 2 0 1 1-4 0Z',
    'M20 20v-2.38c0-2.12 1.03-3.12 1-5.62-.03-2.72-1.49-6-4.5-6C14.63 6 14 7.8 14 9.5c0 3.11 2 5.66 2 8.68V20a2 2 0 1 0 4 0Z',
    'M16 17h4',
    'M4 13h4',
  ],
  bicycling: [
    'M18.5 17.5m-3.5 0a3.5 3.5 0 1 0 7 0a3.5 3.5 0 1 0 -7 0',
    'M5.5 17.5m-3.5 0a3.5 3.5 0 1 0 7 0a3.5 3.5 0 1 0 -7 0',
    'M15 6m-1 0a1 1 0 1 0 2 0a1 1 0 1 0 -2 0',
    'M12 17.5V14l-3-3 4-3 2 3h2',
  ],
  transit: [
    'M8 3.1V7a4 4 0 0 0 8 0V3.1',
    'm9 15-1-1',
    'm15 15 1-1',
    'M9 19c-2.8 0-5-2.2-5-5v-4a8 8 0 0 1 16 0v4c0 2.8-2.2 5-5 5Z',
    'm8 19-2 3',
    'm16 19 2 3',
  ],
};

function ModeIcon({ mode }: { mode: string }): ReactElement | null {
  const paths = MODE_ICON_PATHS[mode];
  if (paths === undefined) {
    return null;
  }
  return (
    <svg
      aria-hidden='true'
      viewBox='0 0 24 24'
      fill='none'
      stroke='currentColor'
      strokeWidth={2}
      strokeLinecap='round'
      strokeLinejoin='round'
      className='size-4 shrink-0 sm:size-3.5'
    >
      {paths.map((d) => (
        <path key={d} d={d} />
      ))}
    </svg>
  );
}

const CHIP =
  'rounded-full border px-3 py-1 text-sm text-muted-foreground transition-colors hover:bg-muted aria-checked:border-primary aria-checked:bg-primary/10 aria-checked:text-foreground';
/** A travel mode's chip: a rounded tile with the icon above the word on a phone, a pill from sm. */
const MODE_CHIP =
  'flex min-w-0 flex-col items-center justify-center gap-1 rounded-md px-1 py-2 text-xs sm:inline-flex sm:flex-row sm:gap-1.5 sm:rounded-full sm:px-3 sm:py-1 sm:text-sm';
const LINK = 'underline underline-offset-4';
const OSM_COPYRIGHT = 'https://www.openstreetmap.org/copyright';
const MIN_LOCATIONS = 2;
const NOTHING = '';

const travelled: Record<Mode, string> = {
  driving: 'by car',
  walking: 'on foot',
  bicycling: 'by bike',
  transit: 'by transit',
};

function LegRow({ leg, label, mode }: { leg: Leg; label: string; mode: Mode }): ReactNode {
  const routed = leg.duration_s !== null && leg.duration_s !== undefined;
  return (
    <li className='flex flex-wrap justify-between gap-2 py-2'>
      <span className='font-medium'>{label}</span>
      <span className='text-sm text-muted-foreground'>
        {routed
          ? `${durationLabel(leg.duration_s ?? 0)} ${travelled[mode]} (${distanceLabel(leg.distance_m ?? leg.straight_m)})`
          : `No route found; ${distanceLabel(leg.straight_m)} in a straight line`}
      </span>
    </li>
  );
}

function PlaceRow({ place }: { place: Place }): ReactNode {
  const website = place.website ?? null;
  return (
    <li className='grid gap-1 py-2'>
      <div className='flex flex-wrap items-baseline justify-between gap-2'>
        <span className='font-medium'>{place.name}</span>
        {place.distance_m !== null && place.distance_m !== undefined && (
          <span className='text-sm text-muted-foreground'>{distanceLabel(place.distance_m)} from the middle</span>
        )}
      </div>
      {place.address !== '' && <span className='text-sm text-muted-foreground'>{place.address}</span>}
      <div className='flex gap-3 text-sm'>
        <a className={LINK} href={mapLink(place)} target='_blank' rel='noopener noreferrer'>
          Map
        </a>
        {website !== null && (
          <a className={LINK} href={website} target='_blank' rel='noopener noreferrer'>
            Website
          </a>
        )}
      </div>
    </li>
  );
}

/** How much longer the furthest person travels than the nearest, when every leg has a route. */
function spread(legs: readonly Leg[]): number | null {
  const times = legs.map((leg) => leg.duration_s);
  if (times.some((time) => time === null || time === undefined)) {
    return null;
  }
  const known = times.map((time) => time ?? 0);
  return Math.max(...known) - Math.min(...known);
}

function NearbyPlaces({ midpoint, category }: { midpoint: Midpoint; category: string }): ReactNode {
  const places = useNearby(midpoint, category);
  if (places.error !== undefined) {
    return (
      <p role='alert' className='text-sm text-destructive'>
        {places.error.message}
      </p>
    );
  }
  if (places.data === undefined) {
    return (
      <p role='status' className='text-sm text-muted-foreground'>
        Looking for places to meet…
      </p>
    );
  }
  if (places.data.length === 0) {
    return <p className='text-sm text-muted-foreground'>Nothing of that kind is on the map near the middle.</p>;
  }
  return (
    <ul aria-label='Places to meet' className='divide-y'>
      {places.data.map((place) => (
        <PlaceRow key={place.id} place={place} />
      ))}
    </ul>
  );
}

function Result({
  midpoint,
  labels,
  mode,
  category,
}: {
  midpoint: Midpoint;
  labels: readonly string[];
  mode: Mode;
  category: string | null;
}): ReactNode {
  const gap = spread(midpoint.legs);
  return (
    <section aria-label='The middle' className='grid gap-4'>
      <div className='flex flex-wrap items-baseline justify-between gap-2'>
        <h2 className='text-lg font-semibold'>The middle</h2>
        <a className={`${LINK} text-sm`} href={mapLink(midpoint)} target='_blank' rel='noopener noreferrer'>
          See it on the map
        </a>
      </div>
      <MeetMap midpoint={midpoint} places={midpoint.places} labels={labels} />
      <ul aria-label='Getting there' className='divide-y'>
        {midpoint.legs.map((leg, index) => (
          <LegRow key={leg.location} leg={leg} label={labels[index] ?? leg.location} mode={mode} />
        ))}
      </ul>
      {gap !== null && (
        <p className='text-sm text-muted-foreground'>
          The longest journey is {durationLabel(gap)} longer than the shortest.
        </p>
      )}
      {category !== null && <NearbyPlaces midpoint={midpoint} category={category} />}
    </section>
  );
}

export interface MeetInTheMiddleProps {
  /** Places the app already knows (a partner's home), offered beside typed ones. */
  known?: readonly KnownPlace[];
}

/** Pick two or more places; see the point halfway between them, everyone's way there, and places to meet. */
export function MeetInTheMiddle({ known = [] }: MeetInTheMiddleProps): ReactNode {
  const client = useClient();
  const ids = { typed: useId(), mode: useId(), category: useId() };
  const categories = usePlaceCategories();
  const [chosen, setChosen] = useState<KnownPlace[]>([]);
  const [typed, setTyped] = useState('');
  const [mode, setMode] = useState<Mode>('driving');
  const [category, setCategory] = useState('restaurant');
  const [found, setFound] = useState<{
    midpoint: Midpoint;
    labels: string[];
    mode: Mode;
    category: string | null;
  } | null>(null);
  const [problem, setProblem] = useState<string | null>(null);
  const [finding, setFinding] = useState(false);
  const full = chosen.length >= MAX_LOCATIONS;
  const add = (place: KnownPlace): void => {
    if (!full && !chosen.some((current) => current.location === place.location)) {
      setChosen([...chosen, place]);
    }
  };
  const addTyped = (): void => {
    const location = typed.trim();
    if (location !== '') {
      add({ label: location, location });
      setTyped('');
    }
  };
  const offered = known.filter((place) => !chosen.some((current) => current.location === place.location));
  const search = (event: SyntheticEvent): void => {
    event.preventDefault();
    setFinding(true);
    const kind = category === NOTHING ? null : category;
    // The middle alone, quickly; the places around it load after it (useNearby).
    const asked = { locations: chosen.map((place) => place.location), mode, category: null };
    const labels = chosen.map((place) => place.label);
    void (async (): Promise<void> => {
      const asking = findMidpoint(client, asked);
      const failed = await writeProblem(asking, 'The middle could not be found.');
      setProblem(failed);
      setFound(failed === null ? { midpoint: await asking, labels, mode, category: kind } : null);
      setFinding(false);
    })();
  };
  return (
    <div className='grid gap-6'>
      <div className='grid gap-1'>
        <h1 className='text-2xl font-semibold tracking-tight text-balance sm:text-3xl'>Meet in the middle</h1>
        <p className='text-muted-foreground'>
          The point halfway between everyone, how long each of you takes to get there, and places to meet nearby.
        </p>
      </div>
      {/* Once there is a result, the form sits beside it on a wide screen, so the map is in view. */}
      <div className={found === null ? 'grid gap-6' : 'grid items-start gap-6 xl:grid-cols-[24rem_minmax(0,1fr)]'}>
        <form
          onSubmit={search}
          aria-label='Where from'
          className={`grid gap-4 rounded-md border p-4 ${found === null ? '' : 'xl:sticky xl:top-6'}`}
        >
          <div className='grid gap-2'>
            <span className='text-sm font-medium'>Meeting between</span>
            {chosen.length === 0 ? (
              <p className='text-sm text-muted-foreground'>Add at least two places.</p>
            ) : (
              <ul aria-label='Meeting between' className='flex flex-wrap gap-2'>
                {chosen.map((place) => (
                  <li key={place.location} className='flex items-center gap-1 rounded-full border py-1 pl-3 pr-1 text-sm'>
                    {place.label}
                    <Button
                      type='button'
                      variant='ghost'
                      size='sm'
                      className='h-6 px-2'
                      aria-label={`Remove ${place.label}`}
                      onClick={() => setChosen(chosen.filter((current) => current !== place))}
                    >
                      ×
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className='flex flex-wrap items-end gap-2'>
            {offered.length > 0 && (
              <fieldset aria-label='Add someone’s place' className='min-w-0 grid basis-full gap-1.5'>
                <span className='text-sm font-medium'>Add someone’s place</span>
                <div className='flex flex-wrap gap-1.5'>
                  {offered.map((place) => (
                    <button
                      key={place.location}
                      type='button'
                      disabled={full}
                      onClick={() => add(place)}
                      className={`${CHIP} disabled:opacity-50`}
                    >
                      <span aria-hidden='true'>+ </span>
                      {place.label}
                    </button>
                  ))}
                </div>
              </fieldset>
            )}
            <label htmlFor={ids.typed} className='grid min-w-56 flex-1 gap-1 text-sm font-medium'>
              {/* "Or" only follows the saved places; with none to offer, typing is the only way. */}
              {offered.length > 0 ? 'Or type an address' : 'Add an address'}
              <Input
                id={ids.typed}
                value={typed}
                disabled={full}
                onChange={(event) => setTyped(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    event.preventDefault();
                    addTyped();
                  }
                }}
                placeholder='A street address, town or postcode'
              />
            </label>
            <Button type='button' variant='outline' onClick={addTyped} disabled={full || typed.trim() === ''}>
              Add
            </Button>
          </div>
          <div className='grid gap-3'>
            <div role='radiogroup' aria-label='Travelling' className='grid gap-1.5'>
              <span id={ids.mode} className='text-sm font-medium'>
                Travelling
              </span>
              {/* On a phone the four modes share one row, icon over word; from sm they sit inline as chips. */}
              <div className='grid grid-cols-4 gap-1.5 sm:flex sm:flex-wrap sm:gap-2'>
                {MODES.map((item) => (
                  <ChoiceChip
                    key={item.mode}
                    checked={mode === item.mode}
                    onClick={() => setMode(item.mode)}
                    className={`${CHIP} ${MODE_CHIP}`}
                  >
                    <ModeIcon mode={item.mode} />
                    {item.label}
                  </ChoiceChip>
                ))}
              </div>
            </div>
            <div role='radiogroup' aria-label='Places to meet' className='grid gap-1.5'>
              <span id={ids.category} className='text-sm font-medium'>
                Places to meet
              </span>
              <div className='flex flex-wrap gap-2'>
                {[{ name: NOTHING, title: 'Just the middle' }, ...(categories.data ?? [])].map((item) => (
                  <ChoiceChip
                    key={item.name}
                    checked={category === item.name}
                    onClick={() => setCategory(item.name)}
                    className={CHIP}
                  >
                    {item.title}
                  </ChoiceChip>
                ))}
              </div>
            </div>
          </div>
          <div className='flex flex-wrap items-end gap-2'>
            <Button type='submit' disabled={chosen.length < MIN_LOCATIONS || finding}>
              {finding ? 'Finding…' : 'Find the middle'}
            </Button>
          </div>
          {problem !== null && (
            <p role='alert' className='text-sm text-destructive'>
              {problem}
            </p>
          )}
        </form>
        {found !== null && (
          <Result midpoint={found.midpoint} labels={found.labels} mode={found.mode} category={found.category} />
        )}
      </div>
      <p className='text-xs text-muted-foreground'>
        Places and routes from{' '}
        <a className={LINK} href={OSM_COPYRIGHT} target='_blank' rel='noopener noreferrer'>
          OpenStreetMap
        </a>{' '}
        contributors.
      </p>
    </div>
  );
}

// SPDX-License-Identifier: AGPL-3.0-or-later
'use client';

import { type ReactNode, type SyntheticEvent, useId, useState } from 'react';
import { useClient, writeProblem } from 'zephyrex';
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

const SELECT = 'h-9 rounded-md border bg-background px-3 text-sm font-normal';
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
  const ids = { known: useId(), typed: useId(), mode: useId(), category: useId() };
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
        <h1 className='text-3xl font-semibold'>Meet in the middle</h1>
        <p className='text-muted-foreground'>
          The point halfway between everyone, how long each of you takes to get there, and places to meet nearby.
        </p>
      </div>
      <form onSubmit={search} aria-label='Where from' className='grid gap-4 rounded-md border p-4'>
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
            <label htmlFor={ids.known} className='grid gap-1 text-sm font-medium'>
              Add someone’s place
              <select
                id={ids.known}
                value={NOTHING}
                disabled={full}
                onChange={(event) => {
                  const place = offered.find((candidate) => candidate.location === event.target.value);
                  if (place !== undefined) {
                    add(place);
                  }
                }}
                className={SELECT}
              >
                <option value={NOTHING}>Choose…</option>
                {offered.map((place) => (
                  <option key={place.location} value={place.location}>
                    {place.label}
                  </option>
                ))}
              </select>
            </label>
          )}
          <label htmlFor={ids.typed} className='grid min-w-56 flex-1 gap-1 text-sm font-medium'>
            Or type an address
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
        <div className='flex flex-wrap items-end gap-2'>
          <label htmlFor={ids.mode} className='grid gap-1 text-sm font-medium'>
            Travelling
            <select
              id={ids.mode}
              value={mode}
              onChange={(event) => setMode(MODES.find((item) => item.mode === event.target.value)?.mode ?? 'driving')}
              className={SELECT}
            >
              {MODES.map((item) => (
                <option key={item.mode} value={item.mode}>
                  {item.label}
                </option>
              ))}
            </select>
          </label>
          <label htmlFor={ids.category} className='grid gap-1 text-sm font-medium'>
            Places to meet
            <select
              id={ids.category}
              value={category}
              onChange={(event) => setCategory(event.target.value)}
              className={SELECT}
            >
              <option value={NOTHING}>Just the middle</option>
              {(categories.data ?? []).map((item) => (
                <option key={item.name} value={item.name}>
                  {item.title}
                </option>
              ))}
            </select>
          </label>
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

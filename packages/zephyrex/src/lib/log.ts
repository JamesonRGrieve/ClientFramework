// SPDX-License-Identifier: AGPL-3.0-or-later
type Verbosity = {
  client?: number | undefined;
  server?: number | undefined;
};

const DEFAULT_VERBOSITY: Verbosity = { client: 3, server: 3 };

/** Errors: shown at every verbosity above 0, on either side. */
export const ERRORS_ONLY: Verbosity = { client: 1, server: 1 };

/** The heading's `--- ` and ` ---` around it, so the closing rule lines up with it. */
const HEADING_DECORATION = '--- '.length + ' ---'.length;

function emit(logItems: unknown[], heading: string | null): void {
  if (heading !== null && heading !== '') {
    console.log(`--- ${heading.toUpperCase()} ---`);
  }
  console.log(...logItems);
  if (heading !== null && heading !== '') {
    console.log('-'.repeat(heading.length + HEADING_DECORATION));
  }
}

/**
 * Whether a message at `level` passes the configured verbosity `setting` (an env value): it logs
 * when the setting is a number at or above the level. An unset or non-numeric setting logs
 * nothing, and a message without a level for this side is not meant for it.
 */
export function passesVerbosity(level: number | undefined, setting: string | undefined): boolean {
  if (level === undefined || setting === undefined || setting.trim() === '') {
    return false;
  }
  const threshold = Number(setting);
  return !Number.isNaN(threshold) && level <= threshold;
}

/**
 * Log `logItems` when their verbosity for this side (server or client) passes the configured
 * LOG_VERBOSITY_SERVER / NEXT_PUBLIC_LOG_VERBOSITY_CLIENT.
 */
export default function log(
  logItems: unknown[],
  verbosity: Verbosity = DEFAULT_VERBOSITY,
  heading: string | null = null,
): void {
  const onServer = typeof window === 'undefined';
  const passes = onServer
    ? passesVerbosity(verbosity.server, process.env.LOG_VERBOSITY_SERVER)
    : passesVerbosity(verbosity.client, process.env.NEXT_PUBLIC_LOG_VERBOSITY_CLIENT);
  if (passes) {
    emit(logItems, heading);
  }
}

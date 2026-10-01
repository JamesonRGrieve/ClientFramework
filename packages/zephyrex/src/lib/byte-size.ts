// SPDX-License-Identifier: AGPL-3.0-or-later

const BYTES_PER_UNIT = 1000;
const UNITS = ['byte', 'kilobyte', 'megabyte', 'gigabyte'] as const;
const MAX_FRACTION_DIGITS = 1;

/** A byte count in the largest decimal unit it reaches, e.g. 1.5 MB (SI units, as file managers show sizes). */
export function formatByteSize(bytes: number, locale?: string): string {
  let value = bytes;
  let unit = 0;
  while (value >= BYTES_PER_UNIT && unit < UNITS.length - 1) {
    value /= BYTES_PER_UNIT;
    unit += 1;
  }
  return new Intl.NumberFormat(locale, {
    style: 'unit',
    unit: UNITS[unit],
    // The short form of plain bytes is "999 byte"; the long form is "999 bytes", and "1 byte".
    unitDisplay: unit === 0 ? 'long' : 'short',
    maximumFractionDigits: unit === 0 ? 0 : MAX_FRACTION_DIGITS,
  }).format(value);
}

// SPDX-License-Identifier: AGPL-3.0-or-later
// The client half of the server's rota extension (zephyrex[rota]): a repeating rota of nights with
// the people in someone's life, and one-night swaps both of the two agree to.
export { rotaExtension } from './extension';
export { RotaPage } from './RotaPage';
export { ROTA_PATH } from './routes';
export { ROTA_ENDPOINT, ROTA_NIGHT_ENDPOINT, useMyRotas, useRotaActions, useSchedule, useSwaps } from './rotaApi';
export type { RotaActions } from './rotaApi';
export {
  cycleNightLabel,
  isoDay,
  MAX_CYCLE_DAYS,
  membersOf,
  nightAt,
  nightLabel,
  RotaNightSchema,
  RotaSchema,
  ScheduledNightSchema,
  SwapSchema,
} from './rotaModel';
export type { Rota, RotaNight, RotaPerson, ScheduledNight, Swap } from './rotaModel';

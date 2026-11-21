// SPDX-License-Identifier: AGPL-3.0-or-later
import type { ZephyrexClientExtension } from 'zephyrex';
import { roomsExtension as registered } from 'zephyrex/extensions';

/** The rooms client extension, for an app's `extensions`: no pages of its own; its hook goes on the app's live pages. */
export const roomsExtension: ZephyrexClientExtension = { ...registered };

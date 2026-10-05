// SPDX-License-Identifier: AGPL-3.0-or-later
// What a voice message needs from the browser: whether it can record, and the recording as the
// server takes it (base64, with a file name whose extension names the format).

/** How many bytes go into one String.fromCharCode call (its arguments are limited). */
const CHUNK = 0x8000;

/** `bytes` as base64. */
export function toBase64(bytes: Uint8Array): string {
  let binary = '';
  for (let start = 0; start < bytes.length; start += CHUNK) {
    binary += String.fromCharCode(...bytes.subarray(start, start + CHUNK));
  }
  return btoa(binary);
}

/** The formats the server transcribes, by the MIME subtype a browser records in. */
const EXTENSIONS: Readonly<Record<string, string>> = {
  webm: 'webm',
  ogg: 'ogg',
  mp4: 'm4a',
  mpeg: 'mp3',
  wav: 'wav',
  flac: 'flac',
};
const DEFAULT_EXTENSION = 'webm';

/** The file name a recording of type `mimeType` is sent as ("audio/ogg;codecs=opus" → "voice.ogg"). */
export function voiceFilename(mimeType: string): string {
  const subtype = /^audio\/([a-z\d]+)/i.exec(mimeType)?.[1]?.toLowerCase() ?? '';
  return `voice.${EXTENSIONS[subtype] ?? DEFAULT_EXTENSION}`;
}

/**
 * Whether this browser can record from a microphone (false while rendering on the server). An
 * insecure page has no `navigator.mediaDevices` at all, whatever the DOM types say.
 */
export const canRecord = (): boolean =>
  typeof MediaRecorder !== 'undefined' &&
  typeof navigator !== 'undefined' &&
  'mediaDevices' in navigator &&
  typeof navigator.mediaDevices.getUserMedia === 'function';

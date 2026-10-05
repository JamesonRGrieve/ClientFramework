// SPDX-License-Identifier: AGPL-3.0-or-later
import { afterEach, describe, expect, it, vi } from 'vitest';
import { canRecord, toBase64, voiceFilename } from './recording';

describe('recording', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('encodes bytes as base64, across chunk boundaries', () => {
    expect(toBase64(new TextEncoder().encode('ID3'))).toBe('SUQz');
    const large = new Uint8Array(0x8000 * 2 + 3).fill(0xff);
    expect(atob(toBase64(large))).toHaveLength(large.length);
  });

  it('names a recording by its format, falling back to webm', () => {
    expect(voiceFilename('audio/webm;codecs=opus')).toBe('voice.webm');
    expect(voiceFilename('audio/ogg; codecs=opus')).toBe('voice.ogg');
    expect(voiceFilename('audio/mp4')).toBe('voice.m4a');
    expect(voiceFilename('')).toBe('voice.webm');
  });

  it('can record only where there is a MediaRecorder and a microphone to ask for', () => {
    vi.stubGlobal('MediaRecorder', undefined);
    expect(canRecord()).toBe(false);
    vi.stubGlobal('MediaRecorder', class {});
    vi.stubGlobal('navigator', { mediaDevices: { getUserMedia: vi.fn() } });
    expect(canRecord()).toBe(true);
  });
});

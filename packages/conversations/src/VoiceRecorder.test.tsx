// SPDX-License-Identifier: AGPL-3.0-or-later
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { conversationsFixture, ME, PLANS_ID, transcriptOf } from './conversations.mocks';
import { renderConversations } from './testing.mocks';
import { VoiceRecorder } from './VoiceRecorder';

const RECORD = 'Record a voice message';
const STOP = 'Stop and send';

/** `navigator.mediaDevices` for this test (jsdom has none); removed again after each test. */
function giveMediaDevices(getUserMedia: () => Promise<unknown>): void {
  Object.defineProperty(navigator, 'mediaDevices', { value: { getUserMedia }, configurable: true });
}

/** A microphone whose one track records whether it was given back, recording `audio`. */
function fakeMicrophone(audio: Uint8Array<ArrayBuffer>): { stopTrack: ReturnType<typeof vi.fn> } {
  const stopTrack = vi.fn();
  class FakeRecorder extends EventTarget {
    readonly mimeType = 'audio/ogg;codecs=opus';
    start(): void {
      // Recording begins; the data comes when it stops.
    }
    stop(): void {
      const available = new Event('dataavailable');
      Object.defineProperty(available, 'data', { value: new Blob([audio], { type: this.mimeType }) });
      this.dispatchEvent(available);
      this.dispatchEvent(new Event('stop'));
    }
  }
  vi.stubGlobal('MediaRecorder', FakeRecorder);
  giveMediaDevices(async () => Promise.resolve({ getTracks: () => [{ stop: stopTrack }] }));
  return { stopTrack };
}

describe('VoiceRecorder', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    Reflect.deleteProperty(navigator, 'mediaDevices');
  });

  it('records, sends the recording for transcription as a reply, and gives the microphone back', async () => {
    const { stopTrack } = fakeMicrophone(new TextEncoder().encode('ID3'));
    const store = conversationsFixture();
    const onSent = vi.fn(async () => Promise.resolve());
    const user = userEvent.setup();
    const view = renderConversations(<VoiceRecorder conversationId={PLANS_ID} parentId='m1' onSent={onSent} />, store);
    await user.click(await view.findByRole('button', { name: RECORD }));
    expect(await view.findByRole('status')).toHaveTextContent('Recording…');
    await user.click(view.getByRole('button', { name: STOP }));
    await vi.waitFor(() => {
      expect(onSent).toHaveBeenCalled();
    });
    expect(store.messages.at(-1)).toMatchObject({
      conversation_id: PLANS_ID,
      content: transcriptOf('voice.ogg'),
      parent_id: 'm1',
      user_id: ME.id,
    });
    expect(stopTrack).toHaveBeenCalled();
    expect(view.getByRole('button', { name: RECORD })).toBeEnabled();
  });

  it('says so when the microphone can’t be used', async () => {
    fakeMicrophone(new Uint8Array());
    giveMediaDevices(async () => Promise.reject(new Error('denied')));
    const user = userEvent.setup();
    const view = renderConversations(<VoiceRecorder conversationId={PLANS_ID} parentId={null} onSent={vi.fn()} />);
    await user.click(await view.findByRole('button', { name: RECORD }));
    expect(await view.findByRole('alert')).toHaveTextContent('The microphone could not be used.');
  });

  it('shows the server’s reason when nothing could be transcribed', async () => {
    fakeMicrophone(new Uint8Array());
    const user = userEvent.setup();
    const view = renderConversations(<VoiceRecorder conversationId={PLANS_ID} parentId={null} onSent={vi.fn()} />);
    await user.click(await view.findByRole('button', { name: RECORD }));
    await user.click(await view.findByRole('button', { name: STOP }));
    expect(await view.findByRole('alert')).toHaveTextContent('No speech was heard');
  });

  it('offers nothing where the browser can’t record', () => {
    vi.stubGlobal('MediaRecorder', undefined);
    const view = renderConversations(<VoiceRecorder conversationId={PLANS_ID} parentId={null} onSent={vi.fn()} />);
    expect(view.queryByRole('button', { name: RECORD })).toBeNull();
  });
});

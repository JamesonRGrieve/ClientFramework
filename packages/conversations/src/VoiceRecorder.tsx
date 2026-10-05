// SPDX-License-Identifier: AGPL-3.0-or-later
'use client';

import { Button } from '@jgrieve/forms/components/ui/button';
import { type ReactElement, useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { useClient, writeProblem } from 'zephyrex';
import { sendVoiceMessage } from './conversationsApi';
import { Problem } from './Problem';
import { canRecord, toBase64, voiceFilename } from './recording';

type Stage = 'idle' | 'recording' | 'sending';

const NO_MICROPHONE = 'The microphone could not be used.';
const SEND_FAILURE = 'The voice message could not be sent.';

/** Recording support never changes while the page is open, so nothing is subscribed to. */
const subscribeToNothing = (): (() => void) => () => undefined;
const notOnServer = (): boolean => false;

/** Stops every track of `stream`, giving the microphone back. */
const release = (stream: MediaStream | null): void => {
  stream?.getTracks().forEach((track) => {
    track.stop();
  });
};

/**
 * Record a voice message and send it as a message (a reply to `parentId` when given): the server
 * transcribes it and posts the text. Shown only where the browser can record.
 */
export function VoiceRecorder({
  conversationId,
  parentId,
  onSent,
}: {
  conversationId: string;
  parentId: string | null;
  onSent: () => Promise<void>;
}): ReactElement | null {
  const client = useClient();
  const supported = useSyncExternalStore(subscribeToNothing, canRecord, notOnServer);
  const [stage, setStage] = useState<Stage>('idle');
  const [problem, setProblem] = useState<string | null>(null);
  const recorder = useRef<MediaRecorder | null>(null);
  const stream = useRef<MediaStream | null>(null);

  // Leaving the page mid-recording gives the microphone back.
  useEffect(
    () => () => {
      release(stream.current);
    },
    [],
  );

  const send = async (recording: Blob): Promise<void> => {
    setStage('sending');
    const sending = (async (): Promise<void> => {
      const audioBase64 = toBase64(new Uint8Array(await recording.arrayBuffer()));
      await sendVoiceMessage(client, conversationId, { audioBase64, filename: voiceFilename(recording.type) }, parentId);
      await onSent();
    })();
    setProblem(await writeProblem(sending, SEND_FAILURE));
    setStage('idle');
  };

  const start = async (): Promise<void> => {
    setProblem(null);
    try {
      stream.current = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch {
      setProblem(NO_MICROPHONE);
      return;
    }
    const chunks: Blob[] = [];
    const started = new MediaRecorder(stream.current);
    started.addEventListener('dataavailable', ({ data }) => {
      chunks.push(data);
    });
    started.addEventListener('stop', () => {
      release(stream.current);
      stream.current = null;
      void send(new Blob(chunks, { type: started.mimeType }));
    });
    recorder.current = started;
    started.start();
    setStage('recording');
  };

  if (!supported) {
    return null;
  }
  return (
    <div className='grid gap-1'>
      {stage === 'recording' ? (
        <Button
          type='button'
          variant='outline'
          onClick={() => {
            recorder.current?.stop();
          }}
        >
          Stop and send
        </Button>
      ) : (
        <Button
          type='button'
          variant='outline'
          disabled={stage === 'sending'}
          onClick={() => {
            void start();
          }}
        >
          {stage === 'sending' ? 'Sending…' : 'Record a voice message'}
        </Button>
      )}
      {stage === 'recording' && (
        <p role='status' className='text-xs text-muted-foreground'>
          Recording…
        </p>
      )}
      <Problem text={problem} />
    </div>
  );
}

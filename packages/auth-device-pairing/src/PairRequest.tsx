'use client';
// SPDX-License-Identifier: AGPL-3.0-or-later
import { Button } from '@jgrieve/forms/components/ui/button';
import { AuthCard, useAuthentication } from '@zephyrex/auth';
import { signedInDestination } from '@zephyrex/auth/lib/afterSignIn';
import { type ReactNode, useEffect, useState } from 'react';
import { QRCode } from 'react-qr-code';
import { type PairingStart, pairingStatus, requestPairing } from './pairingApi';

/** How often the page asks whether the other device has answered (the server's contract: poll). */
export const PAIRING_POLL_MS = 1000;

type Stage = 'starting' | 'waiting' | 'denied' | 'expired' | 'failed';
type EndedStage = Exclude<Stage, 'starting' | 'waiting'>;

const ENDED_MESSAGES: ReadonlyMap<EndedStage, string> = new Map([
  ['denied', 'The other device turned the sign-in down.'],
  ['expired', 'The code expired before it was used.'],
  ['failed', 'A pairing code could not be made.'],
]);

/**
 * Sign in by scanning a code with a device that is already signed in (`<authPath>/pair`). The page
 * shows the code, waits for the other device's answer, and continues signed in once it approves.
 * Starting again mounts a fresh pairing.
 */
export function PairRequest(): ReactNode {
  const [attempt, setAttempt] = useState(0);
  return (
    <PairingAttempt
      key={attempt}
      onStartAgain={() => {
        setAttempt((count) => count + 1);
      }}
    />
  );
}

/** One pairing: request a code, show it, and wait for the answer. */
function PairingAttempt({ onStartAgain }: { onStartAgain: () => void }): ReactNode {
  const authConfig = useAuthentication();
  const [pairing, setPairing] = useState<PairingStart | null>(null);
  const [stage, setStage] = useState<Stage>('starting');

  useEffect(() => {
    let cancelled = false;
    const start = async (): Promise<void> => {
      try {
        const started = await requestPairing(authConfig.authServer);
        if (!cancelled) {
          setPairing(started);
          setStage('waiting');
        }
      } catch {
        if (!cancelled) {
          setStage('failed');
        }
      }
    };
    void start();
    return () => {
      cancelled = true;
    };
  }, [authConfig.authServer]);

  useEffect(() => {
    if (stage !== 'waiting' || pairing === null) {
      return undefined;
    }
    const timer = window.setInterval(() => {
      void (async (): Promise<void> => {
        try {
          const state = await pairingStatus(authConfig.authServer, pairing.pairing_id);
          if (state === 'approved') {
            window.clearInterval(timer);
            // The read that saw it approved has set this browser's session.
            window.location.href = signedInDestination(authConfig);
          } else if (state === 'denied' || state === 'expired') {
            window.clearInterval(timer);
            setStage(state);
          }
        } catch {
          window.clearInterval(timer);
          setStage('failed');
        }
      })();
    }, PAIRING_POLL_MS);
    return () => {
      window.clearInterval(timer);
    };
  }, [authConfig, pairing, stage]);

  return (
    <AuthCard
      title='Sign in with another device'
      description='Scan this code with a phone or computer where you are already signed in.'
      showBackButton
    >
      <div className='flex flex-col items-center gap-4'>
        {stage === 'starting' && <p role='status'>Making a code…</p>}
        {stage === 'waiting' && pairing !== null && (
          <>
            <div className='rounded-md bg-white p-3'>
              <QRCode value={pairing.qr_payload} title='Pairing code' />
            </div>
            <p role='status' className='text-sm text-muted-foreground'>
              Waiting for the other device to approve…
            </p>
          </>
        )}
        {(stage === 'denied' || stage === 'expired' || stage === 'failed') && (
          <>
            <p role='alert' className='text-sm text-destructive'>
              {ENDED_MESSAGES.get(stage)}
            </p>
            <Button type='button' onClick={onStartAgain}>
              Start again
            </Button>
          </>
        )}
      </div>
    </AuthCard>
  );
}

'use client';
// SPDX-License-Identifier: AGPL-3.0-or-later
import { Button } from '@jgrieve/forms/components/ui/button';
import { AuthCard, useAuthentication } from '@zephyrex/auth';
import { type ReactNode, useState } from 'react';
import { answerPairing, type PairingAnswer, type PairingDecision } from './pairingApi';

const pairingToken = (): string => new URLSearchParams(window.location.search).get('token') ?? '';

/**
 * Where a pairing QR code lands on a signed-in device (`<authPath>/pair/approve?token=…`; the
 * server's PAIRING_BASE_URL is `<app><authPath>/pair`). The user confirms before the other device
 * is signed in as them.
 */
export function PairApprove(): ReactNode {
  const authConfig = useAuthentication();
  const [token] = useState(pairingToken);
  const [pending, setPending] = useState(false);
  const [answer, setAnswer] = useState<PairingAnswer | null>(null);
  const [problem, setProblem] = useState<string | null>(null);

  const decide = (decision: PairingDecision): void => {
    setPending(true);
    void (async (): Promise<void> => {
      try {
        setAnswer(await answerPairing(authConfig.authServer, token, decision));
      } catch (error) {
        setProblem(error instanceof Error ? error.message : 'The pairing could not be answered.');
      } finally {
        setPending(false);
      }
    })();
  };

  if (token.length === 0) {
    return (
      <AuthCard title='Pair a device' description='Scan the code the other device shows.'>
        <p role='alert' className='text-sm text-destructive'>
          This pairing link is incomplete.
        </p>
      </AuthCard>
    );
  }
  if (answer !== null) {
    return (
      <AuthCard title='Pair a device' description=''>
        <p role='status' className='text-sm'>
          {answer.state === 'approved'
            ? 'The other device is being signed in to your account.'
            : 'You turned the sign-in down; the other device stays signed out.'}
        </p>
      </AuthCard>
    );
  }
  return (
    <AuthCard title='Pair a device' description='Another device is asking to sign in to your account.'>
      <div className='flex flex-col gap-4'>
        <p className='text-sm'>Approve only if you started this on a device you own and it is in front of you.</p>
        <div className='flex gap-2'>
          <Button disabled={pending} onClick={() => decide('approve')}>
            Approve sign-in
          </Button>
          <Button variant='outline' disabled={pending} onClick={() => decide('deny')}>
            Deny
          </Button>
        </div>
        {problem !== null && (
          <p role='alert' className='text-sm text-destructive'>
            {problem}
          </p>
        )}
      </div>
    </AuthCard>
  );
}

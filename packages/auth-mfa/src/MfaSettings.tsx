'use client';
// SPDX-License-Identifier: AGPL-3.0-or-later
import { Button } from '@jgrieve/forms/components/ui/button';
import { Input } from '@jgrieve/forms/components/ui/input';
import { Label } from '@jgrieve/forms/components/ui/label';
import { type ReactElement, type SyntheticEvent, useState } from 'react';
import { QRCode } from 'react-qr-code';
import { useClient } from 'zephyrex';
import { Badge } from 'zephyrex/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from 'zephyrex/ui/card';
import { CopyButton } from 'zephyrex/ui/copy-button';
import { type MfaMethod, mfaApi, type TotpProvisioning, useMfaMethods } from './mfaApi';

const QR_SIZE = 192;

const METHOD_LABELS: ReadonlyMap<MfaMethod['method_type'], string> = new Map([
  ['totp', 'Authenticator app'],
  ['email', 'Email'],
  ['sms', 'Text message'],
]);

const methodState = (method: MfaMethod): string => {
  if (!method.verification) {
    return 'Setup not finished';
  }
  return method.is_enabled ? 'On' : 'Off';
};

const reason = (error: Error | null, fallback: string): string => error?.message ?? fallback;

const formCode = (event: SyntheticEvent<HTMLFormElement>): string => {
  const value = new FormData(event.currentTarget).get('code');
  return typeof value === 'string' ? value.trim() : '';
};

/** Asks for a current authenticator or recovery code before a sensitive change. */
function CodeForm({
  id,
  label,
  submitLabel,
  onSubmit,
  onCancel,
}: {
  id: string;
  label: string;
  submitLabel: string;
  onSubmit: (code: string) => Promise<void>;
  onCancel: () => void;
}): ReactElement {
  const [pending, setPending] = useState(false);
  return (
    <form
      aria-label={submitLabel}
      className='grid gap-2 md:max-w-sm'
      onSubmit={(event) => {
        event.preventDefault();
        const code = formCode(event);
        setPending(true);
        void onSubmit(code).finally(() => {
          setPending(false);
        });
      }}
    >
      <Label htmlFor={id}>{label}</Label>
      <Input id={id} name='code' autoComplete='one-time-code' inputMode='text' required />
      <div className='flex gap-2'>
        <Button type='submit' disabled={pending}>
          {submitLabel}
        </Button>
        <Button type='button' variant='outline' onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  );
}

/** Recovery codes, shown once: they can't be read back later. */
function RecoveryCodes({ codes, onDone }: { codes: readonly string[]; onDone: () => void }): ReactElement {
  return (
    <div className='grid gap-3 rounded-md border p-4'>
      <p className='text-sm font-medium'>Save these recovery codes now. Each works once, and they won’t be shown again.</p>
      <ul aria-label='Recovery codes' className='grid grid-cols-2 gap-1 font-mono text-sm'>
        {codes.map((code) => (
          <li key={code}>{code}</li>
        ))}
      </ul>
      <div className='flex gap-2'>
        <CopyButton content={codes.join('\n')} label='Copy codes' />
        <Button type='button' size='sm' onClick={onDone}>
          I’ve saved them
        </Button>
      </div>
    </div>
  );
}

/** Scan the QR code (or enter the key), then prove it with a code from the app. */
function TotpEnrolment({
  provisioning,
  onVerify,
  onCancel,
}: {
  provisioning: TotpProvisioning;
  onVerify: (code: string) => Promise<void>;
  onCancel: () => void;
}): ReactElement {
  return (
    <div className='grid gap-4 rounded-md border p-4 md:grid-cols-[auto_1fr]'>
      <div className='bg-white p-2'>
        <QRCode size={QR_SIZE} value={provisioning.provisioning_uri} title='Authenticator app QR code' />
      </div>
      <div className='grid content-start gap-3'>
        <p className='text-sm'>
          Scan the code with an authenticator app, or enter this key by hand:{' '}
          <span className='break-all font-mono'>{provisioning.secret}</span>
        </p>
        <CopyButton content={provisioning.secret} label='Copy key' />
        <CodeForm
          id='mfa-enrol-code'
          label='Code from the app'
          submitLabel='Turn on'
          onSubmit={onVerify}
          onCancel={onCancel}
        />
      </div>
    </div>
  );
}

type Pending =
  | { kind: 'enrol'; method: MfaMethod; provisioning: TotpProvisioning }
  | { kind: 'disable' | 'remove'; method: MfaMethod }
  | { kind: 'codes'; codes: string[] }
  | null;

/** The signed-in user's second factors: set up an authenticator app, manage recovery codes, turn methods off or remove them. */
export function MfaSettings(): ReactElement {
  const client = useClient();
  const { data: methods, error, isLoading, mutate } = useMfaMethods();
  const [pending, setPending] = useState<Pending>(null);
  const [problem, setProblem] = useState<string | null>(null);

  const attempt = async (action: () => Promise<void>, fallback: string): Promise<void> => {
    setProblem(null);
    try {
      await action();
    } catch (failure) {
      setProblem(reason(failure instanceof Error ? failure : null, fallback));
    }
  };

  const startEnrolment = async (existing?: MfaMethod): Promise<void> =>
    attempt(async () => {
      const method = existing ?? (await mfaApi.createTotp(client));
      const provisioning = await mfaApi.provisioning(client, method.id);
      setPending({ kind: 'enrol', method, provisioning });
      await mutate();
    }, 'The authenticator app could not be set up.');

  const verifyEnrolment = async (method: MfaMethod, code: string): Promise<void> =>
    attempt(async () => {
      if (!(await mfaApi.verify(client, method.id, code))) {
        setProblem('That code didn’t match. Check the app’s clock and try the current code.');
        return;
      }
      const codes = await mfaApi.generateRecoveryCodes(client, method.id);
      setPending({ kind: 'codes', codes });
      await mutate();
    }, 'The code could not be checked.');

  const regenerateCodes = async (method: MfaMethod): Promise<void> =>
    attempt(async () => {
      setPending({ kind: 'codes', codes: await mfaApi.generateRecoveryCodes(client, method.id) });
    }, 'New recovery codes could not be made.');

  const change = async (kind: 'disable' | 'remove', method: MfaMethod, code?: string): Promise<void> =>
    attempt(
      async () => {
        await (kind === 'disable' ? mfaApi.disable(client, method.id, code) : mfaApi.remove(client, method.id, code));
        setPending(null);
        await mutate();
      },
      kind === 'disable' ? 'The method could not be turned off.' : 'The method could not be removed.',
    );

  const hasTotp = (methods ?? []).some((method) => method.method_type === 'totp');

  return (
    <Card>
      <CardHeader>
        <CardTitle>Two-factor authentication</CardTitle>
        <CardDescription>Ask for a code from your phone as well as your password when you sign in.</CardDescription>
      </CardHeader>
      <CardContent className='grid gap-4'>
        {isLoading && <p className='text-sm text-muted-foreground'>Loading…</p>}
        {error !== undefined && (
          <p role='alert' className='text-sm text-destructive'>
            Your sign-in methods could not be loaded: {error.message}
          </p>
        )}
        {(methods ?? []).length > 0 && (
          <ul aria-label='Sign-in methods' className='divide-y rounded-md border'>
            {(methods ?? []).map((method) => (
              <li key={method.id} className='grid gap-3 p-4'>
                <div className='flex flex-wrap items-center gap-2'>
                  <span className='font-medium'>{METHOD_LABELS.get(method.method_type) ?? method.method_type}</span>
                  <Badge variant={method.verification && method.is_enabled ? 'default' : 'secondary'}>
                    {methodState(method)}
                  </Badge>
                  {method.is_primary && <Badge variant='outline'>Primary</Badge>}
                </div>
                <div className='flex flex-wrap gap-2'>
                  {!method.verification && method.method_type === 'totp' && (
                    <Button size='sm' onClick={() => void startEnrolment(method)}>
                      Finish setup
                    </Button>
                  )}
                  {method.verification && (
                    <Button size='sm' variant='outline' onClick={() => void regenerateCodes(method)}>
                      New recovery codes
                    </Button>
                  )}
                  {method.verification && method.is_enabled && (
                    <Button size='sm' variant='outline' onClick={() => setPending({ kind: 'disable', method })}>
                      Turn off
                    </Button>
                  )}
                  <Button
                    size='sm'
                    variant='outline'
                    className='text-destructive'
                    onClick={() => {
                      if (method.verification) {
                        setPending({ kind: 'remove', method });
                      } else {
                        void change('remove', method);
                      }
                    }}
                  >
                    Remove
                  </Button>
                </div>
                {pending !== null &&
                  (pending.kind === 'disable' || pending.kind === 'remove') &&
                  pending.method.id === method.id && (
                    <CodeForm
                      id={`mfa-${pending.kind}-code`}
                      label='Authenticator or recovery code'
                      submitLabel={pending.kind === 'disable' ? 'Turn off' : 'Remove'}
                      onSubmit={async (code) => change(pending.kind, method, code)}
                      onCancel={() => setPending(null)}
                    />
                  )}
              </li>
            ))}
          </ul>
        )}
        {pending?.kind === 'enrol' && (
          <TotpEnrolment
            provisioning={pending.provisioning}
            onVerify={async (code) => verifyEnrolment(pending.method, code)}
            onCancel={() => setPending(null)}
          />
        )}
        {pending?.kind === 'codes' && <RecoveryCodes codes={pending.codes} onDone={() => setPending(null)} />}
        {!hasTotp && pending === null && methods !== undefined && (
          <div>
            <Button onClick={() => void startEnrolment()}>Set up an authenticator app</Button>
          </div>
        )}
        {problem !== null && (
          <p role='alert' className='text-sm text-destructive'>
            {problem}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

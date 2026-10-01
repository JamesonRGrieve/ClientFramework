'use client';
// SPDX-License-Identifier: AGPL-3.0-or-later
import PasswordField from '@jgrieve/forms/PasswordField';
import { Button } from '@jgrieve/forms/components/ui/button';
import { knownRules, type PasswordPolicy, type PasswordRule } from '@zephyrex/auth/lib/passwordPolicy';
import { PasswordRules } from '@zephyrex/auth/PasswordRules';
import { type ReactElement, type SyntheticEvent, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../../../components/ui/card';
import { ApiError } from '../../../client';
import { PASSWORD_FIELDS, type PasswordChangeField, passwordChangeProblem } from './profileModel';

/** A failure names the field at fault when it is one; a server refusal is the form's. */
type ChangeStatus = { failed: boolean; message: string; field?: PasswordChangeField } | null;

const STATUS_ID = 'change-password-status';
const RULES_ID = 'change-password-rules';

const formText = (data: FormData, name: string): string => {
  const value = data.get(name);
  return typeof value === 'string' ? value : '';
};

/**
 * Change the signed-in user's password; the current password is required. `passwordPolicy` is the
 * server's rule, shown as a checklist under the new password; `undefined` until it has loaded.
 */
export function Account({
  onChangePassword,
  passwordPolicy,
}: {
  onChangePassword: (current: string, next: string) => Promise<string>;
  passwordPolicy: PasswordPolicy | undefined;
}): ReactElement {
  const [status, setStatus] = useState<ChangeStatus>(null);
  const [pending, setPending] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [refused, setRefused] = useState<PasswordRule[]>([]);

  const submit = async (form: HTMLFormElement): Promise<void> => {
    const data = new FormData(form);
    const current = formText(data, PASSWORD_FIELDS.current);
    const next = formText(data, PASSWORD_FIELDS.next);
    const problem = passwordChangeProblem(current, next, formText(data, PASSWORD_FIELDS.again), passwordPolicy);
    if (problem !== null) {
      setStatus({ failed: true, ...problem });
      return;
    }
    setPending(true);
    try {
      setStatus({ failed: false, message: await onChangePassword(current, next) });
      form.reset();
      setNewPassword('');
    } catch (error) {
      const broken = error instanceof ApiError ? knownRules(error.failed) : [];
      setRefused(broken);
      const message = error instanceof Error ? error.message : 'Your password could not be changed.';
      // A policy refusal is the new password's fault; any other refusal is the form's.
      setStatus(broken.length > 0 ? { failed: true, message, field: PASSWORD_FIELDS.next } : { failed: true, message });
    } finally {
      setPending(false);
    }
  };

  // A failure describes the field at fault, or every field when it is the form's. The new password is
  // also described by the policy checklist.
  const fieldAria = (field: PasswordChangeField): { 'aria-invalid': boolean; 'aria-describedby'?: string } => {
    const blamed = status?.failed === true && (status.field === undefined || status.field === field);
    const describedBy = [
      ...(blamed ? [STATUS_ID] : []),
      ...(field === PASSWORD_FIELDS.next && passwordPolicy !== undefined ? [RULES_ID] : []),
    ].join(' ');
    return {
      'aria-invalid': blamed && status.field === field,
      ...(describedBy === '' ? {} : { 'aria-describedby': describedBy }),
    };
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Password</CardTitle>
        <CardDescription>Change the password you sign in with.</CardDescription>
      </CardHeader>
      <CardContent>
        <form
          aria-label='Change password'
          className='grid gap-4 md:max-w-md'
          onSubmit={(event: SyntheticEvent<HTMLFormElement>) => {
            event.preventDefault();
            void submit(event.currentTarget);
          }}
        >
          <PasswordField
            id={PASSWORD_FIELDS.current}
            name={PASSWORD_FIELDS.current}
            label='Current password'
            {...fieldAria(PASSWORD_FIELDS.current)}
          />
          <PasswordField
            id={PASSWORD_FIELDS.next}
            name={PASSWORD_FIELDS.next}
            label='New password'
            autoComplete={PASSWORD_FIELDS.next}
            placeholder='Enter a new password'
            value={newPassword}
            onChange={(event) => {
              setNewPassword(event.target.value);
              setRefused([]);
            }}
            {...fieldAria(PASSWORD_FIELDS.next)}
          />
          {passwordPolicy !== undefined && (
            <PasswordRules id={RULES_ID} policy={passwordPolicy} password={newPassword} refused={refused} />
          )}
          <PasswordField
            id={PASSWORD_FIELDS.again}
            name={PASSWORD_FIELDS.again}
            label='New password (again)'
            autoComplete={PASSWORD_FIELDS.next}
            placeholder='Enter the new password again'
            {...fieldAria(PASSWORD_FIELDS.again)}
          />
          <Button type='submit' disabled={pending}>
            Change password
          </Button>
          {status !== null && (
            <p
              id={STATUS_ID}
              role={status.failed ? 'alert' : 'status'}
              className={status.failed ? 'text-sm text-destructive' : 'text-sm text-muted-foreground'}
            >
              {status.message}
            </p>
          )}
        </form>
      </CardContent>
    </Card>
  );
}

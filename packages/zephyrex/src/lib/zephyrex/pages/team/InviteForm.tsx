'use client';
// SPDX-License-Identifier: AGPL-3.0-or-later
import { Button } from '@jgrieve/forms/components/ui/button';
import { Label } from '@jgrieve/forms/components/ui/label';
import { type ReactElement, type SyntheticEvent, useId, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../../components/ui/card';
import { MAX_INVITE_EMAILS, parseInviteEmails, type Role, roleLabel } from './teamModel';
import { useTeamActions } from './useTeamManagement';

export type InviteFormProps = {
  teamId: string;
  /** The roles the viewer may invite with, lowest first; the first is preselected. */
  roles: Role[];
  onInvited: () => Promise<void>;
};

/** Invite people into a team by email; the server emails each address its link. */
export function InviteForm({ teamId, roles, onInvited }: InviteFormProps): ReactElement {
  const emailsId = useId();
  const roleId = useId();
  const { invite } = useTeamActions();
  const [emails, setEmails] = useState('');
  const [chosenRole, setChosenRole] = useState('');
  const [pending, setPending] = useState(false);
  const [notice, setNotice] = useState<{ text: string; alert: boolean } | null>(null);
  const role = roles.some(({ id }) => id === chosenRole) ? chosenRole : (roles[0]?.id ?? '');

  const submit = (event: SyntheticEvent<HTMLFormElement>): void => {
    event.preventDefault();
    const parsed = parseInviteEmails(emails);
    if ('problem' in parsed) {
      setNotice({ text: parsed.problem, alert: true });
      return;
    }
    setPending(true);
    void (async (): Promise<void> => {
      try {
        await invite(teamId, role, parsed.emails);
        setEmails('');
        setNotice({ text: `Invited ${parsed.emails.join(', ')}.`, alert: false });
        await onInvited();
      } catch (error) {
        setNotice({ text: error instanceof Error ? error.message : 'The invitation could not be sent.', alert: true });
      } finally {
        setPending(false);
      }
    })();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Invite people</CardTitle>
        <CardDescription>
          Up to {MAX_INVITE_EMAILS} addresses, separated by commas. Each gets an email with a link to join.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form className='grid gap-4' onSubmit={submit}>
          <div className='grid gap-2'>
            <Label htmlFor={emailsId}>Email addresses</Label>
            <textarea
              id={emailsId}
              className='min-h-16 rounded-md border bg-background px-3 py-2 text-sm'
              value={emails}
              onChange={(event) => setEmails(event.target.value)}
              placeholder='ada@example.com, grace@example.com'
            />
          </div>
          <div className='grid gap-2'>
            <Label htmlFor={roleId}>Role</Label>
            <select
              id={roleId}
              className='rounded-md border bg-background px-3 py-2 text-sm'
              value={role}
              onChange={(event) => setChosenRole(event.target.value)}
            >
              {roles.map((option) => (
                <option key={option.id} value={option.id}>
                  {roleLabel(option)}
                </option>
              ))}
            </select>
          </div>
          <Button type='submit' disabled={pending || role === ''}>
            Send invitations
          </Button>
          {notice !== null && (
            <p role={notice.alert ? 'alert' : 'status'} className={notice.alert ? 'text-sm text-destructive' : 'text-sm'}>
              {notice.text}
            </p>
          )}
        </form>
      </CardContent>
    </Card>
  );
}

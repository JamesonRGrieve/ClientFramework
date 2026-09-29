'use client';
// SPDX-License-Identifier: AGPL-3.0-or-later
import { type JSX, type SyntheticEvent, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { ProviderInstance } from '@/lib/zephyrex/providerScope';

export type InstanceDialog = 'create' | 'rename' | 'delete' | null;

export interface NewInstanceFields {
  name: string;
  modelName: string;
  apiKey: string;
}

const formText = (data: FormData, name: string): string => {
  const value = data.get(name);
  return typeof value === 'string' ? value.trim() : '';
};

function LabelledInput({
  id,
  label,
  type = 'text',
  defaultValue,
  required = false,
}: {
  id: string;
  label: string;
  type?: 'text' | 'password';
  defaultValue?: string;
  required?: boolean;
}): JSX.Element {
  return (
    <div className='grid gap-1.5'>
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        name={id}
        type={type}
        required={required}
        autoComplete='off'
        {...(defaultValue === undefined ? {} : { defaultValue })}
      />
    </div>
  );
}

/** Create, rename and delete dialogs for the instance in scope; the caller closes them once an action succeeds. */
export function InstanceDialogs({
  open,
  providerLabel,
  instance,
  onClose,
  onCreate,
  onRename,
  onDelete,
}: {
  open: InstanceDialog;
  providerLabel: string | null;
  instance: ProviderInstance | null;
  onClose: () => void;
  onCreate: (fields: NewInstanceFields) => Promise<void>;
  onRename: (name: string) => Promise<void>;
  onDelete: () => Promise<void>;
}): JSX.Element {
  const [pending, setPending] = useState(false);

  const run = async (action: () => Promise<void>): Promise<void> => {
    setPending(true);
    try {
      await action();
    } finally {
      setPending(false);
    }
  };

  const submit =
    (handle: (data: FormData) => Promise<void>) =>
    (event: SyntheticEvent<HTMLFormElement>): void => {
      event.preventDefault();
      const data = new FormData(event.currentTarget);
      void run(async () => handle(data));
    };

  const close = (isOpen: boolean): void => {
    if (!isOpen) {
      onClose();
    }
  };

  return (
    <>
      <Dialog open={open === 'create'} onOpenChange={close}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New {providerLabel ?? 'provider'} instance</DialogTitle>
          </DialogHeader>
          <form
            aria-label='Create provider instance'
            className='grid gap-4'
            onSubmit={submit(async (data) =>
              onCreate({
                name: formText(data, 'instance-name'),
                modelName: formText(data, 'instance-model'),
                apiKey: formText(data, 'instance-api-key'),
              }),
            )}
          >
            <LabelledInput id='instance-name' label='Name' required />
            <LabelledInput id='instance-model' label='Model name' />
            <LabelledInput id='instance-api-key' label='API key' type='password' />
            <DialogFooter>
              <Button type='button' variant='outline' onClick={onClose}>
                Cancel
              </Button>
              <Button type='submit' disabled={pending}>
                Create
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={open === 'rename'} onOpenChange={close}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename {instance?.name ?? 'instance'}</DialogTitle>
          </DialogHeader>
          <form
            aria-label='Rename provider instance'
            className='grid gap-4'
            onSubmit={submit(async (data) => onRename(formText(data, 'instance-new-name')))}
          >
            <LabelledInput id='instance-new-name' label='New name' defaultValue={instance?.name ?? ''} required />
            <DialogFooter>
              <Button type='button' variant='outline' onClick={onClose}>
                Cancel
              </Button>
              <Button type='submit' disabled={pending}>
                Rename
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={open === 'delete'} onOpenChange={close}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete {instance?.name ?? 'instance'}?</DialogTitle>
          </DialogHeader>
          <p className='text-sm text-muted-foreground'>It will no longer be available to use.</p>
          <DialogFooter>
            <Button type='button' variant='outline' onClick={onClose}>
              Cancel
            </Button>
            <Button
              type='button'
              variant='destructive'
              disabled={pending}
              onClick={() => {
                void run(onDelete);
              }}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

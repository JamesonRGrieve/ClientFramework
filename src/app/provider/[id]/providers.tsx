'use client';
// SPDX-License-Identifier: AGPL-3.0-or-later
import { useParams } from 'next/navigation.js';
import { type JSX, useState } from 'react';
import { LuCheck, LuPencil } from 'react-icons/lu';
import DynamicForm, { type DynamicFormFieldValueTypes } from '@jgrieve/forms/DynamicForm';
import {
  type ProviderInstance,
  type ProviderInstanceChanges,
  type ProviderInstanceSetting,
  useProviderInstanceActions,
  useProviderInstanceDetail,
  useProviderInstances,
} from 'zephyrex';
import { useToast } from 'zephyrex/hooks/useToast';
import { Button } from 'zephyrex/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from 'zephyrex/ui/card';
import { Input } from 'zephyrex/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from 'zephyrex/ui/table';

const formatTime = (value: string | null | undefined): string =>
  value === null || value === undefined ? '—' : new Date(value).toLocaleString();

/** The edit form's answer as instance changes; a blank API key keeps the stored one. */
export function instanceChanges(
  instance: ProviderInstance,
  submitted: Readonly<Record<string, DynamicFormFieldValueTypes>>,
): ProviderInstanceChanges {
  const text = (key: string): string => {
    const value = submitted[key];
    return typeof value === 'string' ? value.trim() : '';
  };
  const enabled = submitted['enabled'];
  return {
    ...(text('name') !== instance.name ? { name: text('name') } : {}),
    ...(text('model_name') !== (instance.model_name ?? '') ? { model_name: text('model_name') } : {}),
    ...(text('api_key') === '' ? {} : { api_key: text('api_key') }),
    ...(typeof enabled === 'boolean' && enabled !== (instance.enabled ?? true) ? { enabled } : {}),
  };
}

function SettingRow({
  setting,
  onSave,
}: {
  setting: ProviderInstanceSetting;
  /** Resolves true once saved; on failure the caller has reported why and the row stays in edit mode. */
  onSave: (setting: ProviderInstanceSetting, value: string) => Promise<boolean>;
}): JSX.Element {
  const [draft, setDraft] = useState<string | null>(null);
  const inputId = `setting-${setting.id}`;
  return (
    <TableRow>
      <TableCell className='font-mono'>
        <label htmlFor={inputId}>{setting.key}</label>
      </TableCell>
      <TableCell>
        {draft === null ? (
          <span>{setting.value ?? ''}</span>
        ) : (
          <Input
            id={inputId}
            value={draft}
            onChange={(event) => {
              setDraft(event.target.value);
            }}
          />
        )}
      </TableCell>
      <TableCell>{formatTime(setting.updated_at)}</TableCell>
      <TableCell className='text-right'>
        {draft === null ? (
          <Button
            variant='ghost'
            size='icon'
            aria-label={`Edit ${setting.key}`}
            onClick={() => {
              setDraft(setting.value ?? '');
            }}
          >
            <LuPencil aria-hidden='true' />
          </Button>
        ) : (
          <Button
            variant='ghost'
            size='icon'
            aria-label={`Save ${setting.key}`}
            onClick={() => {
              void (async (): Promise<void> => {
                if (await onSave(setting, draft)) {
                  setDraft(null);
                }
              })();
            }}
          >
            <LuCheck aria-hidden='true' />
          </Button>
        )}
      </TableCell>
    </TableRow>
  );
}

/** The selected provider instance: its details, settings and usage. */
function Providers(): JSX.Element {
  const { toast } = useToast();
  const params = useParams();
  const instanceId = typeof params['id'] === 'string' ? params['id'] : null;
  const { data: instances, isLoading } = useProviderInstances();
  const { settings, usage } = useProviderInstanceDetail(instanceId);
  const actions = useProviderInstanceActions();

  if (instanceId === null) {
    return <p className='p-8 text-center text-muted-foreground'>Choose an instance to manage it.</p>;
  }
  if (isLoading) {
    return <p className='p-8 text-center text-muted-foreground'>Loading…</p>;
  }
  const instance = instances?.find((candidate) => candidate.id === instanceId);
  if (instance === undefined) {
    return <p className='p-8 text-center text-muted-foreground'>This instance does not exist or is not visible to you.</p>;
  }

  const save = async (submitted: Record<string, DynamicFormFieldValueTypes>): Promise<void> => {
    const changes = instanceChanges(instance, submitted);
    if (Object.keys(changes).length === 0) {
      toast({ title: 'Nothing to save', description: instance.name });
      return;
    }
    try {
      await actions.update(instance.id, changes);
      toast({ title: 'Instance saved', description: instance.name });
    } catch (error) {
      toast({
        title: 'Could not save the instance',
        description: error instanceof Error ? error.message : instance.name,
        variant: 'destructive',
      });
    }
  };

  const saveSetting = async (setting: ProviderInstanceSetting, value: string): Promise<boolean> => {
    try {
      await actions.updateSetting(setting, value);
      await settings.mutate();
      return true;
    } catch (error) {
      toast({
        title: `Could not save ${setting.key}`,
        description: error instanceof Error ? error.message : setting.key,
        variant: 'destructive',
      });
      return false;
    }
  };

  return (
    <div className='grid w-full gap-6 px-2 py-6 md:px-8'>
      <Card>
        <CardHeader>
          <CardTitle>{instance.name}</CardTitle>
          <CardDescription>
            Created {formatTime(instance.created_at)} · updated {formatTime(instance.updated_at)}
          </CardDescription>
        </CardHeader>
        <CardContent className='max-w-xl'>
          <DynamicForm
            fields={{
              name: {
                type: 'text',
                display: 'Name',
                value: instance.name,
                validation: (value) => typeof value === 'string' && value.trim() !== '',
              },
              model_name: { type: 'text', display: 'Model name', value: instance.model_name ?? '' },
              api_key: { type: 'password', display: 'New API key (leave blank to keep the current one)', value: '' },
              enabled: { type: 'boolean', display: 'Enabled', value: instance.enabled ?? true },
            }}
            submitButtonText='Save instance'
            onConfirm={(submitted) => {
              void save(submitted);
            }}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Settings</CardTitle>
        </CardHeader>
        <CardContent>
          {(settings.data ?? []).length === 0 ? (
            <p className='text-sm text-muted-foreground'>No settings configured for this instance.</p>
          ) : (
            <Table aria-label='Instance settings'>
              <TableHeader>
                <TableRow>
                  <TableHead>Key</TableHead>
                  <TableHead>Value</TableHead>
                  <TableHead>Updated</TableHead>
                  <TableHead className='text-right'>Edit</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(settings.data ?? []).map((setting) => (
                  <SettingRow key={setting.id} setting={setting} onSave={saveSetting} />
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Usage</CardTitle>
        </CardHeader>
        <CardContent>
          {(usage.data ?? []).length === 0 ? (
            <p className='text-sm text-muted-foreground'>This instance has not been used yet.</p>
          ) : (
            <Table aria-label='Instance usage'>
              <TableHeader>
                <TableRow>
                  <TableHead>Measure</TableHead>
                  <TableHead className='text-right'>Total</TableHead>
                  <TableHead>Updated</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(usage.data ?? []).map((record) => (
                  <TableRow key={record.id}>
                    <TableCell className='font-mono'>{record.key ?? '—'}</TableCell>
                    <TableCell className='text-right'>{record.value ?? 0}</TableCell>
                    <TableCell>{formatTime(record.updated_at)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default Providers;

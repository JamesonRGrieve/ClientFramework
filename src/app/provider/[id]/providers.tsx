'use client';
// SPDX-License-Identifier: AGPL-3.0-or-later
import { useParams } from 'next/navigation.js';
import { type JSX, useState } from 'react';
import { LuCheck, LuPencil, LuX } from 'react-icons/lu';
import DynamicForm, { type DynamicFormFieldValueTypes } from '@jgrieve/forms/DynamicForm';
import {
  type ConflictField,
  ConflictPanel,
  type EditableProviderInstance,
  fieldDescription,
  type GuardedSave,
  type ProviderInstance,
  type ProviderInstanceChanges,
  type ProviderInstanceSetting,
  type ProviderSettingRow,
  type ProviderSettingSpec,
  settingRows,
  useEditBase,
  useProviderInstanceActions,
  useProviderInstanceDetail,
  useProviderInstances,
  useProviderSettingCatalogue,
} from 'zephyrex';
import { useToast } from 'zephyrex/hooks/useToast';
import { Button } from 'zephyrex/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from 'zephyrex/ui/card';
import { Input } from 'zephyrex/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from 'zephyrex/ui/table';
import { Textarea } from 'zephyrex/ui/textarea';

/** How many lines a multi-line setting's editor shows: enough for a PEM key's header and some body. */
const MULTILINE_ROWS = 6;

/** The instance fields a conflict compares; a replaced API key is write-only, so it is never shown. */
const INSTANCE_CONFLICT_FIELDS: readonly ConflictField<EditableProviderInstance>[] = [
  { key: 'name', label: 'Name' },
  { key: 'model_name', label: 'Model name' },
  { key: 'enabled', label: 'Enabled' },
];

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

/** Where a setting's value comes from when the instance sets none: its environment variable, then its default. */
export function fallbackText(spec: ProviderSettingSpec | null): string {
  if (spec === null) {
    return 'No longer read by this provider';
  }
  const fallbacks = [
    ...(spec.env === null || spec.env === undefined || spec.env === '' ? [] : [`$${spec.env}`]),
    ...(spec.default === null || spec.default === undefined ? [] : [`default ${String(spec.default)}`]),
  ];
  return fallbacks.length === 0 ? 'Not set' : `Not set: falls back to ${fallbacks.join(', then ')}`;
}

/** What the table shows for a row's value: a secret only says whether it is set. */
export function shownValue(row: ProviderSettingRow): string {
  if (row.setting === null) {
    return fallbackText(row.spec);
  }
  return row.writeOnly ? 'Set' : (row.setting.value ?? '');
}

function SettingRow({
  row,
  onSave,
  onClear,
}: {
  row: ProviderSettingRow;
  /** Resolves true once saved; on failure the caller has reported why and the row stays in edit mode. */
  onSave: (row: ProviderSettingRow, value: string) => Promise<boolean>;
  onClear: (setting: ProviderInstanceSetting) => Promise<void>;
}): JSX.Element {
  const [draft, setDraft] = useState<string | null>(null);
  // The row as it was when editing began: the save is guarded by it, not by a newer one re-read since.
  const [editedFrom, setEditedFrom] = useState(row);
  const inputId = `setting-${row.key}`;
  return (
    <TableRow>
      <TableCell>
        <label htmlFor={inputId} className='font-mono'>
          {row.key}
        </label>
        {row.spec?.description !== null && row.spec?.description !== undefined && (
          <p className='text-xs text-muted-foreground'>{row.spec.description}</p>
        )}
      </TableCell>
      <TableCell>
        {draft === null ? (
          <span className={`whitespace-pre-wrap ${row.setting === null ? 'text-muted-foreground' : ''}`}>
            {shownValue(row)}
          </span>
        ) : row.spec?.multiline === true ? (
          // A key or certificate spans lines, which a password field can't hold; a secret one is
          // still entered blank and never shown back.
          <Textarea
            id={inputId}
            autoComplete='off'
            spellCheck={false}
            rows={MULTILINE_ROWS}
            className='font-mono'
            value={draft}
            onChange={(event) => {
              setDraft(event.target.value);
            }}
          />
        ) : (
          <Input
            id={inputId}
            type={row.writeOnly ? 'password' : 'text'}
            autoComplete='off'
            value={draft}
            onChange={(event) => {
              setDraft(event.target.value);
            }}
          />
        )}
      </TableCell>
      <TableCell>{formatTime(row.setting?.updated_at)}</TableCell>
      <TableCell className='text-right'>
        {draft === null ? (
          <>
            <Button
              variant='ghost'
              size='icon'
              aria-label={`${row.setting === null ? 'Set' : row.writeOnly ? 'Replace' : 'Edit'} ${row.key}`}
              onClick={() => {
                // A secret's value never comes back, so editing one starts blank.
                setDraft(row.writeOnly ? '' : (row.setting?.value ?? ''));
                setEditedFrom(row);
              }}
            >
              <LuPencil aria-hidden='true' />
            </Button>
            {row.setting !== null && (
              <Button
                variant='ghost'
                size='icon'
                aria-label={`Clear ${row.key}`}
                onClick={() => {
                  if (row.setting !== null) {
                    void onClear(row.setting);
                  }
                }}
              >
                <LuX aria-hidden='true' />
              </Button>
            )}
          </>
        ) : (
          <Button
            variant='ghost'
            size='icon'
            aria-label={`Save ${row.key}`}
            onClick={() => {
              void (async (): Promise<void> => {
                if (await onSave(editedFrom, draft)) {
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

/**
 * An instance's details form, saved over the instance it was filled from: a newer one re-read
 * while the user edits leaves the form, and its guard, on the one they started from.
 */
function InstanceForm({
  instance,
  apiKeyName,
  update,
}: {
  instance: ProviderInstance;
  apiKeyName: string;
  update: GuardedSave<EditableProviderInstance>;
}): JSX.Element {
  const { toast } = useToast();
  const { base, rebaseOnSave } = useEditBase(instance);

  // An instance edit says when it is saved; refused as stale, its conflict shows under the form.
  const settle = async (saving: Promise<boolean>): Promise<void> => {
    try {
      if (await rebaseOnSave(saving)) {
        toast({ title: 'Instance saved', description: base.name });
      }
    } catch (error) {
      toast({
        title: 'Could not save the instance',
        description: error instanceof Error ? error.message : base.name,
        variant: 'destructive',
      });
    }
  };

  const save = async (submitted: Record<string, DynamicFormFieldValueTypes>): Promise<void> => {
    const changes = instanceChanges(base, submitted);
    if (Object.keys(changes).length === 0) {
      toast({ title: 'Nothing to save', description: base.name });
      return;
    }
    await settle(update.save(base, changes));
  };

  return (
    <>
      <DynamicForm
        fields={{
          name: {
            type: 'text',
            display: 'Name',
            value: base.name,
            validation: (value) => typeof value === 'string' && value.trim() !== '',
          },
          model_name: { type: 'text', display: 'Model name', value: base.model_name ?? '' },
          api_key: { type: 'password', display: `New ${apiKeyName} (leave blank to keep the current one)`, value: '' },
          enabled: { type: 'boolean', display: 'Enabled', value: base.enabled ?? true },
        }}
        submitButtonText='Save instance'
        onConfirm={(submitted) => {
          void save(submitted);
        }}
      />
      {update.conflict !== null && (
        <ConflictPanel
          conflict={update.conflict}
          fields={INSTANCE_CONFLICT_FIELDS}
          onResolve={(merged) => {
            void settle(update.resolve(merged));
          }}
          onDiscard={update.discard}
        />
      )}
    </>
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
  const instance = instances?.find((candidate) => candidate.id === instanceId);
  const { data: catalogue = [] } = useProviderSettingCatalogue(instance?.provider_id ?? null);

  if (instanceId === null) {
    return <p className='p-8 text-center text-muted-foreground'>Choose an instance to manage it.</p>;
  }
  if (isLoading) {
    return <p className='p-8 text-center text-muted-foreground'>Loading…</p>;
  }
  if (instance === undefined) {
    return <p className='p-8 text-center text-muted-foreground'>This instance does not exist or is not visible to you.</p>;
  }

  // A setting write refreshes the settings once written; refused as stale, its conflict shows above them.
  const settleSetting = async (saving: Promise<boolean>, key: string, failure: string): Promise<boolean> => {
    try {
      const written = await saving;
      if (written) {
        await settings.mutate();
      }
      return written;
    } catch (error) {
      toast({
        title: `${failure} ${key}`,
        description: error instanceof Error ? error.message : key,
        variant: 'destructive',
      });
      return false;
    }
  };

  const saveSetting = async (row: ProviderSettingRow, value: string): Promise<boolean> =>
    settleSetting(
      row.setting === null
        ? actions.createSetting(instance.id, row.key, value).then(() => true)
        : actions.updateSetting.save(row.setting, { value }),
      row.key,
      'Could not save',
    );

  const clearSetting = async (setting: ProviderInstanceSetting): Promise<void> => {
    await settleSetting(actions.removeSetting.save(setting, {}), setting.key, 'Could not clear');
  };

  const rows = settingRows(catalogue, settings.data ?? []);
  const apiKeyName = fieldDescription(catalogue, 'api_key') ?? 'API key';

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
          <InstanceForm key={instance.id} instance={instance} apiKeyName={apiKeyName} update={actions.update} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Settings</CardTitle>
        </CardHeader>
        <CardContent className='grid gap-4'>
          {actions.updateSetting.conflict !== null && (
            <ConflictPanel
              conflict={actions.updateSetting.conflict}
              fields={[{ key: 'value', label: actions.updateSetting.conflict.theirs?.key ?? 'Value' }]}
              onResolve={(merged) => {
                void settleSetting(actions.updateSetting.resolve(merged), 'the setting', 'Could not save');
              }}
              onDiscard={actions.updateSetting.discard}
            />
          )}
          {actions.removeSetting.conflict !== null && (
            <ConflictPanel
              conflict={actions.removeSetting.conflict}
              fields={[]}
              applyLabel='Clear anyway'
              onResolve={(merged) => {
                void settleSetting(actions.removeSetting.resolve(merged), 'the setting', 'Could not clear');
              }}
              onDiscard={actions.removeSetting.discard}
            />
          )}
          {rows.length === 0 ? (
            <p className='text-sm text-muted-foreground'>This provider reads no settings.</p>
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
                {rows.map((row) => (
                  <SettingRow key={row.key} row={row} onSave={saveSetting} onClear={clearSetting} />
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

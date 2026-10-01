'use client';
// SPDX-License-Identifier: AGPL-3.0-or-later
import { useParams, useRouter } from 'next/navigation.js';
import { type JSX, useMemo, useState } from 'react';
import { LuPencil, LuPlus, LuTrash2 } from 'react-icons/lu';
import {
  EMPTY_SELECTION,
  providerLabel,
  type ProviderScopeSelection,
  scopeProviderInstances,
  selectExtension,
  useProviderExtensionLinks,
  useProviderInstanceActions,
  useProviderInstances,
} from 'zephyrex';
import { useProviders, useServerExtensions, useUser } from 'zephyrex/hooks';
import { useToast } from 'zephyrex/hooks/useToast';
import { Button } from 'zephyrex/ui/button';
import { type InstanceDialog, InstanceDialogs, type NewInstanceFields } from './InstanceDialogs';
import { ScopePicker } from './ScopePicker';

/**
 * Narrow provider instances first by extension, then by provider, then pick the instance to
 * manage. Instances are the level users create, rename and delete.
 */
export function ProviderSidebar(): JSX.Element {
  const router = useRouter();
  const params = useParams();
  const instanceId = typeof params['id'] === 'string' ? params['id'] : null;
  const { toast } = useToast();

  const { data: extensions = [] } = useServerExtensions();
  const { data: providers = [] } = useProviders();
  const { data: links = [] } = useProviderExtensionLinks();
  const { data: instances = [] } = useProviderInstances();
  const { data: user } = useUser();
  const actions = useProviderInstanceActions();

  const [choice, setChoice] = useState<ProviderScopeSelection>(EMPTY_SELECTION);
  const [dialog, setDialog] = useState<InstanceDialog>(null);

  const current = instances.find((instance) => instance.id === instanceId) ?? null;
  // Opening an instance directly shows its provider as the scope until the user narrows otherwise.
  const selection = useMemo<ProviderScopeSelection>(
    () => (choice.providerId === null && current !== null ? { ...choice, providerId: current.provider_id } : choice),
    [choice, current],
  );

  const extensionsWithProviders = useMemo(
    () => extensions.filter((extension) => links.some((link) => link.extension_id === extension.id)),
    [extensions, links],
  );
  const scoped = useMemo(
    () => scopeProviderInstances({ providers, links, instances }, selection),
    [providers, links, instances, selection],
  );
  const selectedProvider = providers.find((provider) => provider.id === selection.providerId) ?? null;

  const open = (id: string | null): void => {
    router.push(id === null ? '/provider' : `/provider/${id}`);
  };

  const reportFailure = (title: string, error: Error | null): void => {
    toast({ title, description: error?.message ?? 'The server refused the change.', variant: 'destructive' });
  };

  const create = async ({ name, modelName, apiKey }: NewInstanceFields): Promise<void> => {
    if (selectedProvider === null) {
      return;
    }
    try {
      const created = await actions.create({
        name,
        provider_id: selectedProvider.id,
        ...(modelName === '' ? {} : { model_name: modelName }),
        ...(apiKey === '' ? {} : { api_key: apiKey }),
        ...(user === undefined ? {} : { user_id: user.id }),
      });
      setDialog(null);
      toast({ title: 'Instance created', description: created.name });
      open(created.id);
    } catch (error) {
      reportFailure('Could not create the instance', error instanceof Error ? error : null);
    }
  };

  const rename = async (name: string): Promise<void> => {
    if (current === null) {
      return;
    }
    try {
      await actions.update(current.id, { name });
      setDialog(null);
      toast({ title: 'Instance renamed', description: name });
    } catch (error) {
      reportFailure('Could not rename the instance', error instanceof Error ? error : null);
    }
  };

  const remove = async (): Promise<void> => {
    if (current === null) {
      return;
    }
    try {
      await actions.remove(current.id);
      setDialog(null);
      toast({ title: 'Instance deleted', description: current.name });
      open(scoped.instances.find((instance) => instance.id !== current.id)?.id ?? null);
    } catch (error) {
      reportFailure('Could not delete the instance', error instanceof Error ? error : null);
    }
  };

  return (
    <div className='grid gap-4 p-2 group-data-[collapsible=icon]:hidden'>
      <ScopePicker
        id='provider-scope-extension'
        label='Extension'
        anyLabel='All extensions'
        value={selection.extensionId}
        options={extensionsWithProviders.map((extension) => ({ value: extension.id, label: extension.name }))}
        onChange={(extensionId) => {
          setChoice(selectExtension(selection, extensionId, providers, links));
        }}
      />
      <ScopePicker
        id='provider-scope-provider'
        label='Provider'
        anyLabel='All providers'
        value={selection.providerId}
        options={scoped.providers.map((provider) => ({ value: provider.id, label: providerLabel(provider) }))}
        onChange={(providerId) => {
          setChoice({ ...selection, providerId });
        }}
      />
      <ScopePicker
        id='provider-scope-instance'
        label='Instance'
        placeholder={scoped.instances.length === 0 ? 'No instances in scope' : 'Choose an instance'}
        value={current !== null && scoped.instances.some((instance) => instance.id === current.id) ? current.id : null}
        options={scoped.instances.map((instance) => ({ value: instance.id, label: instance.name }))}
        onChange={open}
      />
      <div className='grid gap-2'>
        <Button
          variant='outline'
          disabled={selectedProvider === null}
          title={selectedProvider === null ? 'Choose a provider first' : undefined}
          onClick={() => {
            setDialog('create');
          }}
        >
          <LuPlus aria-hidden='true' /> New instance
        </Button>
        <Button
          variant='outline'
          disabled={current === null}
          onClick={() => {
            setDialog('rename');
          }}
        >
          <LuPencil aria-hidden='true' /> Rename
        </Button>
        <Button
          variant='outline'
          className='text-destructive'
          disabled={current === null}
          onClick={() => {
            setDialog('delete');
          }}
        >
          <LuTrash2 aria-hidden='true' /> Delete
        </Button>
      </div>
      <InstanceDialogs
        open={dialog}
        providerLabel={selectedProvider === null ? null : providerLabel(selectedProvider)}
        instance={current}
        onClose={() => {
          setDialog(null);
        }}
        onCreate={create}
        onRename={rename}
        onDelete={remove}
      />
    </div>
  );
}

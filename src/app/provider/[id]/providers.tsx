'use client';
// SPDX-License-Identifier: AGPL-3.0-or-later
/* eslint-disable react/no-unstable-nested-components -- column cell/header renderers are tanstack render props, not React components. */
import type { CellContext, ColumnDef } from '@tanstack/react-table';
import axios from 'axios';
import { getCookie } from 'cookies-next';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { LuCheck, LuPencil } from 'react-icons/lu';
import { DataTable } from '@/components/data-table';
import { DataTableColumnHeader } from '@/components/data-table/data-table-column-header';
import { useProviderInstance, useProviderInstances } from './useProviders';
import DynamicForm from '@jgrieve/forms/DynamicForm';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/useToast';

type SettingRow = {
  id: string;
  key: string;
  value: string;
  updated_at: string;
};

type UsageRow = {
  input_tokens: number;
  output_tokens: number;
  updated_at: string;
};

const readJwt = (): string => {
  const jwt = getCookie('jwt');
  return typeof jwt === 'string' ? jwt : '';
};

function Providers(): React.JSX.Element {
  const { toast } = useToast();
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [providerInstanceSettings, setProviderInstanceSettings] = useState<SettingRow | null>(null);
  const [providerInstanceUsage, setProviderInstanceUsage] = useState<UsageRow | UsageRow[] | null>(null);
  const [editRowId, setEditRowId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<string>('');
  const { mutate } = useProviderInstances();
  const { data: providerInstance, isLoading } = useProviderInstance(String(id));

  const settingsArray = providerInstanceSettings !== null ? [providerInstanceSettings] : [];

  // DataTable columns for settings
  const settingsColumns: ColumnDef<SettingRow>[] = [
    {
      accessorKey: 'key',
      header: ({ column }) => <DataTableColumnHeader column={column} title='Key' />,
      cell: ({ row }) => <span>{row.getValue('key')}</span>,
      meta: { headerName: 'Key' },
    },
    {
      accessorKey: 'value',
      header: ({ column }) => <DataTableColumnHeader column={column} title='Value' />,
      cell: ({ row }: CellContext<SettingRow, unknown>) => {
        const rowId = row.original.id;
        if (editRowId === rowId) {
          return (
            <input
              className='border rounded px-2 py-1 w-24'
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
            />
          );
        }
        return <span>{row.getValue('value')}</span>;
      },
      meta: { headerName: 'Value' },
    },
    {
      accessorKey: 'updated_at',
      header: ({ column }) => <DataTableColumnHeader column={column} title='Updated At' />,
      cell: ({ row }) => <span>{new Date(row.getValue('updated_at')).toLocaleString()}</span>,
      meta: { headerName: 'Updated At' },
    },
    {
      id: 'actions',
      header: ({ column }) => <DataTableColumnHeader column={column} title='Action' />,
      cell: ({ row }: CellContext<SettingRow, unknown>) => {
        const rowId = row.original.id;
        if (editRowId === rowId) {
          return (
            <Button
              variant='ghost'
              size='icon'
              title='Confirm'
              onClick={() => {
                const prevVal = providerInstanceSettings?.value ?? '';
                const settingKey = providerInstanceSettings?.key ?? '';
                setProviderInstanceSettings((prev) => (prev !== null ? { ...prev, value: editValue } : prev));
                setEditRowId(null);
                void (async (): Promise<void> => {
                  try {
                    await axios.put(
                      `${process.env.NEXT_PUBLIC_API_URI}/v1/provider-instance-setting/${rowId}`,
                      {
                        provider_instance_setting: {
                          provider_instance_id: providerInstance?.provider_id,
                          key: settingKey,
                          value: editValue,
                        },
                      },
                      {
                        headers: {
                          'Content-Type': 'application/json',
                          Authorization: `Bearer ${readJwt()}`,
                        },
                      },
                    );
                    toast({
                      title: 'Success',
                      description: 'Setting updated successfully!',
                    });
                  } catch {
                    toast({
                      title: 'Error',
                      description: 'Failed to update setting',
                      variant: 'destructive',
                    });
                    setProviderInstanceSettings((prev) => (prev !== null ? { ...prev, value: prevVal } : prev));
                  }
                })();
              }}
            >
              <LuCheck className='w-4 h-4 text-green-600' />
            </Button>
          );
        }
        return (
          <Button
            variant='ghost'
            size='icon'
            onClick={() => {
              setEditRowId(rowId);
              setEditValue(row.original.value);
            }}
            title='Edit'
          >
            <LuPencil className='w-4 h-4' />
          </Button>
        );
      },
      enableHiding: true,
      enableSorting: false,
      meta: { headerName: 'Actions' },
    },
  ];

  const usageColumns: ColumnDef<UsageRow>[] = [
    {
      accessorKey: 'input_tokens',
      header: ({ column }) => <DataTableColumnHeader column={column} title='Input Tokens' />,
      cell: ({ row }) => <span>{row.getValue('input_tokens')}</span>,
      meta: { headerName: 'Input Tokens' },
    },
    {
      accessorKey: 'output_tokens',
      header: ({ column }) => <DataTableColumnHeader column={column} title='Output Tokens' />,
      cell: ({ row }) => <span>{row.getValue('output_tokens')}</span>,
      meta: { headerName: 'Output Tokens' },
    },
    {
      accessorKey: 'updated_at',
      header: ({ column }) => <DataTableColumnHeader column={column} title='Updated At' />,
      cell: ({ row }) => <span>{new Date(row.getValue('updated_at')).toLocaleString()}</span>,
      meta: { headerName: 'Updated At' },
    },
  ];

  useEffect(() => {
    if (id === undefined) {
      return;
    }
    setLoading(true);
    const fetchAll = async (): Promise<void> => {
      const headers = {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${readJwt()}`,
      };
      const settingPromise = axios.get<{ provider_instance_setting?: SettingRow }>(
        `${process.env.NEXT_PUBLIC_API_URI}/v1/provider-instance/${String(id)}/setting`,
        { headers },
      );
      const usagePromise = axios.get<{ provider_instance_usage?: UsageRow | UsageRow[] }>(
        `${process.env.NEXT_PUBLIC_API_URI}/v1/provider-instance/usage/${String(id)}`,
        { headers },
      );

      const [settingResult, usageResult] = await Promise.allSettled([settingPromise, usagePromise]);

      setProviderInstanceSettings(
        settingResult.status === 'fulfilled' ? (settingResult.value.data.provider_instance_setting ?? null) : null,
      );
      setProviderInstanceUsage(
        usageResult.status === 'fulfilled' ? (usageResult.value.data.provider_instance_usage ?? null) : null,
      );

      setLoading(false);
    };
    void fetchAll();
  }, [id]);

  if (id === undefined) {
    return <div className='flex items-center justify-center h-64 text-lg font-semibold'>Please select a instance</div>;
  }

  if (loading || isLoading) {
    return <div className='flex items-center justify-center h-64 text-lg font-semibold'>Loading...</div>;
  }

  if (providerInstance === null || providerInstance === undefined) {
    return <div className='flex items-center justify-center h-64 text-lg font-semibold'>No data found.</div>;
  }

  return (
    <div className='w-full px-2 md:px-8 py-6 space-y-8'>
      {/* Instance Details Section */}
      <section className='border rounded-lg p-4 bg-white shadow w-full'>
        <h2 className='text-lg font-bold mb-2'>Provider Instance Details</h2>
        <div className='max-w-lg w-full'>
          <DynamicForm
            fields={{
              name: {
                type: 'text',
                display: 'Name',
                validation: (value) => typeof value === 'string' && value.length > 0,
                value: providerInstance.name,
              },
              model_name: {
                type: 'text',
                display: 'Model Name',
                validation: (value) => typeof value === 'string' && value.length > 0,
                value: providerInstance.model_name,
              },
              api_key: {
                type: 'text',
                display: 'API Key',
                validation: (value) => typeof value === 'string' && value.length > 0,
                value: providerInstance.api_key,
              },
            }}
            toUpdate={providerInstance}
            submitButtonText='Update'
            onConfirm={(formData) => {
              void (async (): Promise<void> => {
                await axios.put(
                  `${process.env.NEXT_PUBLIC_API_URI}/v1/provider/instance/${providerInstance.id}`,
                  {
                    provider_instance: {
                      name: formData['name'],
                      provider_id: providerInstance.provider_id,
                      model_name: formData['model_name'],
                      api_key: formData['api_key'],
                      enabled: formData['enabled'],
                    },
                  },
                  {
                    headers: {
                      'Content-Type': 'application/json',
                      Authorization: `Bearer ${readJwt()}`,
                    },
                  },
                );
                void mutate();
              })();
            }}
          />
        </div>

        <div className='grid grid-cols-2 gap-2 text-sm mt-4'>
          {/* <div><span className="font-medium">Provider:</span> {providerInstance.provider?.name || ''}</div>
          <div><span className="font-medium">Team:</span> {providerInstance.team?.name || ''}</div> */}
          <div>
            <span className='font-medium'>Created At:</span> {new Date(providerInstance.created_at).toLocaleString()}
          </div>
          <div>
            <span className='font-medium'>Updated At:</span> {new Date(providerInstance.updated_at).toLocaleString()}
          </div>
        </div>
      </section>

      {/* Settings Section */}
      <section className='border rounded-lg p-4 bg-white shadow w-full'>
        {settingsArray.length === 0 ? (
          <>
            <h4 className='text-2xl font-bold mr-auto mb-2'>Instance Settings</h4>
            <div className='flex items-center justify-center p-4 border rounded-md text-center'>
              <span className='text-sm text-muted-foreground'>No settings configured for this instance.</span>
            </div>
          </>
        ) : (
          <DataTable
            data={settingsArray}
            columns={settingsColumns}
            meta={{
              title: 'Instance Settings',
              hideSelectionCount: true,
              emptyMessage: 'No data',
            }}
          />
        )}
      </section>

      {/* Usage Section as Data Grid */}
      <section className='border rounded-lg p-4 bg-white shadow w-full'>
        <DataTable
          data={
            Array.isArray(providerInstanceUsage)
              ? providerInstanceUsage
              : providerInstanceUsage !== null
                ? [providerInstanceUsage]
                : []
          }
          meta={{ title: 'Instance Usage', hideSelectionCount: true, emptyMessage: 'No data' }}
          columns={usageColumns}
        />
      </section>
    </div>
  );
}
/* eslint-enable react/no-unstable-nested-components */

export default Providers;

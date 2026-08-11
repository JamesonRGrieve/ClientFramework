'use client';
// SPDX-License-Identifier: AGPL-3.0-or-later

import axios from 'axios';
import { getCookie } from 'cookies-next';
import { Plus, Wrench } from 'lucide-react';
import { useMemo, useState } from 'react';
import { LuUnlink as Unlink } from 'react-icons/lu';
import MarkdownBlock from '@/components/markdown/MarkdownBlock';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useProviders } from '@/hooks/useProvider';
import type { Provider } from '@/hooks/z';

type ErrorState = {
  type: 'success' | 'error';
  message: string;
} | null;

const readJwt = (): string => {
  const jwt = getCookie('jwt');
  return typeof jwt === 'string' ? jwt : '';
};

const SECRET_KEYWORDS = ['API_KEY', 'SECRET', 'PASSWORD', 'TOKEN'];

export function Providers(): React.JSX.Element {
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [error, setError] = useState<ErrorState>(null);
  const cookieAgent = getCookie('aginterface-agent');
  const cookieAgentName = typeof cookieAgent === 'string' ? cookieAgent : '';
  const agentName = cookieAgentName !== '' ? cookieAgentName : (process.env.NEXT_PUBLIC_AGINTERACTIVE_AGENT ?? '');
  const { data: providerData } = useProviders();

  // Connected / available provider lists are not wired up in this template;
  // downstream apps populate them. Typed so the renderers stay type-safe.
  const providers = useMemo<{ connected: Provider[]; available: Provider[] }>(() => ({ connected: [], available: [] }), []);

  const handleSaveSettings = async (_providerName: string, newSettings: Record<string, string>): Promise<void> => {
    try {
      setError(null);
      const response = await axios.put<{ status: number; data: Record<string, unknown> }>(
        `${process.env.NEXT_PUBLIC_API_URI}/api/agent/${agentName}`,
        {
          agent_name: agentName,
          settings: newSettings,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: readJwt(),
          },
        },
      );

      if (response.status === 200) {
        setError({
          type: 'success',
          message: 'Extension connected successfully!',
        });
        window.location.reload();
      }
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { detail?: string } }; message?: string };
      setError({
        type: 'error',
        message: axiosErr.response?.data?.detail ?? axiosErr.message ?? 'Failed to connect extension',
      });
    }
  };

  const handleDisconnect = async (name: string): Promise<void> => {
    const extension = providerData?.find((ext) => ext.name === name);
    if (extension === undefined) {
      return;
    }
    const emptySettings = (extension.settings ?? [])
      .filter((setting) => SECRET_KEYWORDS.some((keyword) => setting.name.replaceAll('TOKENS', '').includes(keyword)))
      .reduce<Record<string, string>>((acc, setting) => ({ ...acc, [setting.name]: '' }), {});
    await handleSaveSettings(extension.name, emptySettings);
  };

  return (
    <div className='space-y-6'>
      <div className='grid gap-4'>
        {providers.connected.map((provider) => (
          <div
            key={provider.name}
            className='flex flex-col gap-4 p-4 transition-colors border rounded-lg bg-background/95 backdrop-blur-sm supports-backdrop-filter:bg-background/60'
          >
            <div className='flex items-center gap-4'>
              <div className='flex items-center flex-1 min-w-0 gap-3.5'>
                <Wrench className='shrink-0 w-5 h-5 text-muted-foreground' />
                <div>
                  <h4 className='font-medium truncate'>{provider.name}</h4>
                  <p className='text-sm text-muted-foreground'>Connected</p>
                </div>
              </div>
              <Button variant='outline' size='sm' className='gap-2' onClick={() => void handleDisconnect(provider.name)}>
                <Unlink className='w-4 h-4' />
                Disconnect
              </Button>
            </div>
            <div className='text-sm text-muted-foreground'>
              <MarkdownBlock content={provider.description ?? ''} />
            </div>
          </div>
        ))}

        {providers.available.map((provider) => (
          <div
            key={provider.name}
            className='flex flex-col gap-4 p-4 transition-colors border rounded-lg bg-background/95 backdrop-blur-sm supports-backdrop-filter:bg-background/60'
          >
            <div className='flex items-center gap-4'>
              <div className='flex items-center flex-1 min-w-0 gap-3.5'>
                <Wrench className='shrink-0 w-5 h-5 text-muted-foreground' />
                <div>
                  <h4 className='font-medium truncate'>{provider.friendlyName}</h4>
                  <p className='text-sm text-muted-foreground'>Not Connected</p>
                </div>
              </div>
              <Dialog>
                <DialogTrigger asChild>
                  <Button
                    variant='outline'
                    size='sm'
                    className='gap-2'
                    onClick={() => {
                      // Initialize settings with the default values from provider.settings
                      setSettings(
                        (provider.settings ?? []).reduce<Record<string, string>>((acc, setting) => {
                          acc[setting.name] = typeof setting.value === 'string' ? setting.value : '';
                          return acc;
                        }, {}),
                      );
                    }}
                  >
                    <Plus className='w-4 h-4' />
                    Connect
                  </Button>
                </DialogTrigger>
                <DialogContent className='sm:max-w-[425px]'>
                  <DialogHeader>
                    <DialogTitle>Configure {provider.name}</DialogTitle>
                    <DialogDescription>
                      Enter the required credentials to enable this service. {provider.description}
                    </DialogDescription>
                  </DialogHeader>

                  <div className='grid gap-4 py-4'>
                    {(provider.settings ?? []).map((prov) => (
                      <div key={prov.name} className='grid gap-2'>
                        <Label htmlFor={prov.name}>{prov.name}</Label>
                        <Input
                          id={prov.name}
                          type={
                            prov.name.toLowerCase().includes('key') || prov.name.toLowerCase().includes('password')
                              ? 'password'
                              : 'text'
                          }
                          defaultValue={typeof prov.value === 'string' ? prov.value : ''}
                          value={settings[prov.name]}
                          onChange={(e) =>
                            setSettings((prev) => ({
                              ...prev,
                              [prov.name]: e.target.value,
                            }))
                          }
                          placeholder={`Enter ${prov.name.toLowerCase()}`}
                        />
                      </div>
                    ))}
                  </div>

                  <DialogFooter>
                    <Button onClick={() => void handleSaveSettings(provider.name, settings)}>Connect Provider</Button>
                  </DialogFooter>

                  {error !== null && (
                    <Alert variant={error.type === 'success' ? 'default' : 'destructive'}>
                      <AlertDescription>{error.message}</AlertDescription>
                    </Alert>
                  )}
                </DialogContent>
              </Dialog>
            </div>
            <div className='text-sm text-muted-foreground'>
              <MarkdownBlock
                content={
                  provider.description !== undefined && provider.description !== ''
                    ? provider.description
                    : 'No description available'
                }
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Providers;

'use client';

import axios from 'axios';
import { getCookie } from 'cookies-next';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import Extension, { type ExtensionData } from './extension';
import { ConnectedServices } from '@jgrieve/auth/management/ConnectedServices';
import { useTeam } from '@jgrieve/auth/hooks/useTeam';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

import MarkdownBlock from '@/components/markdown/MarkdownBlock';
import { Input } from '@/components/ui/input';

// System-defined extensions which should be read-only in the UI
const SYSTEM_EXTENSIONS = ['text-to-speech', 'web-search', 'image-generation', 'analysis'];

// Types remain the same
type Command = {
  friendly_name: string;
  description: string;
  command_name: string;
  command_args: Record<string, string>;
  enabled?: boolean;
  extension_name?: string;
};

type Extension = {
  extension_name: string;
  description: string;
  settings: string[];
  commands: Command[];
};

type ErrorState = {
  type: 'success' | 'error';
  message: string;
} | null;

type AgentData = {
  agent_name?: string;
  extensions?: Extension[];
} | null;

const readJwt = (): string => {
  const jwt = getCookie('jwt');
  return typeof jwt === 'string' ? jwt : '';
};

/** No-op handler for the read-only built-in extensions, which are not editable. */
const noop = (): void => {
  /* read-only built-in extension: nothing to do */
};

export function Extensions(): React.JSX.Element {
  const pathname = usePathname();
  // Agent-scoped data is not wired up in this template; downstream apps inject
  // it. Typed via `as` so the literal `null` does not narrow away the shape.
  const agentData = null as AgentData;
  const mutateAgent = (): void => {
    /* no-op until agent data is wired up downstream */
  };
  const [searchText, setSearchText] = useState('');
  const router = useRouter();
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [error, setError] = useState<ErrorState>(null);
  const [showEnabledOnly, setShowEnabledOnly] = useState(false);
  const cookieAgent = getCookie('aginteractive-agent');
  const cookieAgentName = typeof cookieAgent === 'string' ? cookieAgent : '';
  const agentName =
    cookieAgentName !== '' ? cookieAgentName : (process.env.NEXT_PUBLIC_AGINTERACTIVE_AGENT ?? agentData?.agent_name ?? '');
  const { data: activeCompany, mutate: mutateCompany } = useTeam();
  const searchParams = useSearchParams();
  // Filter extensions for the enabled commands view
  const companyExtensions = (activeCompany as { extensions?: Extension[] } | undefined)?.extensions ?? [];
  const extensions: Extension[] = searchParams.get('mode') === 'company' ? companyExtensions : (agentData?.extensions ?? []);
  const extensionsWithCommands = extensions.filter((ext) => ext.commands.length > 0);
  // Categorize extensions for the available tab
  const categorizeExtensions = (
    exts: Extension[],
  ): { connectedExtensions: Extension[]; availableExtensions: Extension[] } => {
    return {
      // Connected extensions are those with settings and at least one command
      connectedExtensions: filterExtensions(
        exts.filter((ext) => ext.settings.length > 0 && ext.commands.length > 0),
        searchText,
      ),
      // Available extensions are those with settings that aren't connected yet
      availableExtensions: filterExtensions(
        exts.filter((ext) => ext.settings.length > 0 && ext.commands.length === 0),
        searchText,
      ),
    };
  };

  const handleToggleCommand = async (commandName: string, enabled: boolean): Promise<void> => {
    try {
      const result = await axios.patch(
        searchParams.get('mode') === 'company'
          ? `${process.env.NEXT_PUBLIC_API_URI}/v1/companies/${activeCompany?.id}/command`
          : `${process.env.NEXT_PUBLIC_API_URI}/api/agent/${agentName}/command`,

        {
          command_name: commandName,
          enable: enabled,
        },
        {
          headers: {
            Authorization: readJwt(),
          },
        },
      );

      if (result.status === 200) {
        if (searchParams.get('mode') === 'company') {
          void mutateCompany();
        } else {
          mutateAgent();
        }
      }
    } catch (err) {
      console.error('Failed to toggle command:', err);
      setError({
        type: 'error',
        message: 'Failed to toggle command. Please try again.',
      });
    }
  };

  const handleSaveSettings = async (_extensionName: string, newSettings: Record<string, string>): Promise<void> => {
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

  const handleDisconnect = async (extension: ExtensionData): Promise<void> => {
    const emptySettings = extension.settings.reduce<Record<string, string>>(
      (acc, setting) => ({ ...acc, [setting]: '' }),
      {},
    );
    await handleSaveSettings(extension.extension_name, emptySettings);
  };

  function filterExtensions(exts: Extension[], text: string): Extension[] {
    return text !== ''
      ? exts
      : exts.filter(
          (ext) =>
            ext.extension_name.toLowerCase().includes(text.toLowerCase()) ||
            ext.description.toLowerCase().includes(text.toLowerCase()),
        );
  }
  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab === null || tab === '') {
      router.push(`${pathname}?tab=extensions`);
    }
  }, [searchParams, router, pathname]);
  const { connectedExtensions, availableExtensions } = categorizeExtensions(extensions);
  return (
    <div className='space-y-6'>
      <Tabs defaultValue={searchParams.get('tab') ?? 'extensions'} className='space-y-4'>
        <div className='flex items-center gap-2'>
          <TabsList>
            <TabsTrigger value='extensions' onClick={() => router.push(`${pathname}?tab=extensions`)}>
              Extensions
            </TabsTrigger>
            <TabsTrigger value='abilities' onClick={() => router.push(`${pathname}?tab=abilities`)}>
              Abilities
            </TabsTrigger>
          </TabsList>
          {/* {activeCompany?.my_role >= 2 && (
            <>
              <Switch
                id='company-mode'
                checked={searchParams.get('mode') === 'company'}
                onCheckedChange={(checked) => {
                  const params = new URLSearchParams(searchParams);
                  if (checked) {
                    params.set('mode', 'company');
                  } else {
                    params.delete('mode');
                  }
                  router.push(`${pathname}?${params.toString()}`);
                }}
              />
              <Label htmlFor='company-mode'>Company Mode</Label>
            </>
          )} */}
        </div>
        <TabsContent value='abilities' className='space-y-4'>
          <div className='flex items-center justify-between mb-4'>
            <h3 className='text-lg font-medium'>Enabled Abilities</h3>
            <div className='flex items-center gap-2'>
              <Label htmlFor='show-enabled-only'>Show Enabled Only</Label>
              <Switch id='show-enabled-only' checked={showEnabledOnly} onCheckedChange={setShowEnabledOnly} />
            </div>
          </div>

          {extensionsWithCommands.length === 0 ? (
            <Alert>
              <AlertDescription>
                No extensions are currently enabled. Enable extensions to see their abilities here.
              </AlertDescription>
            </Alert>
          ) : (
            <div className='grid gap-4'>
              <Input placeholder='Search...' value={searchText} onChange={(e) => setSearchText(e.target.value)} />
              {extensionsWithCommands
                .sort((a, b) => a.extension_name.localeCompare(b.extension_name))
                .map((extension) => (
                  <Card key={extension.extension_name}>
                    <CardHeader>
                      <CardTitle>{extension.extension_name}</CardTitle>
                      <CardDescription>
                        <MarkdownBlock
                          content={extension.description !== '' ? extension.description : 'No description available'}
                        />
                      </CardDescription>
                    </CardHeader>
                    <CardContent className='space-y-4'>
                      {extension.commands
                        .filter((command) =>
                          [command.command_name, command.extension_name, command.friendly_name, command.description].some(
                            (value) => (value ?? '').toLowerCase().includes(searchText.toLowerCase()),
                          ),
                        )
                        .filter((command) => !showEnabledOnly || command.enabled === true)
                        .map((command) => {
                          const isSystemExtension = SYSTEM_EXTENSIONS.includes(extension.extension_name);
                          return (
                            <Card key={command.command_name} className='p-4 border border-border/50'>
                              <div className='flex items-center mb-2'>
                                <Switch
                                  checked={command.enabled === true}
                                  disabled={isSystemExtension}
                                  onCheckedChange={
                                    isSystemExtension
                                      ? undefined
                                      : (checked): void => void handleToggleCommand(command.friendly_name, checked)
                                  }
                                />
                                <h4 className='text-lg font-medium'>&nbsp;&nbsp;{command.friendly_name}</h4>
                              </div>
                              <MarkdownBlock
                                content={
                                  command.description !== ''
                                    ? command.description.split('\nArgs')[0]
                                    : 'No description available'
                                }
                              />
                            </Card>
                          );
                        })}
                    </CardContent>
                  </Card>
                ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value='extensions' className='space-y-4'>
          <div className='grid gap-4'>
            <p className='text-sm text-muted-foreground'>
              Manage your connected third-party extensions that grant your agent additional capabilities through abilities.
            </p>
            {searchParams.get('mode') !== 'company' &&
              [
                {
                  extension_name: 'text-to-speech',
                  friendly_name: 'Text to Speech',
                  description: 'Convert text responses to spoken audio output.',
                  settings: [],
                },
                {
                  extension_name: 'web-search',
                  friendly_name: 'Web Search',
                  description: 'Search and reference current web content.',
                  settings: [],
                },
                {
                  extension_name: 'image-generation',
                  friendly_name: 'Image Generation',
                  description: 'Create AI-generated images from text descriptions.',
                  settings: [],
                },
                {
                  extension_name: 'analysis',
                  friendly_name: 'File Analysis',
                  description: 'Analyze uploaded files and documents for insights.',
                  settings: [],
                },
              ].map((ext) => (
                <Extension
                  key={ext.extension_name}
                  extension={ext}
                  connected={false}
                  onConnect={noop}
                  onDisconnect={noop}
                  settings={{}}
                  setSettings={noop}
                  error={null}
                  setSelectedExtension={noop}
                />
              ))}
            {searchParams.get('mode') !== 'company' && <ConnectedServices />}
            {connectedExtensions.map((extension) => (
              <Extension
                key={extension.extension_name}
                extension={extension}
                connected
                onDisconnect={handleDisconnect}
                settings={settings}
                onConnect={handleSaveSettings}
                setSettings={setSettings}
                error={error}
              />
            ))}

            {availableExtensions.map((extension) => (
              <Extension
                key={extension.extension_name}
                extension={extension}
                onDisconnect={handleDisconnect}
                connected={false}
                onConnect={handleSaveSettings}
                settings={settings}
                setSettings={setSettings}
                error={error}
              />
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default Extensions;

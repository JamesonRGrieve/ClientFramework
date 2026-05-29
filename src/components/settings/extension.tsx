import { getCookie } from 'cookies-next';
import { Plus, Unlink, Wrench } from 'lucide-react';
import { useEffect, useState } from 'react';
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

const OVERRIDE_EXTENSIONS: Record<string, { name: string; label: string }> = {
  'text-to-speech': { name: 'tts', label: 'Text to Speech' },
  'web-search': { name: 'websearch', label: 'Web Search' },
  'image-generation': { name: 'create-image', label: 'Image Generation' },
  analysis: { name: 'analyze-user-input', label: 'File Analysis' },
};

export type ExtensionData = {
  extension_name: string;
  friendly_name?: string;
  description?: string;
  settings: string[];
  system?: boolean;
};

type ExtensionErrorState = {
  type: 'success' | 'error';
  message: string;
} | null;

interface ExtensionProps {
  extension: ExtensionData;
  connected?: boolean;
  onDisconnect: (extension: ExtensionData) => void | Promise<void>;
  onConnect: (extensionName: string, settings: Record<string, string>) => void | Promise<void>;
  settings?: Record<string, string>;
  setSettings: (updater: Record<string, string> | ((prev: Record<string, string>) => Record<string, string>)) => void;
  error?: ExtensionErrorState;
  setSelectedExtension?: (extensionName: string) => void;
}

export default function Extension({
  extension,
  connected = false,
  onDisconnect,
  onConnect,
  settings = {},
  setSettings,
  error = null,
  setSelectedExtension = () => {
    /* no-op default */
  },
}: ExtensionProps): React.JSX.Element {
  const [state, setState] = useState(false);

  useEffect(() => {
    const override = OVERRIDE_EXTENSIONS[extension.extension_name] as { name: string; label: string } | undefined;
    setState(override !== undefined && getCookie(`aginteractive-${override.name}`) === 'true');
  }, [extension.extension_name]);
  // Treat known overrides as system-defined (read-only) unless an explicit flag is provided
  const isOverride = Object.keys(OVERRIDE_EXTENSIONS).includes(extension.extension_name);
  const isSystemDefined = isOverride || extension.system === true;
  const displayName =
    extension.friendly_name !== undefined && extension.friendly_name !== ''
      ? extension.friendly_name
      : extension.extension_name;
  const statusLabel = isOverride ? (state ? 'Enabled' : 'Disabled') : connected ? 'Connected' : 'Not Connected';
  // Map-based lookup avoids dynamic object-index access (security/detect-object-injection).
  const settingsMap = new Map(Object.entries(settings));
  return (
    <div className='flex flex-col gap-2 p-3 transition-colors border rounded-lg bg-background/95 backdrop-blur-sm supports-backdrop-filter:bg-background/60'>
      <div className='flex items-center gap-2'>
        <div className='flex items-center flex-1 min-w-0 gap-3.5'>
          <Wrench className='shrink-0 w-5 h-5 text-muted-foreground' />
          <div>
            <h4 className='font-medium truncate'>{displayName}</h4>
            <p className='text-sm text-muted-foreground'>{statusLabel}</p>
          </div>
        </div>

        {isSystemDefined ? (
          // System-defined extensions are read-only: no connect/disconnect/enable controls
          <div className='text-sm text-muted-foreground'>System extension (read-only)</div>
        ) : connected ? (
          <Button variant='outline' size='sm' className='gap-2' onClick={() => onDisconnect(extension)}>
            <Unlink className='w-4 h-4' />
            Disconnect
          </Button>
        ) : (
          <Dialog>
            <DialogTrigger asChild>
              <Button
                variant='outline'
                size='sm'
                className='gap-2'
                onClick={() => {
                  setSelectedExtension(extension.extension_name);
                  setSettings(
                    extension.settings.reduce<Record<string, string>>((acc, setting) => ({ ...acc, [setting]: '' }), {}),
                  );
                }}
              >
                <Plus className='w-4 h-4' />
                Connect
              </Button>
            </DialogTrigger>
            <DialogContent className='sm:max-w-[425px]'>
              <DialogHeader>
                <DialogTitle>Configure {displayName}</DialogTitle>
                <DialogDescription>Enter the required credentials to enable this service.</DialogDescription>
              </DialogHeader>

              <div className='grid gap-4 py-4'>
                {extension.settings.map((setting) => (
                  <div key={setting} className='grid gap-2'>
                    <Label htmlFor={setting}>{setting}</Label>
                    <Input
                      id={setting}
                      type={
                        setting.toLowerCase().includes('key') || setting.toLowerCase().includes('password')
                          ? 'password'
                          : 'text'
                      }
                      value={settingsMap.get(setting) ?? ''}
                      onChange={(e) =>
                        setSettings((prev) => ({
                          ...prev,
                          [setting]: e.target.value,
                        }))
                      }
                      placeholder={`Enter ${setting.toLowerCase()}`}
                    />
                  </div>
                ))}
              </div>

              <DialogFooter>
                <Button onClick={() => onConnect(extension.extension_name, settings)}>Connect Extension</Button>
              </DialogFooter>

              {error !== null && (
                <Alert variant={error.type === 'success' ? 'default' : 'destructive'}>
                  <AlertDescription>{error.message}</AlertDescription>
                </Alert>
              )}
            </DialogContent>
          </Dialog>
        )}
      </div>
      <div className='text-sm text-muted-foreground'>
        <MarkdownBlock
          content={
            extension.description !== undefined && extension.description !== ''
              ? extension.description
              : 'No description available'
          }
        />
      </div>
    </div>
  );
}

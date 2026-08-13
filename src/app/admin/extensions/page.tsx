'use client';

import { SidebarPage } from '@/appwrapper/SidebarPage';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useAbilities, useExtensions } from '@/hooks/api';

/**
 * Read-only catalog of installed framework extensions and their abilities,
 * sourced from /v1/extension and /v1/ability (BLL_Extensions on the server).
 *
 * Note: this is the *server* extension registry, distinct from the *client*
 * extension manifest system in src/extensions/. The names collide; the
 * concepts are orthogonal — server extensions add backend capabilities,
 * client extensions add UI/middleware injection points.
 */
export default function ExtensionsCatalogPage(): JSX.Element {
  const extensions = useExtensions();
  const abilities = useAbilities();

  return (
    <SidebarPage title='Extension Catalog'>
      <div className='space-y-4 p-4'>
        <Card>
          <CardHeader>
            <CardTitle>Installed extensions ({extensions.data?.total ?? extensions.data?.items.length ?? 0})</CardTitle>
          </CardHeader>
          <CardContent>
            {extensions.error ? (
              <p className='text-sm text-destructive'>Failed to load: {extensions.error.message}</p>
            ) : !extensions.data?.items.length ? (
              <p className='text-sm text-muted-foreground'>No extensions reported.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Version</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead className='text-right'>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {extensions.data.items.map((ext) => (
                    <TableRow key={ext.id}>
                      <TableCell className='font-mono'>{ext.name}</TableCell>
                      <TableCell className='text-xs'>{ext.version ?? '—'}</TableCell>
                      <TableCell className='max-w-md truncate' title={ext.description ?? ''}>
                        {ext.description ?? '—'}
                      </TableCell>
                      <TableCell className='text-right'>
                        <Badge variant={ext.enabled ? 'default' : 'secondary'}>
                          {ext.enabled ? 'enabled' : 'disabled'}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Abilities ({abilities.data?.total ?? abilities.data?.items.length ?? 0})</CardTitle>
          </CardHeader>
          <CardContent>
            {abilities.error ? (
              <p className='text-sm text-destructive'>Failed to load: {abilities.error.message}</p>
            ) : !abilities.data?.items.length ? (
              <p className='text-sm text-muted-foreground'>No abilities reported.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Extension</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Friendly name</TableHead>
                    <TableHead>Description</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {abilities.data.items.map((ability) => (
                    <TableRow key={ability.id}>
                      <TableCell className='font-mono text-xs'>{ability.extension_id}</TableCell>
                      <TableCell className='font-mono'>{ability.name}</TableCell>
                      <TableCell>{ability.friendly_name ?? '—'}</TableCell>
                      <TableCell className='max-w-md truncate' title={ability.description ?? ''}>
                        {ability.description ?? '—'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </SidebarPage>
  );
}

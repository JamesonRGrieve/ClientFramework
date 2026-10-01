// SPDX-License-Identifier: AGPL-3.0-or-later
'use client';

import type { JSX } from 'react';
import { SidebarPage } from 'zephyrex/components/appwrapper/src/SidebarPage';
import { useRotationProviderInstances, useRotations } from 'zephyrex/hooks/api';
import { Card, CardContent, CardHeader, CardTitle } from 'zephyrex/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from 'zephyrex/ui/table';

export default function RotationsPage(): JSX.Element {
  const rotations = useRotations();
  const members = useRotationProviderInstances();

  return (
    <SidebarPage title='Rotations'>
      <div className='space-y-4 p-4'>
        <Card>
          <CardHeader>
            <CardTitle>Rotation rules ({rotations.data?.total ?? rotations.data?.items.length ?? 0})</CardTitle>
          </CardHeader>
          <CardContent>
            {rotations.error ? (
              <p className='text-sm text-destructive'>Failed to load: {rotations.error.message}</p>
            ) : !rotations.data?.items.length ? (
              <p className='text-sm text-muted-foreground'>No rotations defined.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Strategy</TableHead>
                    <TableHead>Sticky TTL (s)</TableHead>
                    <TableHead>Cooldown (s)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rotations.data.items.map((rotation) => (
                    <TableRow key={rotation.id}>
                      <TableCell>{rotation.name}</TableCell>
                      <TableCell className='font-mono text-xs'>{rotation.strategy}</TableCell>
                      <TableCell>{rotation.sticky_ttl_seconds ?? '—'}</TableCell>
                      <TableCell>{rotation.cooldown_seconds ?? '—'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Member instances ({members.data?.total ?? members.data?.items.length ?? 0})</CardTitle>
          </CardHeader>
          <CardContent>
            {members.error ? (
              <p className='text-sm text-destructive'>Failed to load: {members.error.message}</p>
            ) : !members.data?.items.length ? (
              <p className='text-sm text-muted-foreground'>No memberships.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Rotation</TableHead>
                    <TableHead>Provider instance</TableHead>
                    <TableHead>Weight</TableHead>
                    <TableHead>Priority</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {members.data.items.map((membership) => (
                    <TableRow key={membership.id}>
                      <TableCell className='font-mono text-xs'>{membership.rotation_id}</TableCell>
                      <TableCell className='font-mono text-xs'>{membership.provider_instance_id}</TableCell>
                      <TableCell>{membership.weight ?? '—'}</TableCell>
                      <TableCell>{membership.priority ?? '—'}</TableCell>
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

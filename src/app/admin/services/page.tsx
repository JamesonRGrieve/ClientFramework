'use client';

import { SidebarPage } from '@/appwrapper/SidebarPage';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useFailedServices, useServiceActions } from '@/hooks/api';

const stateVariant = (state: string): 'default' | 'destructive' | 'secondary' => {
  if (state === 'healthy') return 'default';
  if (state === 'degraded') return 'secondary';
  return 'destructive';
};

export default function ServicesPage(): JSX.Element {
  const services = useFailedServices();
  const { reset } = useServiceActions();

  const handleReset = async (name: string): Promise<void> => {
    await reset(name);
    await services.mutate();
  };

  return (
    <SidebarPage title='Failed Services'>
      <div className='p-4'>
        <Card>
          <CardHeader>
            <CardTitle>Supervisor state ({services.data?.length ?? 0})</CardTitle>
          </CardHeader>
          <CardContent>
            {services.error ? (
              <p className='text-sm text-destructive'>Failed to load: {services.error.message}</p>
            ) : !services.data?.length ? (
              <p className='text-sm text-muted-foreground'>No failed services.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>State</TableHead>
                    <TableHead>Last error</TableHead>
                    <TableHead>Failed at</TableHead>
                    <TableHead className='text-right'>Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {services.data.map((svc) => (
                    <TableRow key={svc.name}>
                      <TableCell className='font-mono'>{svc.name}</TableCell>
                      <TableCell>
                        <Badge variant={stateVariant(svc.state)}>{svc.state}</Badge>
                      </TableCell>
                      <TableCell className='max-w-md truncate' title={svc.last_error ?? ''}>
                        {svc.last_error ?? '—'}
                      </TableCell>
                      <TableCell className='text-xs'>{svc.failed_at ?? '—'}</TableCell>
                      <TableCell className='text-right'>
                        <Button size='sm' variant='outline' onClick={() => handleReset(svc.name)}>
                          Reset
                        </Button>
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

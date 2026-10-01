// SPDX-License-Identifier: AGPL-3.0-or-later
'use client';

import { Button } from '@jgrieve/forms/components/ui/button';
import { Label } from '@jgrieve/forms/components/ui/label';
import { type ChangeEvent, type ReactElement, useId, useState } from 'react';
import { useSWRConfig } from 'swr';
import { useClient } from 'zephyrex';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from 'zephyrex/ui/card';
import { genealogyApi, PERSON_ENDPOINT, RELATIONSHIP_ENDPOINT } from './genealogyApi';

type Outcome = { tone: 'status' | 'alert'; text: string } | null;

/** Brings a GEDCOM file (5.5 to 7.0) into the tree, and downloads the tree as GEDCOM 5.5.1. */
export function GedcomTransfer(): ReactElement {
  const fileId = useId();
  const client = useClient();
  const { mutate } = useSWRConfig();
  const [pending, setPending] = useState(false);
  const [outcome, setOutcome] = useState<Outcome>(null);

  const importFile = (event: ChangeEvent<HTMLInputElement>): void => {
    const file = event.target.files?.item(0);
    event.target.value = '';
    if (file === null || file === undefined) {
      return;
    }
    setPending(true);
    void (async (): Promise<void> => {
      try {
        const imported = await genealogyApi.importGedcom(client, await file.text());
        const people = Object.keys(imported.people).length;
        setOutcome({
          tone: 'status',
          text: `Imported ${people} ${people === 1 ? 'person' : 'people'} and ${imported.relationships} relationships from GEDCOM ${imported.version}.`,
        });
        // Every list of people and relationships is now stale.
        const endpoints = [client.url(PERSON_ENDPOINT), client.url(RELATIONSHIP_ENDPOINT)];
        await mutate((key) => typeof key === 'string' && endpoints.some((endpoint) => key.startsWith(endpoint)));
      } catch (error) {
        setOutcome({ tone: 'alert', text: error instanceof Error ? error.message : 'The file could not be imported.' });
      } finally {
        setPending(false);
      }
    })();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>GEDCOM</CardTitle>
        <CardDescription>Move a family tree between this app and other genealogy software.</CardDescription>
      </CardHeader>
      <CardContent className='grid gap-4'>
        <div className='grid gap-1'>
          <Label htmlFor={fileId}>Import a GEDCOM file</Label>
          <input
            id={fileId}
            type='file'
            accept='.ged,.gedcom,text/plain'
            disabled={pending}
            onChange={importFile}
            className='text-sm'
          />
        </div>
        {outcome !== null && (
          <p role={outcome.tone} className={`text-sm ${outcome.tone === 'alert' ? 'text-destructive' : ''}`}>
            {outcome.text}
          </p>
        )}
        <div>
          <Button asChild variant='outline'>
            <a href={genealogyApi.exportUrl(client)} download='family-tree.ged'>
              Download as GEDCOM
            </a>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

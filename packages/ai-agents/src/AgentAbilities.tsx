// SPDX-License-Identifier: AGPL-3.0-or-later
'use client';

import { Input } from '@jgrieve/forms/components/ui/input';
import { Label } from '@jgrieve/forms/components/ui/label';
import { type ReactElement, useId, useState } from 'react';
import { ConflictPanel, useClient, writeProblem } from 'zephyrex';
import {
  type Ability,
  type AgentAbility,
  grantAbility,
  useAbilities,
  useAgentAbilities,
  useAgentAbilityActions,
} from './agentsApi';

/** An ability's name as people read it. */
export const abilityName = ({ friendly_name: friendly, name }: Pick<Ability, 'friendly_name' | 'name'>): string =>
  (friendly ?? '') === '' ? name : (friendly ?? name);

/** The abilities matching `filter` (by name or description), all of them for a blank one. */
export function abilitiesMatching(abilities: readonly Ability[], filter: string): Ability[] {
  const wanted = filter.trim().toLowerCase();
  return wanted === ''
    ? [...abilities]
    : abilities.filter((ability) =>
        [ability.name, ability.friendly_name ?? '', ability.description ?? ''].some((text) =>
          text.toLowerCase().includes(wanted),
        ),
      );
}

/** One ability, and whether the agent may use it: granting it, or enabling or disabling its grant. */
function AbilityRow({
  agentId,
  ability,
  grant,
}: {
  agentId: string;
  ability: Ability;
  grant: AgentAbility | undefined;
}): ReactElement {
  const id = useId();
  const client = useClient();
  const { mutate: refreshGrants } = useAgentAbilities(agentId);
  const { update } = useAgentAbilityActions(agentId);
  const [problem, setProblem] = useState<string | null>(null);
  const allowed = grant?.enabled === true;

  const toggle = (): void => {
    setProblem(null);
    const changing =
      grant === undefined
        ? (async (): Promise<void> => {
            await grantAbility(client, agentId, ability.id);
            await refreshGrants();
          })()
        : update.save(grant, { enabled: !grant.enabled });
    void writeProblem(changing, 'The ability could not be changed.').then(setProblem);
  };

  return (
    <li className='grid gap-1 px-4 py-2 text-sm'>
      <div className='flex items-start gap-2'>
        <input id={id} type='checkbox' className='mt-1' checked={allowed} onChange={toggle} />
        <Label htmlFor={id} className='grid gap-0.5'>
          <span>{abilityName(ability)}</span>
          {(ability.description ?? '') !== '' && (
            <span className='font-normal text-muted-foreground'>{ability.description}</span>
          )}
        </Label>
      </div>
      {update.conflict !== null && (
        <ConflictPanel
          conflict={update.conflict}
          fields={[{ key: 'enabled', label: 'May use', format: ({ enabled }) => (enabled === true ? 'Yes' : 'No') }]}
          onResolve={(merged) => {
            void writeProblem(update.resolve(merged), 'The ability could not be changed.').then(setProblem);
          }}
          onDiscard={update.discard}
        />
      )}
      {problem !== null && (
        <p role='alert' className='text-sm text-destructive'>
          {problem}
        </p>
      )}
    </li>
  );
}

/** What the agent may use: an agent may use only the abilities granted to it and enabled. */
export function AgentAbilities({ agentId }: { agentId: string }): ReactElement {
  const filterId = useId();
  const { data: abilities = [], error, isLoading } = useAbilities();
  const { data: grants = [] } = useAgentAbilities(agentId);
  const [filter, setFilter] = useState('');
  const shown = abilitiesMatching(abilities, filter);
  const allowedCount = grants.filter(({ enabled }) => enabled).length;

  return (
    <div className='grid gap-3'>
      <p className='text-sm text-muted-foreground'>
        {allowedCount === 1 ? 'It may use 1 ability.' : `It may use ${String(allowedCount)} abilities.`}
      </p>
      <div className='grid gap-1'>
        <Label htmlFor={filterId}>Find an ability</Label>
        <Input id={filterId} value={filter} onChange={(event) => setFilter(event.target.value)} />
      </div>
      {error !== undefined && (
        <p role='alert' className='text-sm text-destructive'>
          The abilities could not be loaded: {error.message}
        </p>
      )}
      {error === undefined && shown.length === 0 && (
        <p className='text-sm text-muted-foreground'>{isLoading ? 'Loading…' : 'No ability matches.'}</p>
      )}
      {shown.length > 0 && (
        <ul aria-label='Abilities' className='max-h-96 divide-y overflow-auto rounded-md border'>
          {shown.map((ability) => (
            <AbilityRow
              key={ability.id}
              agentId={agentId}
              ability={ability}
              grant={grants.find(({ ability_id: id }) => id === ability.id)}
            />
          ))}
        </ul>
      )}
    </div>
  );
}

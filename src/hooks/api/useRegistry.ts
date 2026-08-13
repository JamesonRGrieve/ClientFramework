import { useMemo } from 'react';
import { getApiClient } from '@/lib/api/client';
import {
  RegistryApi,
  type Ability,
  type Extension,
  type Rotation,
  type RotationProviderInstance,
} from '@/lib/api/registry';
import type { Page } from '@/lib/api/types';
import { useApi } from './useApi';

export const useExtensions = () => {
  const registry = useMemo(() => new RegistryApi(getApiClient()), []);
  return useApi<Page<Extension>>('v1/extension', () => registry.listExtensions());
};

export const useAbilities = () => {
  const registry = useMemo(() => new RegistryApi(getApiClient()), []);
  return useApi<Page<Ability>>('v1/ability', () => registry.listAbilities());
};

export const useRotations = () => {
  const registry = useMemo(() => new RegistryApi(getApiClient()), []);
  return useApi<Page<Rotation>>('v1/rotation', () => registry.listRotations());
};

export const useRotationProviderInstances = () => {
  const registry = useMemo(() => new RegistryApi(getApiClient()), []);
  return useApi<Page<RotationProviderInstance>>(
    'v1/rotation_provider_instance',
    () => registry.listRotationProviderInstances(),
  );
};

import type { ApiClient } from './client';
import type { ApiResponse, Page, SearchRequest } from './types';

/**
 * Read/write clients for the BLL-managed registry resources shipped in the
 * base install (BLL_Providers.py, BLL_Extensions.py). Each resource follows
 * the standard CRUD + SEARCH + BATCH contract from RouterMixin.
 */

export interface Extension {
  readonly id: string;
  readonly name: string;
  readonly description?: string;
  readonly version?: string;
  readonly enabled: boolean;
}

export interface Ability {
  readonly id: string;
  readonly extension_id: string;
  readonly name: string;
  readonly friendly_name?: string;
  readonly description?: string;
}

export interface ProviderRecord {
  readonly id: string;
  readonly name: string;
  readonly type?: string;
}

export interface ProviderInstance {
  readonly id: string;
  readonly provider_id: string;
  readonly name: string;
  readonly enabled: boolean;
}

export interface Rotation {
  readonly id: string;
  readonly name: string;
  readonly strategy: string;
  readonly sticky_ttl_seconds?: number;
  readonly cooldown_seconds?: number;
}

export interface RotationProviderInstance {
  readonly id: string;
  readonly rotation_id: string;
  readonly provider_instance_id: string;
  readonly weight?: number;
  readonly priority?: number;
}

export class RegistryApi {
  constructor(private readonly client: ApiClient) {}

  listExtensions(): Promise<ApiResponse<Page<Extension>>> {
    return this.client.list<Extension>('extension');
  }

  searchExtensions(query: SearchRequest): Promise<ApiResponse<Page<Extension>>> {
    return this.client.search<Extension>('extension', query);
  }

  listAbilities(): Promise<ApiResponse<Page<Ability>>> {
    return this.client.list<Ability>('ability');
  }

  searchAbilities(query: SearchRequest): Promise<ApiResponse<Page<Ability>>> {
    return this.client.search<Ability>('ability', query);
  }

  listProviders(): Promise<ApiResponse<Page<ProviderRecord>>> {
    return this.client.list<ProviderRecord>('provider');
  }

  listProviderInstances(): Promise<ApiResponse<Page<ProviderInstance>>> {
    return this.client.list<ProviderInstance>('provider_instance');
  }

  listRotations(): Promise<ApiResponse<Page<Rotation>>> {
    return this.client.list<Rotation>('rotation');
  }

  searchRotations(query: SearchRequest): Promise<ApiResponse<Page<Rotation>>> {
    return this.client.search<Rotation>('rotation', query);
  }

  listRotationProviderInstances(): Promise<ApiResponse<Page<RotationProviderInstance>>> {
    return this.client.list<RotationProviderInstance>('rotation_provider_instance');
  }
}

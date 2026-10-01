// SPDX-License-Identifier: AGPL-3.0-or-later
import { renderHook, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { fieldDescription, type ProviderSettingSpec, settingRows, useProviderSettingCatalogue } from './providerSettings';
import type { ProviderInstanceSetting } from './useProviderInstances';
import { TestWrapper, testConfig } from '@/testing/TestWrapper';

const HTTP_OK = 200;

/** amazon_sns as the server declares it. */
const SNS: ProviderSettingSpec[] = [
  { key: 'api_key', description: 'AWS access key id', env: null, default: null, write_only: true, field: 'api_key' },
  { key: 'aws_secret_key', description: 'AWS secret', env: 'AWS_SECRET_KEY', default: null, write_only: true, field: null },
  { key: 'aws_region', description: 'Region', env: 'AWS_REGION', default: 'us-east-1', write_only: false, field: null },
  { key: 'sender_id', description: null, env: null, default: null, write_only: false, field: null },
];

const stored = (key: string, value: string | null, writeOnly = false): ProviderInstanceSetting => ({
  id: `s-${key}`,
  provider_instance_id: 'i1',
  key,
  value,
  write_only: writeOnly,
});

describe('settingRows', () => {
  it('lists every declared setting in order, without the ones on the instance itself', () => {
    const rows = settingRows(SNS, [stored('aws_region', 'eu-west-1'), stored('aws_secret_key', null, true)]);
    expect(rows.map((row) => [row.key, row.setting?.value ?? null, row.writeOnly])).toEqual([
      ['aws_secret_key', null, true],
      ['aws_region', 'eu-west-1', false],
      ['sender_id', null, false],
    ]);
    expect(rows[2]?.setting).toBeNull();
  });

  it('keeps stored settings the provider no longer declares, and their write-only mark', () => {
    const rows = settingRows(SNS, [stored('legacy_token', null, true)]);
    expect(rows.at(-1)).toEqual({
      key: 'legacy_token',
      spec: null,
      setting: stored('legacy_token', null, true),
      writeOnly: true,
    });
  });

  it('marks a declared setting write-only when its stored row is, even if declared readable', () => {
    expect(settingRows(SNS, [stored('sender_id', null, true)]).find((row) => row.key === 'sender_id')?.writeOnly).toBe(true);
  });
});

describe('fieldDescription', () => {
  it("names the instance's own columns the way the provider does", () => {
    expect(fieldDescription(SNS, 'api_key')).toBe('AWS access key id');
    expect(fieldDescription(SNS, 'model_name')).toBeNull();
  });
});

describe('useProviderSettingCatalogue', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("reads the provider's declared settings", async () => {
    const fetchMock = vi.fn<typeof fetch>(async () =>
      Promise.resolve(
        new Response(JSON.stringify({ provider_id: 'p1', provider: 'amazon_sns', settings: SNS }), { status: HTTP_OK }),
      ),
    );
    vi.stubGlobal('fetch', fetchMock);
    const { result } = renderHook(() => useProviderSettingCatalogue('p1').data, { wrapper: TestWrapper });
    await waitFor(() => {
      expect(result.current).toEqual(SNS);
    });
    expect(fetchMock).toHaveBeenCalledWith(`${testConfig.server.baseUrl}/v1/provider/p1/settings`, expect.anything());
  });

  it('asks nothing before a provider is chosen', () => {
    const fetchMock = vi.fn<typeof fetch>(async () => Promise.resolve(new Response('{}', { status: HTTP_OK })));
    vi.stubGlobal('fetch', fetchMock);
    const { result } = renderHook(() => useProviderSettingCatalogue(null).data, { wrapper: TestWrapper });
    expect(result.current).toBeUndefined();
    expect(fetchMock).not.toHaveBeenCalledWith(expect.stringContaining('/settings'), expect.anything());
  });
});

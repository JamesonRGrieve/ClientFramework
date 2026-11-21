// SPDX-License-Identifier: AGPL-3.0-or-later
import { describe, expect, it } from 'vitest';
import {
  type Attachment,
  assetContentPath,
  assetName,
  isPicture,
  MAX_ASSET_BYTES,
  newestIn,
  ROLE_PATTERN,
  uploadProblem,
} from './attachmentsModel';

const fileOf = (size: number, type: string, name = 'map.png'): File => new File([new Uint8Array(size)], name, { type });

const link = (id: string, role: string): Attachment => ({
  id,
  asset_id: `asset-${id}`,
  target_entity_type: 'location',
  target_entity_id: 'terra',
  role,
});

describe('uploadProblem', () => {
  it('takes a picture or a PDF within the size', () => {
    expect(uploadProblem(fileOf(10, 'image/png'))).toBeNull();
    expect(uploadProblem(fileOf(10, 'application/pdf', 'brief.pdf'))).toBeNull();
  });

  it('refuses what the server refuses, in its words', () => {
    expect(uploadProblem(fileOf(10, 'text/plain', 'a.txt'))).toBe('Upload a picture or a PDF');
    expect(uploadProblem(fileOf(0, 'image/png'))).toBe('The file is empty');
    expect(uploadProblem(fileOf(MAX_ASSET_BYTES + 1, 'image/png'))).toBe('A file may be at most 10 MB');
  });
});

describe('the rest of the model', () => {
  it('names a file within the length, never empty', () => {
    expect(assetName(fileOf(1, 'image/png', `  ${'x'.repeat(250)}.png `))).toHaveLength(200);
    expect(assetName(fileOf(1, 'image/png', '   '))).toBe('file');
  });

  it('reads an asset’s bytes at its content path', () => {
    expect(assetContentPath('a b')).toBe('/v1/asset/a%20b/content');
  });

  it('tells pictures from documents', () => {
    expect(isPicture('image/webp')).toBe(true);
    expect(isPicture('application/pdf')).toBe(false);
  });

  it('takes the newest attachment in a role', () => {
    expect(
      newestIn([link('1', 'primary_image'), link('2', 'gallery'), link('3', 'primary_image')], 'primary_image')?.id,
    ).toBe('3');
    expect(newestIn([link('2', 'gallery')], 'primary_image')).toBeNull();
  });

  it('allows short snake_case roles', () => {
    expect(['primary_image', 'header_image', 'document'].every((role) => ROLE_PATTERN.test(role))).toBe(true);
    expect(['Primary', '1st', 'a-b', 'x'.repeat(41)].some((role) => ROLE_PATTERN.test(role))).toBe(false);
  });
});

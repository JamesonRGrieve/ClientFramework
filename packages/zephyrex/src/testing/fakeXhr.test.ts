// SPDX-License-Identifier: AGPL-3.0-or-later
import { describe, expect, it } from 'vitest';
import { fakeXhr } from './fakeXhr';

const HTTP_CREATED = 201;

describe('fakeXhr', () => {
  it('records the request, reports its progress and answers as told', () => {
    const fake = fakeXhr(HTTP_CREATED, '{"ok":true}');
    const xhr = new fake.Xhr();
    const seen: number[] = [];
    xhr.upload.addEventListener('progress', (event) => seen.push((event as ProgressEvent).loaded));
    let answered = '';
    xhr.addEventListener('load', () => {
      answered = `${xhr.status} ${xhr.responseText}`;
    });
    xhr.open('POST', '/v1/asset/upload?name=a.png');
    xhr.setRequestHeader('Content-Type', 'image/png');
    const body = new Blob(['12345'], { type: 'image/png' });
    xhr.send(body);
    expect(fake.sent).toEqual([
      { method: 'POST', url: '/v1/asset/upload?name=a.png', headers: { 'Content-Type': 'image/png' }, body },
    ]);
    expect(seen).toEqual([5]);
    expect(answered).toBe('201 {"ok":true}');
  });
});

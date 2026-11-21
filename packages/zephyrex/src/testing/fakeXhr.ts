// SPDX-License-Identifier: AGPL-3.0-or-later
// An XMLHttpRequest stand-in for upload tests: install it with `vi.stubGlobal('XMLHttpRequest', fake.Xhr)`.

/** One request the fake was sent. */
export interface SentRequest {
  method: string;
  url: string;
  headers: Record<string, string>;
  body: XMLHttpRequestBodyInit | Document | null | undefined;
}

/** What the fake does of XMLHttpRequest: enough for an upload. */
export interface FakeXhrRequest extends EventTarget {
  readonly upload: EventTarget;
  status: number;
  statusText: string;
  responseText: string;
  open: (method: string, url: string) => void;
  setRequestHeader: (header: string, value: string) => void;
  send: (body?: XMLHttpRequestBodyInit | Document | null) => void;
}

export interface FakeXhr {
  /** The class to put in place of `XMLHttpRequest`. */
  Xhr: new () => FakeXhrRequest;
  /** What it was sent, in order. */
  sent: SentRequest[];
}

/** Answers every request with `status` and `body` after one progress event of the body's size, recording what was sent. */
export function fakeXhr(status: number, body: string): FakeXhr {
  const sent: SentRequest[] = [];
  class Xhr extends EventTarget implements FakeXhrRequest {
    readonly upload = new EventTarget();
    status = 0;
    statusText = '';
    responseText = '';
    private request: SentRequest = { method: '', url: '', headers: {}, body: null };
    open(method: string, url: string): void {
      this.request = { method, url, headers: {}, body: null };
    }
    setRequestHeader(header: string, value: string): void {
      this.request.headers[header] = value;
    }
    send(sentBody?: XMLHttpRequestBodyInit | Document | null): void {
      this.request.body = sentBody;
      sent.push(this.request);
      const size = sentBody instanceof Blob ? sentBody.size : 0;
      this.upload.dispatchEvent(new ProgressEvent('progress', { lengthComputable: true, loaded: size, total: size }));
      this.status = status;
      this.responseText = body;
      this.dispatchEvent(new Event('load'));
    }
  }
  return { Xhr, sent };
}

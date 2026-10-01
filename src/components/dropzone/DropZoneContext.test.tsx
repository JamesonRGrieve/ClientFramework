// SPDX-License-Identifier: AGPL-3.0-or-later
import { act, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import * as mod from './DropZoneContext';
import { DropZoneProvider, useDropZone } from './DropZoneContext';

const PNG = 'image/png';

function DragState(): React.JSX.Element {
  const { isDragActive, fileType, fileCount } = useDropZone();
  return <p>{`${isDragActive ? 'dragging' : 'idle'} ${fileType ?? 'none'} ${fileCount}`}</p>;
}

/** A drag event on the page body carrying `files`, as the browser sends one. */
function dragEvent(type: string, files: File[]): Event {
  const event = new Event(type, { bubbles: true, cancelable: true });
  const items = files.map((file) => ({ kind: 'file', type: file.type }));
  Object.defineProperty(event, 'dataTransfer', { value: { files, items, clearData: vi.fn() } });
  return event;
}

const renderProvider = (onUpload: (files: File[]) => void): void => {
  render(
    <DropZoneProvider onUpload={onUpload}>
      <DragState />
    </DropZoneProvider>,
  );
};

describe('DropZoneContext', () => {
  it('module exports', () => {
    expect(mod).toBeDefined();
  });

  it('follows a drag over the page and uploads what is dropped', () => {
    const onUpload = vi.fn();
    renderProvider(onUpload);
    const file = new File(['x'], 'shot.png', { type: PNG });

    act(() => {
      document.body.dispatchEvent(dragEvent('dragenter', [file]));
    });
    expect(screen.getByText(`dragging ${PNG} 1`)).toBeInTheDocument();

    act(() => {
      document.body.dispatchEvent(dragEvent('drop', [file]));
    });
    expect(onUpload).toHaveBeenCalledWith([file]);
    expect(screen.getByText(`idle ${PNG} 1`)).toBeInTheDocument();
  });

  it('refuses a blocked file type', () => {
    const onUpload = vi.fn();
    renderProvider(onUpload);
    act(() => {
      document.body.dispatchEvent(dragEvent('drop', [new File(['x'], 'notes.txt', { type: 'text/plain' })]));
    });
    expect(onUpload).not.toHaveBeenCalled();
  });
});

// SPDX-License-Identifier: AGPL-3.0-or-later
import { act, fireEvent, render, renderHook, screen, waitFor } from '@testing-library/react';
import { type ReactNode, useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { AppDrawerContent, AppDrawerProvider, useAppDrawer } from './AppDrawer';

const TITLE = 'Canon notes';

function Opener(): ReactNode {
  const drawer = useAppDrawer();
  return (
    <>
      <button type='button' onClick={() => drawer.open(<p>Three findings</p>, TITLE)}>
        Details
      </button>
      <button type='button' onClick={drawer.close}>
        Done
      </button>
      <p>{drawer.isOpen ? 'open' : 'shut'}</p>
    </>
  );
}

describe('AppDrawer', () => {
  it('pulls up with the content under its title, and goes back down', async () => {
    render(
      <AppDrawerProvider>
        <Opener />
      </AppDrawerProvider>,
    );
    expect(screen.queryByRole('dialog')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Details' }));
    const drawer = await screen.findByRole('dialog', { name: TITLE });
    expect(drawer).toHaveTextContent('Three findings');
    expect(screen.getByText('open')).toBeInTheDocument();
    act(() => {
      screen.getByRole('button', { name: 'Done', hidden: true }).click();
    });
    await waitFor(() => {
      expect(screen.getByText('shut', { ignore: '[role=dialog] *' })).toBeInTheDocument();
    });
  });

  it('shows what a page declares while it says open, and reports a close it did not ask for', async () => {
    const onOpenChange = vi.fn();
    function Page(): ReactNode {
      const [open, setOpen] = useState(true);
      return (
        <>
          <AppDrawerContent
            title={TITLE}
            open={open}
            onOpenChange={(next) => {
              onOpenChange(next);
              setOpen(next);
            }}
          >
            <p>Declared body</p>
          </AppDrawerContent>
          <CloseFromInside />
        </>
      );
    }
    function CloseFromInside(): ReactNode {
      const { close } = useAppDrawer();
      return (
        <button type='button' onClick={close}>
          Swipe away
        </button>
      );
    }
    render(
      <AppDrawerProvider>
        <Page />
      </AppDrawerProvider>,
    );
    expect(await screen.findByRole('dialog', { name: TITLE })).toHaveTextContent('Declared body');
    act(() => {
      screen.getByRole('button', { name: 'Swipe away', hidden: true }).click();
    });
    await waitFor(() => {
      expect(onOpenChange).toHaveBeenCalledWith(false);
    });
  });

  it('is only available inside its provider', () => {
    expect(() => renderHook(() => useAppDrawer())).toThrow('useAppDrawer must be used within an AppDrawerProvider');
  });
});

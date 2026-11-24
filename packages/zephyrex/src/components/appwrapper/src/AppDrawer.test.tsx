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

  it('holds one history entry while up: a second open keeps it, a close pops it once', async () => {
    const push = vi.spyOn(window.history, 'pushState');
    const back = vi.spyOn(window.history, 'back');
    render(
      <AppDrawerProvider>
        <Opener />
      </AppDrawerProvider>,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Details' }));
    await screen.findByRole('dialog', { name: TITLE });
    act(() => {
      screen.getByRole('button', { name: 'Details', hidden: true }).click();
    });
    const pushes = push.mock.calls.length;
    const marked = JSON.stringify(window.history.state);
    act(() => {
      screen.getByRole('button', { name: 'Done', hidden: true }).click();
    });
    act(() => {
      screen.getByRole('button', { name: 'Done', hidden: true }).click();
    });
    const backs = back.mock.calls.length;
    push.mockRestore();
    back.mockRestore();
    // The back the close asked for lands asynchronously; let it, so the next test starts on the page.
    await waitFor(() => {
      expect(JSON.stringify(window.history.state)).not.toContain('__zephyrexAppDrawer');
    });
    expect(pushes).toBe(1);
    expect(marked).toBe('{"__zephyrexAppDrawer":true}');
    expect(backs).toBe(1);
  });

  it('closes on back and stays on the page', async () => {
    render(
      <AppDrawerProvider>
        <Opener />
      </AppDrawerProvider>,
    );
    const page = window.location.href;
    fireEvent.click(screen.getByRole('button', { name: 'Details' }));
    await screen.findByRole('dialog', { name: TITLE });
    act(() => {
      window.history.back();
    });
    await waitFor(() => {
      expect(screen.getByText('shut', { ignore: '[role=dialog] *' })).toBeInTheDocument();
    });
    expect(window.location.href).toBe(page);
    expect(window.history.state).not.toMatchObject({ __zephyrexAppDrawer: true });
  });

  it('is only available inside its provider', () => {
    expect(() => renderHook(() => useAppDrawer())).toThrow('useAppDrawer must be used within an AppDrawerProvider');
  });
});

'use client';
// SPDX-License-Identifier: AGPL-3.0-or-later

// Inspired by react-hot-toast library
import * as React from 'react';

import { ToastAction, type ToastActionElement, type ToastProps } from '@/components/ui/toast';

const TOAST_LIMIT = 1;
const TOAST_REMOVE_DELAY = 1000000;

type ToasterToast = ToastProps & {
  id: string;
  title?: React.ReactNode;
  description?: React.ReactNode;
  action?: ToastActionElement;
};

type ActionType = {
  ADD_TOAST: 'ADD_TOAST';
  UPDATE_TOAST: 'UPDATE_TOAST';
  DISMISS_TOAST: 'DISMISS_TOAST';
  REMOVE_TOAST: 'REMOVE_TOAST';
};

let count = 0;

function genId(): string {
  count = (count + 1) % Number.MAX_SAFE_INTEGER;
  return count.toString();
}

type Action =
  | {
      type: ActionType['ADD_TOAST'];
      toast: ToasterToast;
    }
  | {
      type: ActionType['UPDATE_TOAST'];
      toast: Partial<ToasterToast>;
    }
  | {
      type: ActionType['DISMISS_TOAST'];
      toastId?: ToasterToast['id'] | undefined;
    }
  | {
      type: ActionType['REMOVE_TOAST'];
      toastId?: ToasterToast['id'] | undefined;
    };

interface State {
  toasts: ToasterToast[];
}

const toastTimeouts = new Map<string, ReturnType<typeof setTimeout>>();

const addToRemoveQueue = (toastId: string): void => {
  if (toastTimeouts.has(toastId)) {
    return;
  }

  const timeout = setTimeout(() => {
    toastTimeouts.delete(toastId);
    dispatch({
      type: 'REMOVE_TOAST',
      toastId: toastId,
    });
  }, TOAST_REMOVE_DELAY);

  toastTimeouts.set(toastId, timeout);
};

export const reducer = (state: State, action: Action): State => {
  switch (action.type) {
    case 'ADD_TOAST':
      return {
        ...state,
        toasts: [action.toast, ...state.toasts].slice(0, TOAST_LIMIT),
      };

    case 'UPDATE_TOAST':
      return {
        ...state,
        toasts: state.toasts.map((t) => (t.id === action.toast.id ? { ...t, ...action.toast } : t)),
      };

    case 'DISMISS_TOAST': {
      const { toastId } = action;

      // ! Side effects ! - This could be extracted into a dismissToast() action,
      // but I'll keep it here for simplicity
      if (toastId !== undefined) {
        addToRemoveQueue(toastId);
      } else {
        state.toasts.forEach((toastItem) => {
          addToRemoveQueue(toastItem.id);
        });
      }

      return {
        ...state,
        toasts: state.toasts.map((t) =>
          t.id === toastId || toastId === undefined
            ? {
                ...t,
                open: false,
              }
            : t,
        ),
      };
    }
    case 'REMOVE_TOAST':
      if (action.toastId === undefined) {
        return {
          ...state,
          toasts: [],
        };
      }
      return {
        ...state,
        toasts: state.toasts.filter((t) => t.id !== action.toastId),
      };
  }
};

const listeners: Array<(state: State) => void> = [];

let memoryState: State = { toasts: [] };

function dispatch(action: Action): void {
  memoryState = reducer(memoryState, action);
  listeners.forEach((listener) => {
    listener(memoryState);
  });
}

type Toast = Omit<ToasterToast, 'id'>;

type ToastHandle = {
  id: string;
  dismiss: () => void;
  update: (props: ToasterToast) => void;
};

function toast({ ...props }: Toast): ToastHandle {
  const id = genId();

  const update = (updateProps: ToasterToast): void =>
    dispatch({
      type: 'UPDATE_TOAST',
      toast: { ...updateProps, id },
    });
  const dismiss = (): void => dispatch({ type: 'DISMISS_TOAST', toastId: id });

  dispatch({
    type: 'ADD_TOAST',
    toast: {
      ...props,
      id,
      open: true,
      onOpenChange: (open) => {
        if (!open) {
          dismiss();
        }
      },
    },
  });

  return {
    id: id,
    dismiss,
    update,
  };
}

function useToast(): State & { toast: typeof toast; dismiss: (toastId?: string) => void } {
  const [state, setState] = React.useState<State>(memoryState);

  React.useEffect(() => {
    listeners.push(setState);
    return (): void => {
      const index = listeners.indexOf(setState);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    };
  }, []);

  return {
    ...state,
    toast,
    dismiss: (toastId?: string) => dispatch({ type: 'DISMISS_TOAST', toastId }),
  };
}

/** How long a confirmation stays up, in milliseconds: long enough to read, short enough not to linger. */
const NOTICE_MS = 2500;

/** A short confirmation that something was done ("Gift added"), gone on its own after a moment. */
function notify(title: string, description?: string): ToastHandle {
  return toast({ title, ...(description === undefined ? {} : { description }), duration: NOTICE_MS });
}

/** How long a deletion can still be taken back, in milliseconds. */
const UNDO_MS = 6000;

/**
 * Holds a destructive action back while a notice offers to take it back ("Peonies deleted · Undo").
 * `act` runs once the notice's time is up unless Undo is pressed first, which calls `onUndo` instead
 * and `act` never runs. The caller hides the item meanwhile, so the page changes at once.
 */
function deferWithUndo(title: string, act: () => void, onUndo: () => void): ToastHandle {
  let settled = false;
  const timer = setTimeout(() => {
    if (!settled) {
      settled = true;
      act();
    }
  }, UNDO_MS);
  const undo = (): void => {
    if (!settled) {
      settled = true;
      clearTimeout(timer);
      onUndo();
    }
  };
  return toast({
    title,
    duration: UNDO_MS,
    action: React.createElement(ToastAction, { altText: `Undo: ${title}`, onClick: undo }, 'Undo'),
  });
}

/**
 * Removes every toast at once, and forgets their removal timers. The store is module-level, so a
 * test suite calls this between tests (`zephyrex/testing/setup` does), or one test's notice is
 * still on screen in the next.
 */
function clearToasts(): void {
  for (const timeout of toastTimeouts.values()) {
    clearTimeout(timeout);
  }
  toastTimeouts.clear();
  dispatch({ type: 'REMOVE_TOAST', toastId: undefined });
}

export { clearToasts, deferWithUndo, notify, UNDO_MS, useToast, toast };

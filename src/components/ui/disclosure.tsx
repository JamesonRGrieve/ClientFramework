'use client';
// SPDX-License-Identifier: AGPL-3.0-or-later
import { AnimatePresence, motion, MotionConfig, type Transition, type Variant, type Variants } from 'motion/react';
import * as React from 'react';
import { createContext, useContext, useEffect, useId, useState } from 'react';
import { cn } from '@/lib/utils';

type DisclosureContextType = {
  open: boolean;
  toggle: () => void;
  /** The content's id, which the trigger names as the region it controls. */
  contentId: string;
  variants?: { expanded: Variant; collapsed: Variant } | undefined;
};

const DisclosureContext = createContext<DisclosureContextType | undefined>(undefined);

type DisclosureProviderProps = {
  children: React.ReactNode;
  open: boolean;
  onOpenChange?: ((open: boolean) => void) | undefined;
  variants?: { expanded: Variant; collapsed: Variant } | undefined;
};

function DisclosureProvider({ children, open: openProp, onOpenChange, variants }: DisclosureProviderProps) {
  const [internalOpenValue, setInternalOpenValue] = useState<boolean>(openProp);
  const contentId = useId();

  useEffect(() => {
    setInternalOpenValue(openProp);
  }, [openProp]);

  const toggle = () => {
    const newOpen = !internalOpenValue;
    setInternalOpenValue(newOpen);
    if (onOpenChange) {
      onOpenChange(newOpen);
    }
  };

  return (
    <DisclosureContext.Provider
      value={{
        open: internalOpenValue,
        toggle,
        contentId,
        variants,
      }}
    >
      {children}
    </DisclosureContext.Provider>
  );
}

function useDisclosure() {
  const context = useContext(DisclosureContext);
  if (!context) {
    throw new Error('useDisclosure must be used within a DisclosureProvider');
  }
  return context;
}

/** A trigger and its content. */
const DISCLOSURE_PARTS = 2;

type DisclosureProps = {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children: React.ReactNode;
  className?: string;
  variants?: { expanded: Variant; collapsed: Variant };
  transition?: Transition;
};

export function Disclosure({
  open: openProp = false,
  onOpenChange,
  children,
  className,
  transition,
  variants,
}: DisclosureProps) {
  const parts = React.Children.toArray(children);
  if (parts.length !== DISCLOSURE_PARTS) {
    throw new Error('Disclosure takes exactly two children: a DisclosureTrigger, then a DisclosureContent.');
  }
  return (
    <MotionConfig {...(transition !== undefined ? { transition } : {})}>
      <div className={className}>
        <DisclosureProvider open={openProp} onOpenChange={onOpenChange} variants={variants}>
          {parts}
        </DisclosureProvider>
      </div>
    </MotionConfig>
  );
}

export function DisclosureTrigger({ children, className }: { children: React.ReactNode; className?: string }) {
  const { toggle, open, contentId } = useDisclosure();

  return (
    <>
      {React.Children.map(children, (child) => {
        if (!React.isValidElement<React.HTMLAttributes<HTMLElement>>(child)) {
          return child;
        }
        const { onClick, onKeyDown } = child.props;
        // The child's own props come first, so they cannot switch off the toggle or its ARIA;
        // its own handlers still run.
        return React.cloneElement(child, {
          ...child.props,
          role: 'button',
          'aria-expanded': open,
          'aria-controls': contentId,
          tabIndex: 0,
          onClick: (event: React.MouseEvent<HTMLElement>) => {
            onClick?.(event);
            toggle();
          },
          onKeyDown: (event: React.KeyboardEvent<HTMLElement>) => {
            onKeyDown?.(event);
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault();
              toggle();
            }
          },
          className: cn(className, child.props.className),
        });
      })}
    </>
  );
}

export function DisclosureContent({ children, className }: { children: React.ReactNode; className?: string }) {
  const { open, variants, contentId } = useDisclosure();

  const BASE_VARIANTS: Variants = {
    expanded: {
      height: 'auto',
      opacity: 1,
    },
    collapsed: {
      height: 0,
      opacity: 0,
    },
  };

  const combinedVariants = {
    expanded: { ...BASE_VARIANTS['expanded'], ...variants?.expanded },
    collapsed: { ...BASE_VARIANTS['collapsed'], ...variants?.collapsed },
  };

  return (
    <div className={cn('overflow-hidden', className)}>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div id={contentId} initial='collapsed' animate='expanded' exit='collapsed' variants={combinedVariants}>
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

const DisclosureParts = {
  Disclosure,
  DisclosureProvider,
  DisclosureTrigger,
  DisclosureContent,
};

export default DisclosureParts;

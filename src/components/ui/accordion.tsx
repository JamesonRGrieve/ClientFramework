// SPDX-License-Identifier: AGPL-3.0-or-later
import React, { useState, createContext, useContext, type ReactNode, useRef, useEffect, useId } from 'react';
import { LuChevronDown as ExpandMore } from 'react-icons/lu';

type AccordionContextType = {
  isOpen: (value: string) => boolean;
  toggleOpen: (value: string) => void;
  /** The trigger and panel ids for an item, which name each other. */
  idsFor: (value: string) => { triggerId: string; contentId: string };
};

const AccordionContext = createContext<AccordionContextType | undefined>(undefined);

type AccordionProps = {
  children: ReactNode;
  defaultValue?: string;
  /** `single` keeps at most one item open; `multiple` lets each open independently. */
  type?: 'single' | 'multiple';
};

const WHITESPACE = /\s+/g;

export const Accordion = ({ children, defaultValue, type = 'single' }: AccordionProps) => {
  const [openValues, setOpenValues] = useState<ReadonlySet<string>>(
    () => new Set(defaultValue === undefined ? [] : [defaultValue]),
  );
  const baseId = useId();

  const toggleOpen = (value: string) => {
    setOpenValues((current) => {
      if (current.has(value)) {
        const next = new Set(current);
        next.delete(value);
        return next;
      }
      return type === 'single' ? new Set([value]) : new Set([...current, value]);
    });
  };

  const idsFor = (value: string) => {
    const key = `${baseId}-${value.replace(WHITESPACE, '-')}`;
    return { triggerId: `${key}-trigger`, contentId: `${key}-content` };
  };

  return (
    <AccordionContext.Provider value={{ isOpen: (value) => openValues.has(value), toggleOpen, idsFor }}>
      <div className='w-full'>{children}</div>
    </AccordionContext.Provider>
  );
};

type AccordionItemProps = {
  value: string;
  children: ReactNode;
  className?: string;
};

export const AccordionItem = ({ value, children, className = '' }: AccordionItemProps) => {
  return (
    <div className={`border-b border-border ${className}`}>
      {React.Children.map(children, (child) =>
        React.isValidElement<{ parentValue?: string }>(child) ? React.cloneElement(child, { parentValue: value }) : child,
      )}
    </div>
  );
};

type AccordionTriggerProps = {
  children: ReactNode;
  className?: string;
  parentValue?: string;
};

export const AccordionTrigger = ({ children, className = '', parentValue = '' }: AccordionTriggerProps) => {
  const context = useContext(AccordionContext);
  const trigger = useRef<HTMLButtonElement>(null);
  if (!context) {
    throw new Error('AccordionTrigger must be used within an Accordion');
  }

  const { isOpen: isItemOpen, toggleOpen, idsFor } = context;
  const isOpen = isItemOpen(parentValue);
  const { triggerId, contentId } = idsFor(parentValue);
  useEffect(() => {
    trigger.current?.scrollIntoView({ behavior: isOpen ? 'smooth' : 'instant' });
  }, [isOpen]);
  const handleToggle = (): void => {
    if (parentValue) {
      toggleOpen(parentValue);
    }
  };
  return (
    <button
      ref={trigger}
      id={triggerId}
      type='button'
      aria-expanded={isOpen}
      aria-controls={contentId}
      className={className || `flex items-center justify-between w-full cursor-pointer`}
      onClick={handleToggle}
    >
      {children}
      <ExpandMore aria-hidden className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
    </button>
  );
};

type AccordionContentProps = {
  children: ReactNode;
  className?: string;
  parentValue?: string;
};

export const AccordionContent = ({ children, className = '', parentValue = '' }: AccordionContentProps) => {
  const context = useContext(AccordionContext);

  if (!context) {
    throw new Error('AccordionContent must be used within an Accordion');
  }

  const { triggerId, contentId } = context.idsFor(parentValue);

  return context.isOpen(parentValue) ? (
    <div
      id={contentId}
      role='region'
      aria-labelledby={triggerId}
      className={`overflow-hidden transition-all duration-300 ${className}`}
    >
      {children}
    </div>
  ) : null;
};

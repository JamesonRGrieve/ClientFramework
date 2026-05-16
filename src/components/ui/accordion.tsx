import React, { useState, createContext, useContext, type ReactNode, useRef, useEffect } from 'react';
import { LuChevronDown as ExpandMore } from 'react-icons/lu';

type AccordionContextType = {
  openValue: string | null;
  toggleOpen: (value: string) => void;
};

const AccordionContext = createContext<AccordionContextType | undefined>(undefined);

type AccordionProps = {
  children: ReactNode;
  defaultValue?: string;
  type?: 'single' | 'multiple';
};

export const Accordion = ({ children, defaultValue = null, type = 'single' }: AccordionProps) => {
  const [openValue, setOpenValue] = useState<string | null>(defaultValue);

  const toggleOpen = (value: string) => {
    setOpenValue((current) => (type === 'single' ? (current === value ? null : value) : current === value ? null : value));
  };

  return (
    <AccordionContext.Provider value={{ openValue, toggleOpen }}>
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
      {React.Children.map(children, async (child) =>
        React.isValidElement(child) ? React.cloneElement(child as React.ReactElement, { parentValue: value }) : child,
      )}
    </div>
  );
};

type AccordionTriggerProps = {
  children: ReactNode;
  className?: string;
  parentValue?: string;
};

export const AccordionTrigger = ({ children, className = '', parentValue }: AccordionTriggerProps) => {
  const context = useContext(AccordionContext);
  const trigger = useRef<HTMLButtonElement>(null);
  if (!context) {
    throw new Error('AccordionTrigger must be used within an Accordion');
  }

  const { openValue, toggleOpen } = context;
  const isOpen = openValue === parentValue;
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
      type='button'
      className={className || `flex items-center justify-between w-full cursor-pointer`}
      onClick={handleToggle}
    >
      {children}
      <ExpandMore className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
    </button>
  );
};

type AccordionContentProps = {
  children: ReactNode;
  className?: string;
  parentValue?: string;
};

export const AccordionContent = ({ children, className = '', parentValue }: AccordionContentProps) => {
  const context = useContext(AccordionContext);

  if (!context) {
    throw new Error('AccordionContent must be used within an Accordion');
  }

  const { openValue } = context;
  const isOpen = openValue === parentValue;

  return isOpen ? <div className={`overflow-hidden transition-all duration-300 ${className}`}>{children}</div> : null;
};

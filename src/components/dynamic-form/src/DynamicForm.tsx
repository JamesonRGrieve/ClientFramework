import timezones from 'timezones-list';

import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import log from '@/next-log/log';
import { FormEvent, ReactNode, useCallback, useEffect, useState } from 'react';
import Field from './Field';
import TextField from './TextField';
import clsx from 'clsx';

export function toTitleCase(str: string) {
  // Replace underscores, or capital letters (in the middle of the string) with a space and the same character
  str = str.replace(/(_)|((?<=\w)[A-Z])/g, ' $&');

  // Remove underscore if exists
  str = str.replace(/_/g, '');

  // Convert to title case
  str = str.replace(/\w\S*/g, (txt: string) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase());

  str = str.trim();

  return str;
}
const typeDefaults = {
  text: '',
  password: '',
  number: 0,
  boolean: false,
};
export type DynamicFormFieldValueTypes = string | number | boolean;
export type DynamicFormProps = {
  fields?: {
    [key: string]: {
      type: 'text' | 'number' | 'password' | 'boolean';
      display?: string;
      value?: DynamicFormFieldValueTypes;
      validation?: (value: DynamicFormFieldValueTypes) => boolean;
      colSpan?: 1 | 2 | 3 | 4 | 5 | 6;
      colSpanSm?: 1 | 2 | 3 | 4 | 5 | 6;
      colSpanMd?: 1 | 2 | 3 | 4 | 5 | 6;
      colSpanLg?: 1 | 2 | 3 | 4 | 5 | 6;
      colSpanXl?: 1 | 2 | 3 | 4 | 5 | 6;
      rowStartMd?: 1 | 2 | 3;
      rowStartXl?: 1 | 2 | 3;
      colStartMd?: 1 | 2;
      colStartXl?: 1 | 2 | 3;
    };
  };
  submitButtonText?: string;
  excludeFields?: string[];
  readOnlyFields?: string[];
  toUpdate?: any;
  additionalButtons?: ReactNode[];
  extraComponents?: {
    key: string;
    element: ReactNode;
    colSpan?: number;
    colStartMd?: number;
    colStartXl?: number;
    rowStartMd?: number;
    rowStartXl?: number;
  }[];
  onConfirm: (data: { [key: string]: DynamicFormFieldValueTypes }) => void;
};

export default function DynamicForm({
  fields,
  toUpdate,
  excludeFields = [],
  readOnlyFields = [],
  onConfirm,
  submitButtonText = 'Submit',
  additionalButtons = [],
  extraComponents = [],
}: DynamicFormProps) {
  if (fields === undefined && toUpdate === undefined) {
    throw new Error('Either fields or toUpdate must be provided to DynamicForm.');
  }
  const [editedState, setEditedState] = useState<{ [key: string]: { value: DynamicFormFieldValueTypes; error: string } }>(
    {},
  );
  const handleChange = useCallback((event: any, id?: string) => {
    setEditedState((prevState) => ({
      ...prevState,
      [id]: { ...prevState[id], value: event.target.value },
    }));
  }, []);

  const handleSubmit = useCallback(
    (e: FormEvent) => {
      Object.keys(fields ?? toUpdate).forEach((key: string) => {
        try {
          if (fields) {
            if (fields[key].validation && fields[key].validation(editedState[key].value)) {
              setEditedState((prevState) => ({ ...prevState, [key]: { ...prevState[key], error: '' } }));
            } else {
              setEditedState((prevState) => ({
                ...prevState,
                [key]: { ...prevState[key], error: 'Invalid value, please double check your input.' },
              }));
            }
          } else {
            if (typeof toUpdate[key as keyof typeof toUpdate] === 'number' && isNaN(Number(editedState[key].value))) {
              setEditedState((prevState) => ({
                ...prevState,
                [key]: { ...prevState[key], error: 'Expected a number for this input.' },
              }));
            } else {
              setEditedState((prevState) => ({ ...prevState, [key]: { ...prevState[key], error: '' } }));
            }
          }
        } catch (error) {
          setEditedState((prevState) => ({ ...prevState, [key]: { ...prevState[key], error: error.message } }));
        }
        e.preventDefault();
      });
      if (Object.values(editedState).every((field) => field.error === '')) {
        const formattedForReturn = Object.fromEntries(Object.entries(editedState).map(([key, value]) => [key, value.value]));
        onConfirm(formattedForReturn);
      }
    },
    [editedState, fields, onConfirm],
  );

  // Initial state setup in useEffect to handle incoming props correctly
  useEffect(() => {
    const initialState: { [key: string]: { value: DynamicFormFieldValueTypes; error: string } } = {};
    Object.keys(fields ?? toUpdate).forEach((key) => {
      if (!excludeFields.includes(key) && !readOnlyFields.includes(key)) {
        initialState[key] = {
          value: fields
            ? (fields[key].value ?? typeDefaults[fields[key].type as keyof typeof typeDefaults])
            : toUpdate[key as keyof typeof toUpdate],
          error: '',
        };
      }
    });
    setEditedState(initialState);
    log(['Setting initial dynamic form state', initialState], { client: 2 });
  }, [fields, toUpdate]); // Depend on `fields` to re-initialize state when `fields` prop changes

  return (
    <form className='grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 grid-rows-3 gap-4'>
      {Object.entries(editedState).map(
        ([field_name, field_object]) =>
          field_object !== undefined && (
            <div
              key={field_name.toLowerCase().replaceAll(' ', '-')}
              className={clsx(
                // BASE COL SPAN
                fields?.[field_name]?.colSpan === 1 && 'col-span-1',
                fields?.[field_name]?.colSpan === 2 && 'col-span-2',
                fields?.[field_name]?.colSpan === 3 && 'col-span-3',

                // MD COL SPAN
                fields?.[field_name]?.colSpanMd === 1 && 'md:col-span-1',
                fields?.[field_name]?.colSpanMd === 2 && 'md:col-span-2',
                fields?.[field_name]?.colSpanMd === 3 && 'md:col-span-3',

                // XL COL SPAN
                fields?.[field_name]?.colSpanXl === 1 && 'xl:col-span-1',
                fields?.[field_name]?.colSpanXl === 2 && 'xl:col-span-2',
                fields?.[field_name]?.colSpanXl === 3 && 'xl:col-span-3',

                // MD COL START
                fields?.[field_name]?.colStartMd === 1 && 'md:col-start-1',
                fields?.[field_name]?.colStartMd === 2 && 'md:col-start-2',

                // XL COL START
                fields?.[field_name]?.colStartXl === 1 && 'xl:col-start-1',
                fields?.[field_name]?.colStartXl === 2 && 'xl:col-start-2',
                fields?.[field_name]?.colStartXl === 3 && 'xl:col-start-3',

                // MD ROW START
                fields?.[field_name]?.rowStartMd === 1 && 'md:row-start-1',
                fields?.[field_name]?.rowStartMd === 2 && 'md:row-start-2',
                fields?.[field_name]?.rowStartMd === 3 && 'md:row-start-3',

                // XL ROW START
                fields?.[field_name]?.rowStartXl === 1 && 'xl:row-start-1',
                fields?.[field_name]?.rowStartXl === 2 && 'xl:row-start-2',
                fields?.[field_name]?.rowStartXl === 3 && 'xl:row-start-3',
              )}
            >
              {['tz', 'timezone'].includes(field_name) ? (
                <Field
                  nameID={field_name.toLowerCase().replaceAll(' ', '-')}
                  label={fields ? (fields[field_name].display ?? toTitleCase(field_name)) : toTitleCase(field_name)}
                  value={field_object?.value?.toString() || ''}
                  onChange={handleChange}
                  messages={field_object.error ? [{ level: 'error', value: field_object.error }] : []}
                  type='select'
                  items={timezones
                    .sort((a, b) => {
                      if (a.utc !== b.utc) {
                        return a.utc > b.utc ? 1 : -1;
                      } else {
                        return a.tzCode > b.tzCode ? 1 : -1;
                      }
                    })
                    .map((tz) => ({ value: tz.tzCode, label: tz.label }))}
                />
              ) : (
                <Field
                  nameID={field_name.toLowerCase().replaceAll(' ', '-')}
                  label={fields ? (fields[field_name].display ?? toTitleCase(field_name)) : toTitleCase(field_name)}
                  value={field_object?.value?.toString() || ''}
                  onChange={handleChange}
                  messages={field_object.error ? [{ level: 'error', value: field_object.error }] : []}
                  type={
                    fields && fields[field_name].type === 'boolean'
                      ? 'checkbox'
                      : (fields && fields[field_name].type === 'password') || field_name.toLowerCase().includes('password')
                        ? 'password'
                        : 'text'
                  }
                />
              )}
            </div>
          ),
      )}
      {extraComponents?.map((comp) => (
        <div
          key={comp.key}
          className={clsx(
            // grid placement
            comp.colSpan === 1 && 'col-span-1',
            comp.colSpan === 2 && 'col-span-2',
            comp.colSpan === 3 && 'col-span-3',

            comp.colStartMd === 1 && 'md:col-start-1',
            comp.colStartMd === 2 && 'md:col-start-2',

            comp.colStartXl === 1 && 'xl:col-start-1',
            comp.colStartXl === 2 && 'xl:col-start-2',
            comp.colStartXl === 3 && 'xl:col-start-3',

            comp.rowStartMd === 1 && 'md:row-start-1',
            comp.rowStartMd === 2 && 'md:row-start-2',
            comp.rowStartMd === 3 && 'md:row-start-3',

            comp.rowStartXl === 1 && 'xl:row-start-1',
            comp.rowStartXl === 2 && 'xl:row-start-2',
            comp.rowStartXl === 3 && 'xl:row-start-3',

            'flex items-center justify-center translate-y-2 scale-125 pb-6 md:pb-0',
          )}
        >
          {comp.element}
        </div>
      ))}

      <div className='col-span-full flex justify-center'>
        <div className='w-full max-w-[480px] md:max-w-[420px] xl:max-w-[360px]'>
          <Button className='w-full' onClick={handleSubmit}>
            {submitButtonText}
          </Button>
        </div>
      </div>
      {readOnlyFields.length > 0 && <Separator className='col-span-full' />}
      {readOnlyFields.map((fieldName) => {
        return (
          toUpdate?.[fieldName as keyof typeof toUpdate] !== undefined && (
            <div className='col-span-full' key={fieldName.toLowerCase().replaceAll(' ', '-')}>
              <div className='w-full my-4'>
                <TextField
                  // fullWidth
                  onChange={() => null}
                  id={fieldName.toLowerCase().replaceAll(' ', '-')}
                  name={fieldName.toLowerCase().replaceAll(' ', '-')}
                  label={fields ? (fields[fieldName].display ?? toTitleCase(fieldName)) : toTitleCase(fieldName)}
                  value={toUpdate[fieldName as keyof typeof toUpdate]?.toString() || ''}
                  disabled
                />
              </div>
            </div>
          )
        );
      })}

      {additionalButtons}
    </form>
  );
}

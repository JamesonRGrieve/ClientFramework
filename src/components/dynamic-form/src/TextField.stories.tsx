import React, { useState } from 'react';
import TextField from './TextField';

export default {
  title: 'Components/TextField',
  component: TextField,
  argTypes: {
    label: { control: 'text', defaultValue: 'Text Field Label' },
    placeholder: { control: 'text', defaultValue: 'Enter text...' },
    helperText: { control: 'text', defaultValue: 'This is a helper text.' },
    error: { control: 'text', defaultValue: '' },
    type: { control: 'text', defaultValue: 'text' },
  },
};

export const Default = (args: any) => {
  const [value, setValue] = useState('');

  return (
    <TextField
      {...args}
      id="text-field"
      name="example"
      value={value}
      onChange={(event) => setValue(event.target.value)}
    />
  );
};

export const WithError = (args: any) => {
  const [value, setValue] = useState('');

  return (
    <TextField
      {...args}
      id="text-field-error"
      name="example-error"
      value={value}
      onChange={(event) => setValue(event.target.value)}
      error="This field is required."
    />
  );
};

export const PasswordField = (args: any) => {
  const [value, setValue] = useState('');

  return (
    <TextField
      {...args}
      id="password-field"
      name="password"
      value={value}
      onChange={(event) => setValue(event.target.value)}
      type="password"
      label="Password"
      placeholder="Enter your password"
    />
  );
};
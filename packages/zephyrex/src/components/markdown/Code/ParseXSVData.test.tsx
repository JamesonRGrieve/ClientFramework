// SPDX-License-Identifier: AGPL-3.0-or-later
import { describe, expect, it } from 'vitest';
import { parseXSVData } from './ParseXSVData';

describe('parseXSVData', () => {
  it('turns rows into columns and rows, numbering rows when there is no id column', () => {
    expect(parseXSVData(['name,age', '"Ada",36', 'Alan,41'], ',')).toEqual({
      columns: [
        { field: 'name', width: 160, flex: 1, headerName: 'name' },
        { field: 'age', width: 160, flex: 1, headerName: 'age' },
      ],
      rows: [
        { id: 0, name: 'Ada', age: '36' },
        { id: 1, name: 'Alan', age: '41' },
      ],
    });
  });

  it('keys rows by an id column, and widens a long header', () => {
    const header = 'a_very_long_column_heading';
    const result = parseXSVData([`id\t${header}`, 'u1\tx'], '\t');
    expect(result).toEqual({
      columns: [{ field: header, width: header.length * 10, flex: 1, headerName: header }],
      rows: [{ id: 'u1', [header]: 'x' }],
    });
  });

  it.each([
    ['no rows', []],
    ['ragged rows', ['a,b', '1']],
    ['a single column', ['a', '1']],
  ])('refuses %s', (_, rows) => {
    expect(parseXSVData(rows, ',')).toEqual({ error: 'XSV data is not valid.' });
  });
});

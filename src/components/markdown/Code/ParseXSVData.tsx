// SPDX-License-Identifier: AGPL-3.0-or-later
/** A column is at least this wide, and widens with its header's length. */
const MIN_COLUMN_WIDTH_PX = 160;
const HEADER_CHAR_WIDTH_PX = 10;

interface ColumnType {
  field: string;
  width: number;
  flex: number;
  headerName: string;
}

interface RowType {
  id: string | number;
  [key: string]: string | number;
}

export function parseXSVData(
  xsvData: string[],
  separator: RegExp | string,
): { rows: RowType[]; columns: ColumnType[] } | { error: string } {
  const rawData = xsvData.map((row) =>
    row
      .split(separator)
      .map((cell) => cell.trim().replaceAll('"', ''))
      .filter((cell) => cell),
  );

  const headerRow = rawData.at(0);
  if (
    headerRow === undefined ||
    !rawData.every((row) => row.length === headerRow.length) ||
    rawData.some((row) => [0, 1].includes(row.length))
  ) {
    return { error: 'XSV data is not valid.' };
  }

  const isIdHeader = (headerRow[0] ?? '').toLowerCase().includes('id');

  return {
    columns: (isIdHeader ? headerRow.slice(1) : headerRow).map((header) => ({
      field: header,
      width: Math.max(MIN_COLUMN_WIDTH_PX, header.length * HEADER_CHAR_WIDTH_PX),
      flex: 1,
      headerName: header,
    })),
    rows: rawData.slice(1).map((row, index) =>
      isIdHeader
        ? {
            id: row[0] ?? index,
            ...Object.fromEntries(row.slice(1).map((cell, i) => [headerRow[i + 1] ?? '', cell])),
          }
        : {
            id: index,
            ...Object.fromEntries(row.map((cell, i) => [headerRow[i] ?? '', cell])),
          },
    ),
  };
}

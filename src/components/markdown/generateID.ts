// SPDX-License-Identifier: AGPL-3.0-or-later
export default function generateId(text: string): string {
  return text ? text.toString().toLowerCase().replace(/\W+/g, '-') : '';
}

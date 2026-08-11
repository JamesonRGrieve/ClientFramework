// SPDX-License-Identifier: AGPL-3.0-or-later
export function validateURI(uri: string): boolean {
  try {
    new URL(uri);
    return true;
  } catch {
    return false;
  }
}

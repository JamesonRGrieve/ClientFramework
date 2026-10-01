// SPDX-License-Identifier: AGPL-3.0-or-later
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { GedcomTransfer } from './GedcomTransfer';
import { familyFixture } from './genealogy.mocks';
import { renderGenealogy } from './testing.mocks';

const gedcomFile = (text: string): File => new File([text], 'tree.ged', { type: 'text/plain' });

describe('GedcomTransfer', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('imports a GEDCOM file and says what it brought in', async () => {
    const store = familyFixture();
    const user = userEvent.setup();
    const view = renderGenealogy(<GedcomTransfer />, store);
    await user.upload(view.getByLabelText('Import a GEDCOM file'), gedcomFile('0 HEAD\n0 @I1@ INDI\n0 TRLR'));
    expect(await view.findByRole('status')).toHaveTextContent('Imported 1 person and 0 relationships from GEDCOM 5.5.1.');
    expect(store.persons.some((row) => row.name === 'Imported ancestor')).toBe(true);
  });

  it("shows the server's reason for refusing a file", async () => {
    const user = userEvent.setup();
    const view = renderGenealogy(<GedcomTransfer />);
    await user.upload(view.getByLabelText('Import a GEDCOM file'), gedcomFile('0 HEAD\n0 TRLR'));
    expect(await view.findByRole('alert')).toHaveTextContent('The file has no INDI records.');
  });

  it('downloads the tree from the export route', () => {
    const view = renderGenealogy(<GedcomTransfer />);
    expect(view.getByRole('link', { name: 'Download as GEDCOM' })).toHaveAttribute(
      'href',
      'http://localhost:1996/v1/person/gedcom',
    );
  });
});

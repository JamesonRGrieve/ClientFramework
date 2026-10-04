// SPDX-License-Identifier: AGPL-3.0-or-later
import { within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { bookFixture } from './book.mocks';
import { chapterChanges, Chapters } from './Chapters';
import { renderBook } from './testing.mocks';

const CHAPTERS = 'Chapters';
const NOTE_G = '2. Note G';
const SAVE_CHAPTER = 'Save chapter';

describe('chapterChanges', () => {
  const noteG = {
    id: 'c2',
    book_id: 'notes',
    title: 'Note G',
    content: 'Bernoulli numbers.',
    position: 2,
    word_count: 2,
  };

  it('keeps only what changed, with the title trimmed', () => {
    expect(chapterChanges(noteG, ' Note G ', noteG.content)).toEqual({});
    expect(chapterChanges(noteG, 'Note H', 'New text')).toEqual({ title: 'Note H', content: 'New text' });
  });
});

describe('Chapters', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('lists the chapters in order with their word counts', async () => {
    const view = renderBook(<Chapters bookId='notes' />);
    const list = await view.findByRole('list', { name: CHAPTERS });
    expect(
      within(list)
        .getAllByRole('listitem')
        .map((item) => item.textContent),
    ).toEqual(['1. The engine6 words', '2. Note G6 words', '3. Afterword0 words']);
  });

  it('edits a chapter and shows its new word count', async () => {
    const store = bookFixture();
    const user = userEvent.setup();
    const view = renderBook(<Chapters bookId='notes' />, store);
    await user.click(await view.findByRole('button', { name: '3. Afterword' }));
    await user.type(view.getByLabelText('Text (Markdown)'), 'The end.');
    await user.click(view.getByRole('button', { name: SAVE_CHAPTER }));
    expect(await view.findByRole('status')).toHaveTextContent('Saved.');
    expect(await view.findByText('2 words')).toBeInTheDocument();
  });

  it('keeps the user’s text beside the chapter as it is now when someone changed it first', async () => {
    const store = bookFixture();
    const user = userEvent.setup();
    const view = renderBook(<Chapters bookId='notes' />, store);
    await user.click(await view.findByRole('button', { name: NOTE_G }));
    store.chapters = store.chapters.map((chapter) =>
      chapter.id === 'c2' ? { ...chapter, title: 'Note G, revised', updated_at: '2026-10-03T12:00:00.000002' } : chapter,
    );
    const title = view.getByLabelText('Chapter title');
    await user.clear(title);
    await user.type(title, 'Note G: Bernoulli');
    await user.click(view.getByRole('button', { name: SAVE_CHAPTER }));
    expect(await view.findByRole('radio', { name: 'Current: Note G, revised' })).not.toBeChecked();
    expect(store.chapters.find(({ id }) => id === 'c2')?.title).toBe('Note G, revised');
  });

  it('adds a chapter at the end of the book', async () => {
    const store = bookFixture();
    const user = userEvent.setup();
    const view = renderBook(<Chapters bookId='notes' />, store);
    await user.type(await view.findByLabelText('New chapter'), 'Appendix');
    await user.click(view.getByRole('button', { name: 'Add chapter' }));
    expect(await view.findByRole('button', { name: '4. Appendix' })).toBeInTheDocument();
    expect(store.chapters.at(-1)).toMatchObject({ book_id: 'notes', title: 'Appendix', position: 4 });
  });

  it('deletes a chapter', async () => {
    const store = bookFixture();
    const user = userEvent.setup();
    const view = renderBook(<Chapters bookId='notes' />, store);
    await user.click(await view.findByRole('button', { name: NOTE_G }));
    await user.click(view.getByRole('button', { name: 'Delete chapter' }));
    await vi.waitFor(() => {
      expect(view.queryByRole('button', { name: NOTE_G })).toBeNull();
    });
    expect(store.chapters.map(({ id }) => id)).toEqual(['c1', 'c3']);
  });

  it('says so when the book has no chapters', async () => {
    const view = renderBook(<Chapters bookId='letters' />);
    expect(await view.findByText('No chapters yet.')).toBeInTheDocument();
  });
});

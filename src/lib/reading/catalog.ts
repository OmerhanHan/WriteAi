import { localEpub } from './epubSource'
import type { LibraryBook, ShelfGroup } from './types'

/**
 * Static catalog for now. When Storage lands, keep the same shape —
 * only change `epub` from localEpub(...) to storageEpub(...).
 */
export const LIBRARY_BOOKS: LibraryBook[] = [
  {
    id: 'city-life',
    title: 'City Life',
    author: 'A1–A2',
    tone: 'sage',
    height: 'md',
    shelf: 'Short Passages',
    epub: localEpub('city-life.epub'),
    description: 'A short passage about living in a busy city.',
  },
  {
    id: 'morning-routines',
    title: 'Morning Routines',
    author: 'A2',
    tone: 'butter',
    height: 'sm',
    shelf: 'Short Passages',
    epub: localEpub('morning-routines.epub'),
    description: 'How different people start their day.',
  },
  {
    id: 'travel-notes',
    title: 'Travel Notes',
    author: 'B1',
    tone: 'rose',
    height: 'lg',
    shelf: 'Short Passages',
    epub: localEpub('travel-notes.epub'),
    description: 'Notes from a trip abroad.',
  },
  {
    id: 'academic-pack',
    title: 'Academic Pack',
    author: 'Band 6+',
    tone: 'slate',
    height: 'lg',
    shelf: 'IELTS Reading',
    epub: localEpub('academic-pack.epub'),
    description: 'An academic-style reading passage for practice.',
  },
  {
    id: 'true-false',
    title: 'True / False',
    author: 'Practice',
    tone: 'ink',
    height: 'md',
    shelf: 'IELTS Reading',
    epub: localEpub('true-false.epub'),
    description: 'A passage with true / false / not given style content.',
  },
  {
    id: 'matching-heads',
    title: 'Matching Heads',
    author: 'Skills',
    tone: 'sage',
    height: 'sm',
    shelf: 'IELTS Reading',
    epub: localEpub('matching-heads.epub'),
    description: 'Practice scanning for paragraph themes.',
  },
  {
    id: 'old-library',
    title: 'The Old Library',
    author: 'Fiction',
    tone: 'rose',
    height: 'md',
    shelf: 'Stories',
    epub: localEpub('old-library.epub'),
    description: 'A short story set in a forgotten library.',
  },
  {
    id: 'lost-letter',
    title: 'Lost Letter',
    author: 'Fiction',
    tone: 'butter',
    height: 'lg',
    shelf: 'Stories',
    epub: localEpub('lost-letter.epub'),
    description: 'A letter that changes everything.',
  },
]

export function getBookById(id: string): LibraryBook | undefined {
  return LIBRARY_BOOKS.find(b => b.id === id)
}

export function getShelfGroups(): ShelfGroup[] {
  const order: string[] = []
  const map = new Map<string, LibraryBook[]>()

  for (const book of LIBRARY_BOOKS) {
    if (!map.has(book.shelf)) {
      map.set(book.shelf, [])
      order.push(book.shelf)
    }
    map.get(book.shelf)!.push(book)
  }

  return order.map(label => ({ label, books: map.get(label)! }))
}

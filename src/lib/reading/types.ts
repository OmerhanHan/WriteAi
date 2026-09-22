import type { BookTone } from '@/components/library'

/** Where the EPUB file lives — swap `local` → `storage` later without changing UI. */
export type EpubSource =
  | { kind: 'local'; path: string }
  | { kind: 'storage'; bucket: string; path: string }

export type LibraryBook = {
  id: string
  title: string
  author?: string
  tone: BookTone
  height: 'sm' | 'md' | 'lg'
  shelf: string
  epub: EpubSource
  /** Short blurb for reader header / future detail view */
  description?: string
}

export type ShelfGroup = {
  label: string
  books: LibraryBook[]
}

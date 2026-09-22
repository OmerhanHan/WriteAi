'use client'
import { useRouter } from 'next/navigation'
import Book from './Book'
import Bookshelf from './Bookshelf'
import { getShelfGroups } from '@/lib/reading'
import styles from './library.module.css'

export default function LibraryShelves() {
  const router = useRouter()
  const shelves = getShelfGroups()

  return (
    <div className={styles.shelves} role="list" aria-label="Kütüphane rafları">
      {shelves.map(shelf => (
        <Bookshelf key={shelf.label} label={shelf.label}>
          {shelf.books.map(book => (
            <Book
              key={book.id}
              title={book.title}
              author={book.author}
              tone={book.tone}
              height={book.height}
              onClick={() => router.push(`/app/reading/library/${book.id}`)}
            />
          ))}
        </Bookshelf>
      ))}
    </div>
  )
}

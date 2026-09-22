'use client'
import { useRouter } from 'next/navigation'
import { LibraryShelves } from '@/components/library'
import styles from './library.module.css'

export default function LibraryPage() {
  const router = useRouter()

  return (
    <main className={styles.page}>
      <header className={`${styles.header} anim-fade-up`}>
        <button
          type="button"
          className={styles.back}
          onClick={() => router.push('/app/reading')}
          aria-label="Okumaya dön"
        >
          ← Okuma
        </button>
        <h1 className={styles.title}>Kütüphane</h1>
        <p className={styles.sub}>Raftan bir kitap seç</p>
      </header>

      <div className="anim-fade-up d1">
        <LibraryShelves />
      </div>
    </main>
  )
}

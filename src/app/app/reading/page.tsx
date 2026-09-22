'use client'
import { useRouter } from 'next/navigation'
import styles from './reading.module.css'

export default function ReadingPage() {
  const router = useRouter()

  return (
    <main className={styles.page}>
      <header className={`${styles.header} anim-fade-up`}>
        <h1 className={styles.title}>Okuma Modu</h1>
        <p className={styles.sub}>Nasıl okumak istersin?</p>
      </header>

      <div className={`${styles.cards} anim-fade-up d1`}>
        <button
          id="reading-mode-library"
          className={`${styles.card} ${styles.cardA}`}
          onClick={() => router.push('/app/reading/library')}
        >
          <span className={styles.cardEmoji}>📚</span>
          <span className={styles.cardTitle}>Kütüphane</span>
          <span className={styles.cardTag}>Library</span>
          <span className={styles.cardDesc}>Raflardaki metinlerden birini seçip oku.</span>
          <span className={styles.cardCta}>Aç →</span>
        </button>
      </div>

      <div className={`${styles.tip} anim-fade-up d2`}>
        <span>💡</span>
        <p className={styles.tipText}>
          Düzenli okuma kelime dağarcığını ve band skorunu güçlendirir.
          Kısa pasajlarla başla, zamanla uzun metinlere geç.
        </p>
      </div>
    </main>
  )
}

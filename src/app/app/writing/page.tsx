'use client'
import { useRouter } from 'next/navigation'
import styles from './writing.module.css'

export default function WritingPage() {
  const router = useRouter()
  return (
    <main className={styles.page}>
      <header className={`${styles.header} anim-fade-up`}>
        <h1 className={styles.title}>Yazım Modu</h1>
        <p className={styles.sub}>Nasıl pratik yapmak istersin?</p>
      </header>

      <div className={`${styles.cards} anim-fade-up d1`}>
        <button id="writing-mode-predetermined" className={`${styles.card} ${styles.cardA}`} onClick={() => router.push('/app/writing/predetermined')}>
          <span className={styles.cardEmoji}>📌</span>
          <span className={styles.cardTitle}>Konum Var</span>
          <span className={styles.cardTag}>Predetermined</span>
          <span className={styles.cardDesc}>Kendi belirlediğin bir konuyla yaz.</span>
          <span className={styles.cardCta}>Başla →</span>
        </button>

        <button id="writing-mode-random" className={`${styles.card} ${styles.cardB}`} onClick={() => router.push('/app/writing/random')}>
          <span className={styles.cardEmoji}>🎲</span>
          <span className={styles.cardTitle}>Rastgele</span>
          <span className={styles.cardTag}>Random Topic</span>
          <span className={styles.cardDesc}>AI sana rastgele bir konu atar.</span>
          <span className={styles.cardCta}>Başla →</span>
        </button>
      </div>

      <div className={`${styles.tip} anim-fade-up d2`}>
        <span>💡</span>
        <p className={styles.tipText}>
          IELTS Task 2 için hedef: <strong>250+ kelime</strong> ve 40 dakika.
          Her gün pratik yapmak band skorunu artırır.
        </p>
      </div>
    </main>
  )
}

'use client'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { getStats } from '@/lib/storage'
import { useEffect, useState } from 'react'
import styles from './home.module.css'

function greeting(name: string) {
  const h = new Date().getHours()
  if (h < 12) return { label: 'Günaydın', name }
  if (h < 18) return { label: 'İyi günler', name }
  return { label: 'İyi akşamlar', name }
}

export default function HomePage() {
  const { user } = useAuth()
  const router   = useRouter()
  const [stats, setStats] = useState({ totalWritings: 0, totalWords: 0, avgBandScore: 0, streak: 0, lastStudied: null as string | null })
  useEffect(() => { setStats(getStats()) }, [])

  const firstName = user?.name?.split(' ')[0] || 'Kullanıcı'
  const { label }  = greeting(firstName)

  return (
    <main className={styles.page}>
      {/* Header */}
      <header className={`${styles.header} anim-fade-up`}>
        <div className={styles.greetBlock}>
          <p className={styles.greetLabel}>{label}</p>
          <h1 className={styles.greetName}>{firstName}</h1>
          <p className={styles.greetSub}>
            {stats.totalWritings === 0 ? 'İlk yazını yazmaya hazır mısın?' :
             `${stats.totalWritings} yazı tamamlandı`}
          </p>
        </div>
        <div className={styles.avatar}>{firstName.charAt(0).toUpperCase()}</div>
      </header>

      {/* Stats */}
      <div className={`${styles.stats} anim-fade-up d1`}>
        {[
          { val: stats.totalWritings, lbl: 'Yazı' },
          { val: stats.avgBandScore > 0 ? stats.avgBandScore.toFixed(1) : '—', lbl: 'Ort. Band' },
          { val: stats.totalWords > 999 ? `${(stats.totalWords/1000).toFixed(1)}k` : stats.totalWords || '—', lbl: 'Kelime' },
        ].map(s => (
          <div key={s.lbl} className={styles.statCard}>
            <span className={styles.statVal}>{s.val}</span>
            <span className={styles.statLbl}>{s.lbl}</span>
          </div>
        ))}
      </div>

      {/* Cards */}
      <p className={`${styles.sectionTitle} anim-fade-up d2`}>Ne yapmak istersin?</p>
      <div className={`${styles.mainCards} anim-fade-up d2`}>
        <button id="home-notebook" className={`${styles.mainCard} ${styles.cardWrite}`} onClick={() => router.push('/app/writing')}>
          <span className={styles.cardEmoji}>📓</span>
          <span className={styles.cardTitle}>Yeni Yazı</span>
          <span className={styles.cardDesc}>PRATIK YAP →</span>
        </button>
        <button id="home-folder" className={`${styles.mainCard} ${styles.cardHistory}`} onClick={() => router.push('/app/history')}>
          <span className={styles.cardEmoji}>📁</span>
          <span className={styles.cardTitle}>Geçmiş</span>
          <span className={styles.cardDesc}>YAZILARI GÖR →</span>
        </button>
        <button id="home-audio" className={`${styles.mainCard} ${styles.cardMeet}`} onClick={() => router.push('/app/speaking')}>
          <span className={styles.cardEmoji}>🎙️</span>
          <span className={styles.cardTitle}>Sesli Antrenman</span>
          <span className={styles.cardDesc}>Sohbet Et →</span>
        </button>
      </div>

      {/* Streak */}
      {stats.streak > 0 && (
        <div className={`anim-fade-up d3`}>
          <span className={styles.streakPill}>🔥 {stats.streak} günlük seri devam ediyor</span>
        </div>
      )}
    </main>
  )
}

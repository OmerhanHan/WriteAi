'use client'
import { useState, useCallback, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { saveWriting, updateWritingFeedback } from '@/lib/storage'
import { analyzeWriting } from '@/lib/mockAI'
import styles from './random.module.css'

const ALL_TOPICS = [
  "The impact of social media on modern communication",
  "Should universities be free for all students?",
  "Climate change: individual vs. government action",
  "The future of remote work",
  "Artificial intelligence and employment",
  "Is space exploration worth the cost?",
  "Technology's role in education",
  "Should fast food be taxed more heavily?",
  "Mental health awareness in workplaces",
  "Are electric vehicles the solution?",
  "Effects of urbanization on wildlife",
  "Should voting be mandatory?",
  "Video games and children's behavior",
  "Is globalization beneficial or harmful?",
  "Cryptocurrency: a financial revolution?",
  "Should the retirement age be raised?",
  "The role of art in society",
  "Online privacy in the digital age",
  "Animal testing in scientific research",
  "Tourism's impact on local cultures",
]

export default function RandomPage() {
  const router = useRouter()

  // Tek kaynak: random sonucu buraya yazılır, slot + text buradan okur
  const [topic, setTopic] = useState<string | null>(null)

  const [spinPreview, setSpinPreview] = useState<string | null>(null)
  const [content, setContent] = useState('')
  const [rolling, setRolling] = useState(false)
  const [saving, setSaving] = useState(false)
  const [analyzing, setAnalyzing] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [savedId, setSavedId] = useState<string | null>(null)
  const [toast, setToast] = useState<string | null>(null)

  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([])

  const wordCount = content.trim().split(/\s+/).filter(Boolean).length
  const progress = Math.min(wordCount / 250 * 100, 100)
  const showToast = (m: string) => { setToast(m); setTimeout(() => setToast(null), 2500) }

  const clearTimers = () => {
    timersRef.current.forEach(clearTimeout)
    timersRef.current = []
  }

  useEffect(() => () => clearTimers(), [])

  const handleSpin = useCallback(() => {
    if (rolling) return
    clearTimers()

    // 1) Random seç → boş değişkene ata
    const selectedTopic = ALL_TOPICS[Math.floor(Math.random() * ALL_TOPICS.length)]

    setRolling(true)
    setTopic(null)
    setContent('')

    // 2) Slotta hızlıca başka konular geçsin (sadece görsel)
    const shuffle = [...ALL_TOPICS].sort(() => Math.random() - 0.5)
    const frames = 18
    for (let i = 0; i < frames; i++) {
      const t = setTimeout(() => {
        setSpinPreview(shuffle[i % shuffle.length])
      }, i * 70)
      timersRef.current.push(t)
    }

    // 3) Bitince TEK değeri yaz — slot da text de bunu gösterir
    const done = setTimeout(() => {
      setTopic(selectedTopic)
      setSpinPreview(null)
      setRolling(false)
    }, frames * 70 + 50)
    timersRef.current.push(done)
  }, [rolling])

  const handleSave = useCallback(() => {
    if (!topic || wordCount < 10) { if (wordCount < 10) showToast('⚠ Daha fazla yaz!'); return }
    setSaving(true)
    const w = saveWriting({ user_id: '', mode: 'random', topic, content, word_count: wordCount, has_feedback: false })
    setSavedId(w.id); setSaving(false); setShowModal(true)
  }, [topic, wordCount, showToast])

  const handleAnalyze = useCallback(async () => {
    if (!savedId || !topic) return
    setShowModal(false); setAnalyzing(true)
    try {
      const fb = await analyzeWriting(content, topic)
      updateWritingFeedback(savedId, fb)
      setAnalyzing(false)
      router.push(`/app/history/${savedId}`)
    } catch (e) { console.error(e); setAnalyzing(false); showToast('❌ Analiz başarısız') }
  }, [savedId, topic, content, showToast])

  const handleSkip = useCallback(() => {
    setShowModal(false)
    showToast("✓ Çalışmalar'a kaydedildi")
    setTimeout(() => router.push('/app/history'), 1500)
  }, [showToast])

  // Slotta görünen metin: çekiliş sırasında preview, bitince topic
  const slotText = rolling ? spinPreview : topic

  return (
    <main className={styles.page}>
      <header className={`${styles.header} anim-fade-up`}>
        <button id="back-btn" className={styles.back} onClick={() => router.back()}>←</button>
        <div>
          <h1 className={styles.hTitle}>Rastgele Konu</h1>
          <p className={styles.hSub}>Random Topic</p>
        </div>
      </header>

      <div className={`anim-fade-up d1`}>
        <div className={styles.slotSection}>
          <span className={styles.slotLabel}>🎰 Konu Çekilişi</span>

          <div className={styles.slotMachine}>
            <div className={styles.slotHighlight} />

            {slotText ? (
              <div className={`${styles.slotItem} ${styles.slotItemCenter} ${!rolling ? styles.slotSelected : ''}`}>
                {slotText}
              </div>
            ) : (
              <div className={styles.slotIdle}>Konu üretmek için butona bas</div>
            )}
          </div>

          <button id="spin-btn" className={styles.spinBtn} onClick={handleSpin} disabled={rolling}>
            {rolling ? <><span className="spinner spinner-ink" /> Çekiliyor...</> : topic ? '↺  Yeni Konu Çek' : '▶  Konu Çek'}
          </button>
        </div>

        {/* Text = aynı topic değişkeni */}
        {topic && !rolling && (
          <div className={styles.topicReveal} id="generated-topic">
            <p className={styles.topicRevealLabel}>✓ Seçilen Konu</p>
            <p className={styles.topicRevealText}>{topic}</p>
          </div>
        )}
      </div>

      {topic && !rolling && (
        <div className={`${styles.body} anim-fade-up`} style={{ marginTop: 24 }}>
          <div>
            <label htmlFor="random-textarea" className={styles.fieldLabel}>✎ Yazı</label>
            <div className={styles.editorWrap}>
              <div className={styles.editorTop}>
                <span className={styles.editorLabel}>English Essay</span>
                <span className={`${styles.wordCount} ${wordCount >= 250 ? styles.wordCountOk : ''}`}>{wordCount} / 250 words</span>
              </div>
              <textarea id="random-textarea" className={styles.textarea}
                placeholder="Start writing your essay in English here..."
                value={content} onChange={e => setContent(e.target.value)} rows={12} />
              <div className={styles.progressRow}>
                <div className={styles.progressTrack}>
                  <div className={`${styles.progressFill} ${progress >= 100 ? styles.progressDone : ''}`} style={{ width: `${progress}%` }} />
                </div>
                {wordCount >= 250 && <p className={styles.progressMsg}>✓ Hedef kelime sayısına ulaştın!</p>}
              </div>
            </div>
          </div>
          <button id="save-random-btn" className={styles.saveBtn} onClick={handleSave} disabled={saving || analyzing}>
            {saving ? <><span className="spinner" /> Kaydediliyor...</> : analyzing ? <><span className="spinner" /> AI Analiz Ediyor...</> : '→ Kaydet'}
          </button>
        </div>
      )}

      {showModal && (
        <div className={styles.modalOverlay} onClick={() => setShowModal(false)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <div className={styles.modalIcon}>🤖</div>
            <h2 className={styles.modalTitle}>AI ile analiz et?</h2>
            <p className={styles.modalDesc}>Grammar, band score ve öneriler alacaksın.</p>
            <div className={styles.modalBtns}>
              <button id="modal-yes" className={styles.btnYes} onClick={handleAnalyze}>→ Evet, analiz et</button>
              <button id="modal-no" className={styles.btnNo} onClick={handleSkip}>✕ Hayır, sadece kaydet</button>
            </div>
          </div>
        </div>
      )}

      {toast && <div className="toast">{toast}</div>}
    </main>
  )
}

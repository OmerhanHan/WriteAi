'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { saveWriting, updateWritingFeedback } from '@/lib/storage'
import { analyzeWriting } from '@/lib/mockAI'
import styles from './predetermined.module.css'

export default function PredeterminedPage() {
  const router = useRouter()
  const [topic, setTopic]       = useState('')
  const [content, setContent]   = useState('')
  const [saving, setSaving]     = useState(false)
  const [analyzing, setAnalyzing] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [savedId, setSavedId]   = useState<string | null>(null)
  const [toast, setToast]       = useState<string | null>(null)

  const wordCount = content.trim().split(/\s+/).filter(Boolean).length
  const progress  = Math.min(wordCount / 250 * 100, 100)

  const showToast = (m: string) => { setToast(m); setTimeout(() => setToast(null), 2500) }

  const handleSave = async () => {
    if (!topic.trim()) { showToast('⚠ Lütfen bir başlık girin'); return }
    if (wordCount < 10) { showToast('⚠ Daha fazla yaz!'); return }
    setSaving(true)
    const w = saveWriting({ user_id: '', mode: 'predetermined', topic: topic.trim(), content, word_count: wordCount, has_feedback: false })
    setSavedId(w.id); setSaving(false); setShowModal(true)
  }

  const handleAnalyze = async () => {
    if (!savedId) return
    setShowModal(false); setAnalyzing(true)
    const fb = await analyzeWriting(content, topic)
    updateWritingFeedback(savedId, fb)
    setAnalyzing(false)
    router.push(`/app/history/${savedId}`)
  }

  const handleSkip = () => {
    setShowModal(false)
    showToast('✓ Çalışmalar\'a kaydedildi')
    setTimeout(() => router.push('/app/history'), 1500)
  }

  return (
    <main className={styles.page}>
      <header className={`${styles.header} anim-fade-up`}>
        <button id="back-btn" className={styles.back} onClick={() => router.back()}>←</button>
        <div>
          <h1 className={styles.hTitle}>Konum Var</h1>
          <p className={styles.hSub}>Predetermined Topic</p>
        </div>
      </header>

      <div className={`${styles.body} anim-fade-up d1`}>
        {/* Topic */}
        <div>
          <label htmlFor="topic-input" className={styles.fieldLabel}>📌 Başlık / Konu</label>
          <input id="topic-input" type="text" className={styles.topicInput}
            placeholder="Örn: The impact of social media on youth..."
            value={topic} onChange={e => setTopic(e.target.value)} />
        </div>

        {/* Editor */}
        <div>
          <label htmlFor="writing-textarea" className={styles.fieldLabel}>✎ Yazı</label>
          <div className={styles.editorWrap}>
            <div className={styles.editorTop}>
              <span className={styles.editorLabel}>English Essay</span>
              <span className={`${styles.wordCount} ${wordCount >= 250 ? styles.wordCountOk : ''}`}>
                {wordCount} / 250 words
              </span>
            </div>
            <textarea id="writing-textarea" className={styles.textarea}
              placeholder="Start writing your essay in English here..."
              value={content} onChange={e => setContent(e.target.value)} rows={14} />
            <div className={styles.progressRow}>
              <div className={styles.progressTrack}>
                <div className={`${styles.progressFill} ${progress >= 100 ? styles.progressDone : ''}`} style={{ width: `${progress}%` }} />
              </div>
              {wordCount >= 250 && <p className={styles.progressMsg}>✓ Hedef kelime sayısına ulaştın!</p>}
            </div>
          </div>
        </div>

        <button id="save-writing-btn" className={styles.saveBtn} onClick={handleSave} disabled={saving || analyzing}>
          {saving ? <><span className="spinner" /> Kaydediliyor...</>
           : analyzing ? <><span className="spinner" /> AI Analiz Ediyor...</>
           : '→ Kaydet'}
        </button>
      </div>

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

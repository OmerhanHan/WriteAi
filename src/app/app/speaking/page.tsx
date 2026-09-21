'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSpeakingLive } from '@/lib/speaking/useSpeakingLive'
import styles from './speaking.module.css'

type RecStatus = 'idle' | 'listening' | 'unsupported'

type SpeechRec = {
  lang: string
  continuous: boolean
  interimResults: boolean
  start: () => void
  stop: () => void
  abort: () => void
  onresult: ((ev: SpeechRecognitionEventLike) => void) | null
  onerror: ((ev: { error: string }) => void) | null
  onend: (() => void) | null
}

type SpeechRecognitionEventLike = {
  resultIndex: number
  results: ArrayLike<{ isFinal: boolean; 0: { transcript: string } }>
}

function getSpeechRecognitionCtor(): (new () => SpeechRec) | null {
  if (typeof window === 'undefined') return null
  const w = window as Window & {
    SpeechRecognition?: new () => SpeechRec
    webkitSpeechRecognition?: new () => SpeechRec
  }
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null
}

export default function SpeakingPage() {
  const router = useRouter()
  const [transcript, setTranscript] = useState('')
  const [interim, setInterim] = useState('')
  const [status, setStatus] = useState<RecStatus>('idle')
  const [toast, setToast] = useState<string | null>(null)
  const [sessionStarted, setSessionStarted] = useState(false)

  const recRef = useRef<SpeechRec | null>(null)
  const finalRef = useRef('')
  const live = useSpeakingLive()
  const chatEndRef = useRef<HTMLDivElement | null>(null)

  const showToast = (m: string) => {
    setToast(m)
    setTimeout(() => setToast(null), 2800)
  }

  useEffect(() => {
    const Ctor = getSpeechRecognitionCtor()
    if (!Ctor) {
      setStatus('unsupported')
      return
    }

    const rec = new Ctor()
    rec.lang = 'en-US'
    rec.continuous = true
    rec.interimResults = true

    rec.onresult = (ev) => {
      let interimText = ''
      let finalChunk = ''
      for (let i = ev.resultIndex; i < ev.results.length; i++) {
        const piece = ev.results[i][0].transcript
        if (ev.results[i].isFinal) finalChunk += piece
        else interimText += piece
      }
      if (finalChunk) {
        finalRef.current = `${finalRef.current}${finalRef.current ? ' ' : ''}${finalChunk.trim()}`.trim()
        setTranscript(finalRef.current)
      }
      setInterim(interimText)
    }

    rec.onerror = (ev) => {
      if (ev.error === 'not-allowed') showToast('⚠ Mikrofon izni gerekli')
      else if (ev.error !== 'aborted' && ev.error !== 'no-speech') showToast('⚠ Dikte hatası')
      setStatus('idle')
    }

    rec.onend = () => {
      setStatus((s) => (s === 'listening' ? 'idle' : s))
      setInterim('')
    }

    recRef.current = rec
    return () => {
      try { rec.abort() } catch { /* ignore */ }
      recRef.current = null
    }
  }, [])

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  }, [live.turns, live.status])

  const startListening = useCallback(() => {
    const rec = recRef.current
    if (!rec) {
      showToast('⚠ Bu tarayıcıda dikte desteklenmiyor')
      return
    }
    try {
      rec.start()
      setStatus('listening')
    } catch {
      showToast('⚠ Dikte başlatılamadı')
    }
  }, [])

  const stopListening = useCallback(() => {
    try { recRef.current?.stop() } catch { /* ignore */ }
    setStatus('idle')
    setInterim('')
  }, [])

  const toggleMic = () => {
    if (!sessionStarted) {
      showToast('⚠ Önce live oturumu başlat')
      return
    }
    if (status === 'unsupported') {
      showToast('⚠ Chrome / Edge ile dene — sistem diktesi')
      return
    }
    if (status === 'listening') stopListening()
    else startListening()
  }

  const clearAnswer = () => {
    finalRef.current = ''
    setTranscript('')
    setInterim('')
  }

  const sendToCoach = async () => {
    const text = [finalRef.current, interim].filter(Boolean).join(' ').trim()
    if (!text) {
      showToast('⚠ Önce konuş veya bir şey yaz')
      return
    }
    if (live.isBusy) {
      showToast('⚠ Koç hâlâ yanıtlıyor…')
      return
    }
    stopListening()
    clearAnswer()
    await live.send(text)
  }

  const beginLive = async () => {
    stopListening()
    clearAnswer()
    setSessionStarted(true)
    await live.startSession()
  }

  const endLive = () => {
    stopListening()
    clearAnswer()
    live.reset()
    setSessionStarted(false)
  }

  const displayAnswer = [transcript, interim].filter(Boolean).join(' ')
  const coachStreaming = live.turns.some((t) => t.streaming)

  return (
    <main className={styles.page}>
      <header className={`${styles.header} anim-fade-up`}>
        <button id="speaking-back" className={styles.back} onClick={() => router.back()} aria-label="Geri">←</button>
        <div className={styles.headerText}>
          <h1 className={styles.hTitle}>Sesli Antrenman</h1>
          <p className={styles.hSub}>
            Live Speaking
            {live.providerMeta ? ` · ${live.providerMeta.provider}/${live.providerMeta.model}` : ''}
          </p>
        </div>
      </header>

      <div className={`${styles.stage} anim-fade-up d1`}>
        <div className={styles.characterStage}>
          <img
            src="/characters/speaking-coach.jpeg"
            alt="Speaking coach"
            className={`${styles.characterImage} ${coachStreaming ? styles.characterTalking : ''}`}
          />
          {coachStreaming && <span className={styles.liveBadge}>Live</span>}
        </div>

        <section className={styles.chatBox} aria-live="polite">
          <div className={styles.chatTop}>
            <span className={styles.answerLabel}>Canlı sohbet</span>
            {sessionStarted && (
              <button type="button" className={styles.clearBtn} onClick={endLive}>
                Bitir
              </button>
            )}
          </div>

          {!sessionStarted && (
            <p className={`${styles.answerText} ${styles.answerPlaceholder}`}>
              Live oturumu başlat — koç Ollama üzerinden (gemma4:e4b) seninle konuşacak.
            </p>
          )}

          {sessionStarted && live.turns.length === 0 && live.isBusy && (
            <p className={`${styles.answerText} ${styles.answerPlaceholder}`}>
              Koç bağlanıyor…
            </p>
          )}

          <div className={styles.chatList}>
            {live.turns.map((turn) => (
              <div
                key={turn.id}
                className={`${styles.bubble} ${turn.role === 'user' ? styles.bubbleUser : styles.bubbleCoach}`}
              >
                <span className={styles.bubbleRole}>
                  {turn.role === 'user' ? 'Sen' : 'Koç'}
                  {turn.streaming ? ' · …' : ''}
                </span>
                <p className={styles.bubbleText}>
                  {turn.content || (turn.streaming ? '…' : '')}
                </p>
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>

          {live.error && (
            <p className={styles.errorNote}>{live.error}</p>
          )}
        </section>

        <section className={styles.answerBox}>
          <div className={styles.answerTop}>
            <span className={styles.answerLabel}>Senin cevabın</span>
            {displayAnswer && (
              <button type="button" className={styles.clearBtn} onClick={clearAnswer}>Temizle</button>
            )}
          </div>
          <p className={`${styles.answerText} ${!displayAnswer ? styles.answerPlaceholder : ''}`}>
            {displayAnswer || (sessionStarted ? 'Mikrofona basıp İngilizce konuş…' : 'Önce live oturumu başlat')}
          </p>
        </section>
      </div>

      <div className={`${styles.controls} anim-fade-up d2`}>
        {!sessionStarted ? (
          <button
            id="speaking-live-start"
            type="button"
            className={styles.micBtn}
            onClick={beginLive}
            disabled={live.isBusy}
          >
            <span className={styles.micIcon}>▶</span>
            <span>Live Başlat</span>
          </button>
        ) : (
          <>
            <button
              id="speaking-mic"
              type="button"
              className={`${styles.micBtn} ${status === 'listening' ? styles.micActive : ''}`}
              onClick={toggleMic}
              aria-pressed={status === 'listening'}
              disabled={live.isBusy}
            >
              <span className={styles.micIcon}>{status === 'listening' ? '■' : '🎙️'}</span>
              <span>{status === 'listening' ? 'Durdur' : 'Dikte Başlat'}</span>
            </button>

            <button
              id="speaking-send"
              type="button"
              className={styles.nextBtn}
              onClick={sendToCoach}
              disabled={live.isBusy || !displayAnswer.trim()}
            >
              {live.isBusy ? 'Koç yanıtlıyor…' : 'Koça Gönder →'}
            </button>

            {live.isBusy && (
              <button type="button" className={styles.stopStreamBtn} onClick={live.stop}>
                Yanıtı kes
              </button>
            )}
          </>
        )}
      </div>

      {status === 'unsupported' && (
        <p className={styles.supportNote}>
          Tarayıcı diktesi bu cihazda yok. Chrome veya Edge ile dene.
        </p>
      )}

      {status === 'listening' && (
        <p className={styles.listeningNote} aria-live="polite">Dinleniyor… sistem diktesi aktif</p>
      )}

      {toast && <div className="toast">{toast}</div>}
    </main>
  )
}

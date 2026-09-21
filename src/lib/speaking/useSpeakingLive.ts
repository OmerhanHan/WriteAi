'use client'

import { useCallback, useRef, useState } from 'react'
import type { ChatMessage, StreamChunk } from '@/lib/speaking/types'
import { SPEAKING_STARTER_PROMPT } from '@/lib/speaking/prompts'

export type LiveTurn = {
  id: string
  role: 'user' | 'assistant'
  content: string
  streaming?: boolean
}

type Status = 'idle' | 'connecting' | 'streaming' | 'error'

function uid() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

async function* readSse(res: Response): AsyncGenerator<StreamChunk> {
  if (!res.body) throw new Error('Boş yanıt')

  const reader = res.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) break

    buffer += decoder.decode(value, { stream: true })
    const parts = buffer.split('\n\n')
    buffer = parts.pop() ?? ''

    for (const part of parts) {
      for (const line of part.split('\n')) {
        const trimmed = line.trim()
        if (!trimmed.startsWith('data:')) continue
        const data = trimmed.slice(5).trim()
        if (!data) continue
        try {
          yield JSON.parse(data) as StreamChunk
        } catch {
          /* ignore malformed */
        }
      }
    }
  }
}

export function useSpeakingLive() {
  const [turns, setTurns] = useState<LiveTurn[]>([])
  const [status, setStatus] = useState<Status>('idle')
  const [error, setError] = useState<string | null>(null)
  const [providerMeta, setProviderMeta] = useState<{ provider: string; model: string } | null>(null)

  const abortRef = useRef<AbortController | null>(null)
  const historyRef = useRef<ChatMessage[]>([])

  const stop = useCallback(() => {
    abortRef.current?.abort()
    abortRef.current = null
    setStatus((s) => (s === 'streaming' || s === 'connecting' ? 'idle' : s))
    setTurns((prev) =>
      prev.map((t) => (t.streaming ? { ...t, streaming: false } : t))
    )
  }, [])

  const reset = useCallback(() => {
    stop()
    historyRef.current = []
    setTurns([])
    setError(null)
    setStatus('idle')
    setProviderMeta(null)
  }, [stop])

  const send = useCallback(async (userText: string) => {
    const content = userText.trim()
    if (!content) return

    abortRef.current?.abort()
    const ac = new AbortController()
    abortRef.current = ac

    const userMsg: ChatMessage = { role: 'user', content }
    historyRef.current = [...historyRef.current, userMsg]

    const assistantId = uid()
    setError(null)
    setStatus('connecting')
    setTurns((prev) => [
      ...prev,
      { id: uid(), role: 'user', content },
      { id: assistantId, role: 'assistant', content: '', streaming: true },
    ])

    try {
      const res = await fetch('/api/speaking/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: historyRef.current }),
        signal: ac.signal,
      })

      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}))
        throw new Error(errBody.detail || errBody.error || `HTTP ${res.status}`)
      }

      setProviderMeta({
        provider: res.headers.get('X-Speaking-Provider') ?? 'unknown',
        model: res.headers.get('X-Speaking-Model') ?? '',
      })
      setStatus('streaming')

      let full = ''
      for await (const chunk of readSse(res)) {
        if (chunk.type === 'token') {
          full += chunk.content
          const snapshot = full
          setTurns((prev) =>
            prev.map((t) =>
              t.id === assistantId ? { ...t, content: snapshot, streaming: true } : t
            )
          )
        } else if (chunk.type === 'error') {
          throw new Error(chunk.error)
        } else if (chunk.type === 'done') {
          break
        }
      }

      historyRef.current = [
        ...historyRef.current,
        { role: 'assistant', content: full },
      ]

      setTurns((prev) =>
        prev.map((t) =>
          t.id === assistantId ? { ...t, content: full, streaming: false } : t
        )
      )
      setStatus('idle')
    } catch (err) {
      if (ac.signal.aborted) {
        setStatus('idle')
        return
      }
      const message = err instanceof Error ? err.message : 'Konuşma hatası'
      setError(message)
      setStatus('error')
      setTurns((prev) =>
        prev.map((t) =>
          t.id === assistantId
            ? {
                ...t,
                content: t.content || 'Yanıt alınamadı.',
                streaming: false,
              }
            : t
        )
      )
      // Roll back last user message from history if no assistant reply stored
      historyRef.current = historyRef.current.filter(
        (m, i, arr) => !(i === arr.length - 1 && m.role === 'user' && m.content === content)
      )
    } finally {
      if (abortRef.current === ac) abortRef.current = null
    }
  }, [])

  const startSession = useCallback(async () => {
    reset()
    // Kick off coach greeting without showing the starter as a user bubble
    abortRef.current?.abort()
    const ac = new AbortController()
    abortRef.current = ac

    const assistantId = uid()
    setError(null)
    setStatus('connecting')
    setTurns([{ id: assistantId, role: 'assistant', content: '', streaming: true }])

    const seed: ChatMessage[] = [{ role: 'user', content: SPEAKING_STARTER_PROMPT }]

    try {
      const res = await fetch('/api/speaking/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: seed }),
        signal: ac.signal,
      })

      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}))
        throw new Error(errBody.detail || errBody.error || `HTTP ${res.status}`)
      }

      setProviderMeta({
        provider: res.headers.get('X-Speaking-Provider') ?? 'unknown',
        model: res.headers.get('X-Speaking-Model') ?? '',
      })
      setStatus('streaming')

      let full = ''
      for await (const chunk of readSse(res)) {
        if (chunk.type === 'token') {
          full += chunk.content
          const snapshot = full
          setTurns((prev) =>
            prev.map((t) =>
              t.id === assistantId ? { ...t, content: snapshot, streaming: true } : t
            )
          )
        } else if (chunk.type === 'error') {
          throw new Error(chunk.error)
        } else if (chunk.type === 'done') {
          break
        }
      }

      historyRef.current = [{ role: 'assistant', content: full }]
      setTurns([{ id: assistantId, role: 'assistant', content: full, streaming: false }])
      setStatus('idle')
    } catch (err) {
      if (ac.signal.aborted) {
        setStatus('idle')
        return
      }
      const message = err instanceof Error ? err.message : 'Oturum başlatılamadı'
      setError(message)
      setStatus('error')
      setTurns([])
    } finally {
      if (abortRef.current === ac) abortRef.current = null
    }
  }, [reset])

  return {
    turns,
    status,
    error,
    providerMeta,
    send,
    stop,
    reset,
    startSession,
    isBusy: status === 'connecting' || status === 'streaming',
  }
}

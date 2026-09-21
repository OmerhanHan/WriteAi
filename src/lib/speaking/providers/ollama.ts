import type { ChatMessage, StreamChunk } from '../types'
import type { SpeakingProvider } from './types'

type OllamaChatChunk = {
  message?: { content?: string }
  done?: boolean
  error?: string
}

export function createOllamaProvider(opts: {
  baseUrl: string
  model: string
}): SpeakingProvider {
  const baseUrl = opts.baseUrl.replace(/\/$/, '')

  return {
    id: 'ollama',

    async *streamChat(
      messages: ChatMessage[],
      options?: { signal?: AbortSignal }
    ): AsyncGenerator<StreamChunk, void, unknown> {
      let res: Response
      try {
        res = await fetch(`${baseUrl}/api/chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: opts.model,
            messages,
            stream: true,
          }),
          signal: options?.signal,
        })
      } catch (err) {
        yield {
          type: 'error',
          error:
            err instanceof Error
              ? `Ollama bağlantısı kurulamadı: ${err.message}`
              : 'Ollama bağlantısı kurulamadı',
        }
        return
      }

      if (!res.ok || !res.body) {
        const detail = await res.text().catch(() => '')
        yield {
          type: 'error',
          error: `Ollama hatası (${res.status}): ${detail || res.statusText}`,
        }
        return
      }

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      try {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          buffer += decoder.decode(value, { stream: true })
          const lines = buffer.split('\n')
          buffer = lines.pop() ?? ''

          for (const line of lines) {
            const trimmed = line.trim()
            if (!trimmed) continue

            let chunk: OllamaChatChunk
            try {
              chunk = JSON.parse(trimmed) as OllamaChatChunk
            } catch {
              continue
            }

            if (chunk.error) {
              yield { type: 'error', error: chunk.error }
              return
            }

            const token = chunk.message?.content
            if (token) yield { type: 'token', content: token }

            if (chunk.done) {
              yield { type: 'done' }
              return
            }
          }
        }

        if (buffer.trim()) {
          try {
            const chunk = JSON.parse(buffer.trim()) as OllamaChatChunk
            if (chunk.message?.content) {
              yield { type: 'token', content: chunk.message.content }
            }
          } catch {
            /* ignore trailing partial */
          }
        }

        yield { type: 'done' }
      } catch (err) {
        if (options?.signal?.aborted) {
          yield { type: 'done' }
          return
        }
        yield {
          type: 'error',
          error: err instanceof Error ? err.message : 'Stream okuma hatası',
        }
      }
    },
  }
}

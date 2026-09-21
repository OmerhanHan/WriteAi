import type { ChatMessage, StreamChunk } from '../types'
import type { SpeakingProvider } from './types'

/**
 * OpenAI-compatible chat provider (ready for when OPENAI_API_KEY is set).
 * Not used while SPEAKING_PROVIDER=ollama.
 */
export function createOpenAIProvider(opts: {
  apiKey: string | null
  model: string
  baseUrl: string
}): SpeakingProvider {
  return {
    id: 'openai',

    async *streamChat(
      messages: ChatMessage[],
      options?: { signal?: AbortSignal }
    ): AsyncGenerator<StreamChunk, void, unknown> {
      if (!opts.apiKey) {
        yield {
          type: 'error',
          error: 'OPENAI_API_KEY tanımlı değil. Şimdilik SPEAKING_PROVIDER=ollama kullan.',
        }
        return
      }

      const baseUrl = opts.baseUrl.replace(/\/$/, '')
      let res: Response
      try {
        res = await fetch(`${baseUrl}/chat/completions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${opts.apiKey}`,
          },
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
          error: err instanceof Error ? err.message : 'OpenAI bağlantı hatası',
        }
        return
      }

      if (!res.ok || !res.body) {
        const detail = await res.text().catch(() => '')
        yield {
          type: 'error',
          error: `OpenAI hatası (${res.status}): ${detail || res.statusText}`,
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
          const parts = buffer.split('\n')
          buffer = parts.pop() ?? ''

          for (const part of parts) {
            const line = part.trim()
            if (!line.startsWith('data:')) continue
            const data = line.slice(5).trim()
            if (data === '[DONE]') {
              yield { type: 'done' }
              return
            }

            try {
              const json = JSON.parse(data) as {
                choices?: Array<{ delta?: { content?: string } }>
              }
              const token = json.choices?.[0]?.delta?.content
              if (token) yield { type: 'token', content: token }
            } catch {
              continue
            }
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
          error: err instanceof Error ? err.message : 'OpenAI stream hatası',
        }
      }
    },
  }
}

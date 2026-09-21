import type { ChatMessage, StreamChunk } from '../types'
import type { SpeakingProvider } from './types'

/**
 * Gemini streaming provider stub — wired for when GOOGLE_AI_API_KEY is used for speaking.
 * Not used while SPEAKING_PROVIDER=ollama.
 */
export function createGeminiProvider(opts: {
  apiKey: string | null
  model: string
}): SpeakingProvider {
  return {
    id: 'gemini',

    async *streamChat(
      _messages: ChatMessage[],
      _options?: { signal?: AbortSignal }
    ): AsyncGenerator<StreamChunk, void, unknown> {
      if (!opts.apiKey) {
        yield {
          type: 'error',
          error: 'GOOGLE_AI_API_KEY tanımlı değil. Şimdilik SPEAKING_PROVIDER=ollama kullan.',
        }
        return
      }

      // Architecture placeholder: swap to @google/generative-ai streaming when enabled.
      yield {
        type: 'error',
        error:
          'Gemini speaking provider henüz aktif değil. SPEAKING_PROVIDER=ollama ile devam et veya openai/gemini implementasyonunu tamamla.',
      }
    },
  }
}

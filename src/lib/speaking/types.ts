export type ChatRole = 'system' | 'user' | 'assistant'

export type ChatMessage = {
  role: ChatRole
  content: string
}

export type StreamChunk =
  | { type: 'token'; content: string }
  | { type: 'done' }
  | { type: 'error'; error: string }

export type SpeakingProviderId = 'ollama' | 'openai' | 'gemini'

export type SpeakingConfig = {
  provider: SpeakingProviderId
  ollama: {
    baseUrl: string
    model: string
  }
  openai: {
    apiKey: string | null
    model: string
    baseUrl: string
  }
  gemini: {
    apiKey: string | null
    model: string
  }
}

import type { SpeakingConfig, SpeakingProviderId } from './types'

function env(name: string, fallback?: string): string | undefined {
  const value = process.env[name]
  if (value === undefined || value === '') return fallback
  return value
}

export function getSpeakingConfig(): SpeakingConfig {
  const provider = (env('SPEAKING_PROVIDER', 'ollama') ?? 'ollama') as SpeakingProviderId

  return {
    provider,
    ollama: {
      baseUrl: env('OLLAMA_BASE_URL', 'http://127.0.0.1:11434')!,
      model: env('OLLAMA_SPEAKING_MODEL', 'gemma4:e4b')!,
    },
    openai: {
      apiKey: env('OPENAI_API_KEY') ?? null,
      model: env('OPENAI_SPEAKING_MODEL', 'gpt-4o-mini')!,
      baseUrl: env('OPENAI_BASE_URL', 'https://api.openai.com/v1')!,
    },
    gemini: {
      apiKey: env('GOOGLE_AI_API_KEY') ?? null,
      model: env('GEMINI_SPEAKING_MODEL', 'gemini-2.0-flash')!,
    },
  }
}

import { getSpeakingConfig } from '../config'
import { createGeminiProvider } from './gemini'
import { createOllamaProvider } from './ollama'
import { createOpenAIProvider } from './openai'
import type { SpeakingProvider } from './types'

export function getSpeakingProvider(): SpeakingProvider {
  const config = getSpeakingConfig()

  switch (config.provider) {
    case 'openai':
      return createOpenAIProvider(config.openai)
    case 'gemini':
      return createGeminiProvider(config.gemini)
    case 'ollama':
    default:
      return createOllamaProvider(config.ollama)
  }
}

export type { SpeakingProvider }

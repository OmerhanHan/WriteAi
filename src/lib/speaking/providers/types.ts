import type { ChatMessage, StreamChunk } from '../types'

export interface SpeakingProvider {
  readonly id: string
  streamChat(
    messages: ChatMessage[],
    options?: { signal?: AbortSignal }
  ): AsyncGenerator<StreamChunk, void, unknown>
}

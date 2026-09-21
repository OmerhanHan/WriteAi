export type TtsResult = {
  audio: Buffer
  contentType: 'audio/wav' | 'audio/mpeg' | 'audio/aac'
  provider: string
  model: string
}

export interface TtsProvider {
  readonly id: string
  synthesize(text: string, options?: { signal?: AbortSignal }): Promise<TtsResult>
}

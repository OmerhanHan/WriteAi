import type { StreamChunk } from './types'

export function streamChunksToSse(
  chunks: AsyncIterable<StreamChunk>,
  signal?: AbortSignal
): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder()

  return new ReadableStream({
    async start(controller) {
      const send = (chunk: StreamChunk) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(chunk)}\n\n`))
      }

      try {
        for await (const chunk of chunks) {
          if (signal?.aborted) break
          send(chunk)
          if (chunk.type === 'done' || chunk.type === 'error') break
        }
      } catch (err) {
        send({
          type: 'error',
          error: err instanceof Error ? err.message : 'Beklenmeyen stream hatası',
        })
      } finally {
        try {
          controller.close()
        } catch {
          /* already closed */
        }
      }
    },
    cancel() {
      /* client disconnected */
    },
  })
}

export const SSE_HEADERS = {
  'Content-Type': 'text/event-stream; charset=utf-8',
  'Cache-Control': 'no-cache, no-transform',
  Connection: 'keep-alive',
  'X-Accel-Buffering': 'no',
} as const

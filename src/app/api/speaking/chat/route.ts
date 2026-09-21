import { NextRequest, NextResponse } from 'next/server'
import { getSpeakingConfig } from '@/lib/speaking/config'
import { SPEAKING_SYSTEM_PROMPT } from '@/lib/speaking/prompts'
import { getSpeakingProvider } from '@/lib/speaking/providers'
import { SSE_HEADERS, streamChunksToSse } from '@/lib/speaking/sse'
import type { ChatMessage } from '@/lib/speaking/types'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type Body = {
  messages?: Array<{ role?: string; content?: string }>
}

function isRole(value: unknown): value is ChatMessage['role'] {
  return value === 'system' || value === 'user' || value === 'assistant'
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as Body
    const incoming = Array.isArray(body.messages) ? body.messages : []

    const messages: ChatMessage[] = incoming
      .filter((m) => isRole(m.role) && typeof m.content === 'string' && m.content.trim())
      .map((m) => ({
        role: m.role as ChatMessage['role'],
        content: (m.content as string).trim(),
      }))

    if (messages.length === 0) {
      return NextResponse.json({ error: 'messages required' }, { status: 400 })
    }

    const withSystem: ChatMessage[] =
      messages[0]?.role === 'system'
        ? messages
        : [{ role: 'system', content: SPEAKING_SYSTEM_PROMPT }, ...messages]

    const config = getSpeakingConfig()
    const provider = getSpeakingProvider()
    const stream = streamChunksToSse(
      provider.streamChat(withSystem, { signal: req.signal }),
      req.signal
    )

    return new Response(stream, {
      headers: {
        ...SSE_HEADERS,
        'X-Speaking-Provider': provider.id,
        'X-Speaking-Model':
          config.provider === 'ollama'
            ? config.ollama.model
            : config.provider === 'openai'
              ? config.openai.model
              : config.gemini.model,
      },
    })
  } catch (err) {
    console.error('[speaking/chat]', err)
    return NextResponse.json(
      {
        error: 'Speaking chat failed',
        detail: err instanceof Error ? err.message : String(err),
      },
      { status: 500 }
    )
  }
}

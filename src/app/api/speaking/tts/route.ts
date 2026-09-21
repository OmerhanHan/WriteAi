import { NextRequest, NextResponse } from 'next/server'
import { getTtsConfig, synthesizeWithFallback } from '@/lib/speaking/tts'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type Body = {
  text?: string
  provider?: string
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as Body
    const text = typeof body.text === 'string' ? body.text.trim() : ''
    const config = getTtsConfig()

    if (!text) {
      return NextResponse.json({ error: 'text required' }, { status: 400 })
    }

    if (text.length > config.maxChars) {
      return NextResponse.json(
        { error: `text too long (max ${config.maxChars})` },
        { status: 400 }
      )
    }

    const prefer =
      body.provider === 'piper' ||
      body.provider === 'macos' ||
      body.provider === 'openai'
        ? body.provider
        : undefined

    const result = await synthesizeWithFallback(text, {
      signal: req.signal,
      prefer,
    })

    return new NextResponse(new Uint8Array(result.audio), {
      status: 200,
      headers: {
        'Content-Type': result.contentType,
        'Cache-Control': 'no-store',
        'X-TTS-Provider': result.provider,
        'X-TTS-Model': result.model,
      },
    })
  } catch (err) {
    console.error('[speaking/tts]', err)
    return NextResponse.json(
      {
        error: 'TTS failed',
        detail: err instanceof Error ? err.message : String(err),
      },
      { status: 500 }
    )
  }
}

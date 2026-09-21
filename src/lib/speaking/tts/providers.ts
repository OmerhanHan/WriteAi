import { spawn } from 'child_process'
import { access } from 'fs/promises'
import { constants } from 'fs'
import { tmpdir } from 'os'
import path from 'path'
import { randomBytes } from 'crypto'
import { readFile, unlink, writeFile } from 'fs/promises'
import type { TtsProvider, TtsResult } from './types'

async function fileExists(p: string) {
  try {
    await access(p, constants.R_OK)
    return true
  } catch {
    return false
  }
}

function run(
  cmd: string,
  args: string[],
  opts: { input?: string; signal?: AbortSignal; env?: NodeJS.ProcessEnv } = {}
): Promise<{ stdout: Buffer; stderr: string; code: number }> {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, {
      env: { ...process.env, ...opts.env },
      stdio: ['pipe', 'pipe', 'pipe'],
    })

    const chunks: Buffer[] = []
    let stderr = ''

    const onAbort = () => {
      child.kill('SIGTERM')
      reject(new Error('TTS iptal edildi'))
    }
    opts.signal?.addEventListener('abort', onAbort, { once: true })

    child.stdout.on('data', (d: Buffer) => chunks.push(d))
    child.stderr.on('data', (d: Buffer) => {
      stderr += d.toString()
    })
    child.on('error', (err) => {
      opts.signal?.removeEventListener('abort', onAbort)
      reject(err)
    })
    child.on('close', (code) => {
      opts.signal?.removeEventListener('abort', onAbort)
      resolve({ stdout: Buffer.concat(chunks), stderr, code: code ?? 1 })
    })

    if (opts.input !== undefined) {
      child.stdin.write(opts.input)
    }
    child.stdin.end()
  })
}

export function createPiperProvider(opts: {
  bin: string
  modelPath: string
}): TtsProvider {
  return {
    id: 'piper',

    async synthesize(text: string, options?: { signal?: AbortSignal }): Promise<TtsResult> {
      const modelPath = opts.modelPath
      if (!(await fileExists(modelPath))) {
        throw new Error(
          `Piper model bulunamadı: ${modelPath}. scripts/download-piper-voice.sh çalıştır.`
        )
      }

      const id = randomBytes(8).toString('hex')
      const outPath = path.join(tmpdir(), `writer-tts-${id}.wav`)

      try {
        // Prefer CLI: echo text | piper --model MODEL --output_file OUT
        const result = await run(
          opts.bin,
          ['--model', modelPath, '--output_file', outPath],
          { input: text, signal: options?.signal }
        )

        if (result.code !== 0) {
          throw new Error(result.stderr.trim() || `piper exit ${result.code}`)
        }

        const audio = await readFile(outPath)
        if (!audio.length) throw new Error('Piper boş ses üretti')

        return {
          audio,
          contentType: 'audio/wav',
          provider: 'piper',
          model: path.basename(modelPath),
        }
      } finally {
        await unlink(outPath).catch(() => undefined)
      }
    },
  }
}

export function createMacosSayProvider(opts: {
  voice: string
  rate: number
}): TtsProvider {
  return {
    id: 'macos',

    async synthesize(text: string, options?: { signal?: AbortSignal }): Promise<TtsResult> {
      const id = randomBytes(8).toString('hex')
      const aiffPath = path.join(tmpdir(), `writer-tts-${id}.aiff`)
      const wavPath = path.join(tmpdir(), `writer-tts-${id}.wav`)

      try {
        // Write text to temp file to avoid shell injection via args edge cases
        const txtPath = path.join(tmpdir(), `writer-tts-${id}.txt`)
        await writeFile(txtPath, text, 'utf8')

        const say = await run(
          'say',
          ['-v', opts.voice, '-r', String(opts.rate), '-f', txtPath, '-o', aiffPath],
          { signal: options?.signal }
        )
        await unlink(txtPath).catch(() => undefined)

        if (say.code !== 0) {
          throw new Error(say.stderr.trim() || `say exit ${say.code}`)
        }

        const conv = await run(
          'afconvert',
          ['-f', 'WAVE', '-d', 'LEI16', aiffPath, wavPath],
          { signal: options?.signal }
        )
        if (conv.code !== 0) {
          throw new Error(conv.stderr.trim() || `afconvert exit ${conv.code}`)
        }

        const audio = await readFile(wavPath)
        return {
          audio,
          contentType: 'audio/wav',
          provider: 'macos',
          model: opts.voice,
        }
      } finally {
        await unlink(aiffPath).catch(() => undefined)
        await unlink(wavPath).catch(() => undefined)
      }
    },
  }
}

export function createOpenAiTtsProvider(opts: {
  apiKey: string | null
  model: string
  voice: string
}): TtsProvider {
  return {
    id: 'openai',

    async synthesize(text: string, options?: { signal?: AbortSignal }): Promise<TtsResult> {
      if (!opts.apiKey) {
        throw new Error('OPENAI_API_KEY yok. Şimdilik TTS_PROVIDER=piper veya macos kullan.')
      }

      const res = await fetch('https://api.openai.com/v1/audio/speech', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${opts.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: opts.model,
          voice: opts.voice,
          input: text,
          response_format: 'wav',
        }),
        signal: options?.signal,
      })

      if (!res.ok) {
        const detail = await res.text().catch(() => '')
        throw new Error(`OpenAI TTS (${res.status}): ${detail || res.statusText}`)
      }

      const audio = Buffer.from(await res.arrayBuffer())
      return {
        audio,
        contentType: 'audio/wav',
        provider: 'openai',
        model: opts.model,
      }
    },
  }
}

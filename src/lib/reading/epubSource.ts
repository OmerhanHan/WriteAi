import type { EpubSource } from './types'

/**
 * Resolves an EPUB source to a URL the browser can fetch.
 * Today: local files under /public/epubs.
 * Later: set NEXT_PUBLIC_EPUB_STORAGE=supabase and use kind: 'storage'.
 */
export async function resolveEpubUrl(source: EpubSource): Promise<string> {
  if (source.kind === 'local') {
    return source.path.startsWith('/') ? source.path : `/${source.path}`
  }

  // Future: Supabase Storage (or any signed-URL provider)
  const { createClient } = await import('@/lib/supabase')
  const supabase = createClient()
  const { data, error } = await supabase.storage
    .from(source.bucket)
    .createSignedUrl(source.path, 60 * 60) // 1 hour

  if (error || !data?.signedUrl) {
    throw new Error(error?.message ?? 'Could not resolve EPUB from storage')
  }
  return data.signedUrl
}

/** Helper to build a local public path. */
export function localEpub(filename: string): EpubSource {
  return { kind: 'local', path: `/epubs/${filename}` }
}

/** Helper for future Supabase Storage entries. */
export function storageEpub(path: string, bucket = 'epubs'): EpubSource {
  return { kind: 'storage', bucket, path }
}

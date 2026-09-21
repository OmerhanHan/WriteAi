import type { Writing, Feedback } from './supabase'

// LocalStorage-based storage (no Supabase needed for prototype)
const WRITINGS_KEY = 'writer_writings'
const PROFILE_KEY = 'writer_profile'

export function getWritings(): Writing[] {
  if (typeof window === 'undefined') return []
  try {
    return JSON.parse(localStorage.getItem(WRITINGS_KEY) || '[]')
  } catch { return [] }
}

export function getWritingById(id: string): Writing | null {
  return getWritings().find(w => w.id === id) || null
}

export function saveWriting(writing: Omit<Writing, 'id' | 'created_at'>): Writing {
  const writings = getWritings()
  const newWriting: Writing = {
    ...writing,
    id: `writing-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    created_at: new Date().toISOString(),
  }
  writings.unshift(newWriting)
  localStorage.setItem(WRITINGS_KEY, JSON.stringify(writings))
  return newWriting
}

export function updateWritingFeedback(writingId: string, feedback: Feedback): void {
  const writings = getWritings()
  const idx = writings.findIndex(w => w.id === writingId)
  if (idx !== -1) {
    writings[idx].has_feedback = true
    writings[idx].feedback = { ...feedback, writing_id: writingId }
    localStorage.setItem(WRITINGS_KEY, JSON.stringify(writings))
  }
}

export function getProfile() {
  if (typeof window === 'undefined') return null
  try {
    return JSON.parse(localStorage.getItem(PROFILE_KEY) || 'null')
  } catch { return null }
}

export function setProfile(profile: { name: string; email: string }) {
  localStorage.setItem(PROFILE_KEY, JSON.stringify(profile))
}

export function getStats() {
  const writings = getWritings()
  const totalWords = writings.reduce((acc, w) => acc + (w.word_count || 0), 0)
  const withFeedback = writings.filter(w => w.has_feedback && w.feedback)
  const avgBand = withFeedback.length
    ? withFeedback.reduce((acc, w) => acc + (w.feedback?.band_score || 0), 0) / withFeedback.length
    : 0

  // Calculate streak
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  let streak = 0
  let checkDate = new Date(today)
  const dateSets = new Set(writings.map(w => {
    const d = new Date(w.created_at)
    d.setHours(0, 0, 0, 0)
    return d.toISOString()
  }))
  while (dateSets.has(checkDate.toISOString())) {
    streak++
    checkDate.setDate(checkDate.getDate() - 1)
  }

  return {
    totalWritings: writings.length,
    totalWords,
    avgBandScore: Math.round(avgBand * 10) / 10,
    lastStudied: writings[0]?.created_at || null,
    streak,
  }
}

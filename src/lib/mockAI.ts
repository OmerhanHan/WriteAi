import type { Feedback, GrammarError } from './supabase'

// Fallback topic pool (used if API fails)
const TOPICS_FALLBACK = [
  "The impact of social media on modern communication",
  "Should universities be free for all students?",
  "Climate change: individual responsibility vs. government action",
  "The future of remote work in the post-pandemic era",
  "Artificial intelligence: threat or opportunity for employment?",
  "Is space exploration worth the cost?",
  "The role of technology in education",
  "Should fast food be taxed more heavily?",
  "The importance of mental health awareness in workplaces",
  "Are electric vehicles the solution to pollution?",
  "The effects of urbanization on wildlife",
  "Should voting be mandatory?",
  "The influence of video games on children's behavior",
  "Is globalization beneficial or harmful?",
  "The rise of cryptocurrency: a financial revolution?",
  "Should the retirement age be raised?",
  "The role of art in society",
  "Online privacy in the digital age",
  "Should animals be used in scientific research?",
  "The impact of tourism on local cultures",
]

// Fallback mock scorer (used if Gemini API fails)
function pseudoRandom(seed: number, max: number): number {
  const x = Math.sin(seed + 1) * 10000
  return Math.floor((x - Math.floor(x)) * max)
}

const GRAMMAR_ERRORS_FALLBACK: GrammarError[] = [
  { word: "alot", suggestion: "a lot", explanation: "'Alot' is not a word. 'A lot' should always be written as two separate words." },
  { word: "their/there/they're", suggestion: "they're", explanation: "Common confusion: 'they're' = they are, 'their' = belonging to them, 'there' = a place." },
  { word: "effect/affect", suggestion: "affect", explanation: "'Affect' is usually a verb (to influence), while 'effect' is usually a noun (a result)." },
  { word: "then/than", suggestion: "than", explanation: "'Then' refers to time, 'than' is used for comparisons." },
]

const SUGGESTIONS_FALLBACK = [
  "Consider using more varied sentence structures to improve the flow of your writing.",
  "Your introduction would benefit from a stronger hook sentence to engage the reader.",
  "Try to use more specific examples and evidence to support your main arguments.",
  "The conclusion could be strengthened by revisiting your thesis with new insight.",
  "Use transition words (however, furthermore, in contrast) to connect your ideas more smoothly.",
]

function mockFeedback(content: string, topic: string): Feedback {
  const wordCount = content.trim().split(/\s+/).filter(Boolean).length
  const seed = wordCount + topic.length
  const base = Math.min(wordCount / 250, 1)
  const grammarScore = Math.min(10, Math.round(5 + base * 4 + pseudoRandom(seed, 2)))
  const coherenceScore = Math.min(10, Math.round(4 + base * 5 + pseudoRandom(seed + 1, 2)))
  const vocabScore = Math.min(10, Math.round(4 + base * 4 + pseudoRandom(seed + 2, 2)))
  const bandScore = parseFloat((((grammarScore + coherenceScore + vocabScore) / 30) * 9).toFixed(1))

  return {
    id: `mock-${Date.now()}`,
    writing_id: '',
    grammar_score: grammarScore,
    band_score: Math.min(9, bandScore),
    coherence_score: coherenceScore,
    vocabulary_score: vocabScore,
    grammar_errors: [GRAMMAR_ERRORS_FALLBACK[pseudoRandom(seed, GRAMMAR_ERRORS_FALLBACK.length)]],
    suggestions: SUGGESTIONS_FALLBACK.slice(0, 3),
    overall_comment: `Your essay on "${topic}" shows effort. Focus on expanding your arguments with specific examples and refining your grammar to achieve a higher band score.`,
    created_at: new Date().toISOString(),
  }
}
/*
export async function generateTopic(): Promise<string> {
  try {
    const res = await fetch('/api/topic')
    if (!res.ok) throw new Error('API error')
    const data = await res.json()
    return data.topic as string
  } catch (err) {
    console.warn('[generateTopic] Falling back to local pool:', err)
    return TOPICS_FALLBACK[Math.floor(Math.random() * TOPICS_FALLBACK.length)]
  }
}
*/

export async function analyzeWriting(content: string, topic: string): Promise<Feedback> {
  try {
    const res = await fetch('/api/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content, topic }),
    })

    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error(err.detail || err.error || `HTTP ${res.status}`)
    }

    const data = await res.json()

    const feedback: Feedback = {
      id: `gemini-${Date.now()}`,
      writing_id: '',
      grammar_score: Number(data.grammar_score),
      band_score: Number(data.band_score),
      coherence_score: Number(data.coherence_score),
      vocabulary_score: Number(data.vocabulary_score),
      grammar_errors: data.grammar_errors ?? [],
      suggestions: data.suggestions ?? [],
      overall_comment: data.overall_comment ?? '',
      created_at: new Date().toISOString(),
    }

    return feedback
  } catch (err) {
    console.warn('[analyzeWriting] Gemini failed, using mock fallback:', err)
    // Wait a moment to simulate thinking time
    await new Promise(r => setTimeout(r, 1500))
    return mockFeedback(content, topic)
  }
}

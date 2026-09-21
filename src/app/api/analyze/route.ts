import { GoogleGenerativeAI } from '@google/generative-ai'
import { NextRequest, NextResponse } from 'next/server'

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY!)

const SYSTEM_PROMPT = `You are an expert IELTS Writing examiner and English language teacher.
Analyze the given essay and return ONLY a valid JSON object with no markdown, no code fences, no extra text.

The JSON must have exactly this shape:
{
  "grammar_score": <integer 0-10>,
  "coherence_score": <integer 0-10>,
  "vocabulary_score": <integer 0-10>,
  "band_score": <float 0.0-9.0, one decimal>,
  "grammar_errors": [
    { "word": "<problematic word or phrase>", "suggestion": "<corrected form>", "explanation": "<brief explanation>" }
  ],
  "suggestions": [
    "<actionable improvement suggestion>"
  ],
  "overall_comment": "<2-3 sentence overall assessment in English>"
}

Scoring guide:
- grammar_score: 10 = flawless, 7-9 = minor errors, 4-6 = noticeable errors, 0-3 = severe errors
- coherence_score: 10 = perfect flow and structure, 7-9 = well-structured, 4-6 = some structural issues, 0-3 = poor organization
- vocabulary_score: 10 = sophisticated academic vocabulary, 7-9 = good range, 4-6 = limited but functional, 0-3 = very basic
- band_score: calculate based on IELTS band descriptors (Task Achievement, Coherence, Lexical Resource, Grammatical Range)
- grammar_errors: list 1-4 actual errors found in the text (or an empty array if none)
- suggestions: list exactly 3-5 concrete, specific improvement tips
- overall_comment: honest, encouraging, specific to this essay

IMPORTANT: Return raw JSON only. No markdown. No explanation outside the JSON.`

export async function POST(req: NextRequest) {
  try {
    const { content, topic } = await req.json()

    if (!content || !topic) {
      return NextResponse.json({ error: 'content and topic are required' }, { status: 400 })
    }

    if (!process.env.GOOGLE_AI_API_KEY) {
      return NextResponse.json({ error: 'GOOGLE_AI_API_KEY is not configured' }, { status: 500 })
    }

    const model = genAI.getGenerativeModel({
      model: 'gemini-1.5-flash',
      systemInstruction: SYSTEM_PROMPT,
    })

    const prompt = `Topic: "${topic}"

Essay:
${content}`

    const result = await model.generateContent(prompt)
    const text = result.response.text().trim()

    // Strip any accidental markdown fences
    const cleaned = text
      .replace(/^```json\s*/i, '')
      .replace(/^```\s*/i, '')
      .replace(/```\s*$/i, '')
      .trim()

    const feedback = JSON.parse(cleaned)

    // Validate required fields
    const required = ['grammar_score', 'coherence_score', 'vocabulary_score', 'band_score', 'grammar_errors', 'suggestions', 'overall_comment']
    for (const field of required) {
      if (feedback[field] === undefined) {
        throw new Error(`Missing field: ${field}`)
      }
    }

    return NextResponse.json(feedback)
  } catch (err) {
    console.error('[analyze] Error:', err)
    return NextResponse.json(
      { error: 'Analysis failed', detail: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    )
  }
}

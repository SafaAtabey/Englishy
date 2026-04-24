import { Router } from 'express'
import Anthropic from '@anthropic-ai/sdk'

const router = Router()
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

// POST /api/writing/feedback  — full essay feedback
router.post('/feedback', async (req, res) => {
  const { text, level } = req.body
  if (!text || !level) return res.status(400).json({ error: 'text and level required' })
  if (text.length > 5000) return res.status(400).json({ error: 'Text too long (max 5000 chars)' })

  try {
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 2048,
      system: 'You are an English language teacher. Always respond with valid JSON only, no markdown.',
      messages: [{
        role: 'user',
        content: `You are reviewing a ${level} student's writing. Student's text: "${text}"

Provide feedback in this exact JSON format:
{
  "score": <0-100 integer>,
  "grammar_errors": [{"error": "...", "correction": "...", "explanation": "..."}],
  "vocabulary_suggestions": [{"original": "...", "better": "..."}],
  "structure_feedback": "...",
  "positive_highlights": ["...", "..."],
  "corrected_text": "..."
}

Keep feedback encouraging and appropriate for ${level} level. Return only JSON.`,
      }],
    })

    const content = message.content[0]
    if (content.type !== 'text') throw new Error('Unexpected response')
    const jsonMatch = content.text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) throw new Error('No JSON in response')
    res.json(JSON.parse(jsonMatch[0]))
  } catch (err) {
    console.error('[writing/feedback]', err)
    res.status(500).json({ error: 'Failed to generate feedback' })
  }
})

// POST /api/writing/grade-sentence  — single sentence grading for Targeted Practice
router.post('/grade-sentence', async (req, res) => {
  const { word, sentence, level } = req.body
  if (!word || !sentence || !level) return res.status(400).json({ error: 'word, sentence, and level required' })
  if (sentence.length > 500) return res.status(400).json({ error: 'Sentence too long' })

  try {
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 256,
      system: 'You are an English teacher grading a single sentence. Respond only with valid JSON.',
      messages: [{
        role: 'user',
        content: `A ${level} English learner wrote this sentence using the word "${word}":
"${sentence}"

Grade it and return JSON:
{
  "correct": <true if word is used correctly and sentence is grammatical>,
  "grade": <"correct" | "grammar" | "wrong">,
  "feedback": <one encouraging sentence explaining the grade, max 30 words>
}

- "correct": word used correctly, sentence grammatical
- "grammar": word used correctly but sentence has grammar issues
- "wrong": word used incorrectly or meaning is wrong`,
      }],
    })

    const content = message.content[0]
    if (content.type !== 'text') throw new Error('Unexpected response')
    const jsonMatch = content.text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) throw new Error('No JSON')
    res.json(JSON.parse(jsonMatch[0]))
  } catch {
    res.status(500).json({ error: 'Failed to grade sentence' })
  }
})

export default router

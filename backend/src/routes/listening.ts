import { Router } from 'express'
import Anthropic from '@anthropic-ai/sdk'

const router = Router()
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

// POST /api/listening/generate
router.post('/generate', async (req, res) => {
  const { level } = req.body
  if (!level) return res.status(400).json({ error: 'level required' })

  try {
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 2048,
      system: 'You are an English listening comprehension exercise creator for Turkish learners. Respond only with valid JSON.',
      messages: [{
        role: 'user',
        content: `Create 3 listening exercises for a ${level} English learner. Mix the types.

Return ONLY a valid JSON array of 3 exercises:
[
  {
    "id": 1,
    "type": "fill-blank",
    "level": "${level}",
    "title": "...",
    "audioText": "...(full sentence to be read aloud)...",
    "transcript": "...(same sentence but with one word replaced by ___)...",
    "answer": "...(the missing word)",
    "options": ["...", "...(correct)", "...", "..."]
  },
  {
    "id": 2,
    "type": "true-false",
    "level": "${level}",
    "title": "...",
    "audioText": "...(2-3 sentences about a topic)...",
    "transcript": "...(same as audioText)...",
    "question": "...(a statement that is either true or false based on the audio)...",
    "answer": <true or false>
  },
  {
    "id": 3,
    "type": "dictation",
    "level": "${level}",
    "title": "...",
    "audioText": "...(one clear sentence)...",
    "transcript": "",
    "targetSentence": "...(exact same sentence as audioText)"
  }
]

Make content interesting and level-appropriate for ${level}. No markdown, only JSON array.`,
      }],
    })

    const content = message.content[0]
    if (content.type !== 'text') throw new Error('Unexpected response')
    const jsonMatch = content.text.match(/\[[\s\S]*\]/)
    if (!jsonMatch) throw new Error('No JSON found')
    res.json({ exercises: JSON.parse(jsonMatch[0]) })
  } catch {
    res.status(500).json({ error: 'Failed to generate exercises' })
  }
})

export default router

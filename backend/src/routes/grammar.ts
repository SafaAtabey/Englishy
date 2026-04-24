import { Router } from 'express'
import Anthropic from '@anthropic-ai/sdk'

const router = Router()
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

router.post('/generate', async (req, res) => {
  const { topic, level } = req.body
  if (!topic || !level) return res.status(400).json({ error: 'topic and level required' })

  try {
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 2048,
      system: 'You are an English grammar teacher. Always respond with valid JSON only, no markdown.',
      messages: [{
        role: 'user',
        content: `Generate 10 multiple-choice grammar questions about "${topic}" for a ${level} English learner.

Return this exact JSON format:
{
  "questions": [
    {
      "question": "Choose the correct sentence / Fill in the blank: ...",
      "options": ["option A", "option B", "option C", "option D"],
      "correct": <0-3 index of correct option>,
      "explanation": "Brief explanation of why this is correct (1-2 sentences)"
    }
  ]
}

Rules:
- Questions must be appropriate for ${level} level
- Each question has exactly 4 options
- Mix sentence correction and fill-in-the-blank question types
- Explanations should be clear and educational
- Return only JSON, no markdown`,
      }],
    })

    const content = message.content[0]
    if (content.type !== 'text') throw new Error('Unexpected response')
    const jsonMatch = content.text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) throw new Error('No JSON in response')
    const parsed = JSON.parse(jsonMatch[0])
    if (!Array.isArray(parsed.questions) || parsed.questions.length === 0) {
      throw new Error('Invalid questions format')
    }
    res.json(parsed)
  } catch (err) {
    console.error('[grammar/generate]', err)
    res.status(500).json({ error: 'Failed to generate grammar questions' })
  }
})

export default router

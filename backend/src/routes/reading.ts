import { Router } from 'express'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@supabase/supabase-js'

const router = Router()
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_KEY!)

const WORD_COUNTS: Record<string, number> = {
  A1: 100, A2: 150, B1: 200, B2: 300, C1: 400, C2: 500,
}

// POST /api/reading/generate
router.post('/generate', async (req, res) => {
  const { level, topic } = req.body
  if (!level || !topic) return res.status(400).json({ error: 'level and topic required' })

  const wordCount = WORD_COUNTS[level] || 200

  try {
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 2048,
      system: 'You are an English language content creator. Respond only with valid JSON.',
      messages: [{
        role: 'user',
        content: `Write a ${wordCount}-word article about ${topic} for a ${level} English learner.
Use vocabulary appropriate for ${level}. Write in a clear, engaging style.

Return this JSON:
{
  "id": "generated-${Date.now()}",
  "title": "...",
  "content": "...(${wordCount} words, paragraphs separated by \\n\\n)...",
  "cefr_level": "${level}",
  "topic": "${topic}",
  "word_count": ${wordCount},
  "comprehension_questions": [
    {"question": "...", "options": ["A", "B", "C", "D"], "answer": 0},
    {"question": "...", "options": ["A", "B", "C", "D"], "answer": 1},
    {"question": "...", "options": ["A", "B", "C", "D"], "answer": 2}
  ],
  "created_at": "${new Date().toISOString()}"
}
Return only JSON.`
      }],
    })

    const content = message.content[0]
    if (content.type !== 'text') throw new Error('Unexpected response')
    const jsonMatch = content.text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) throw new Error('No JSON')
    const article = JSON.parse(jsonMatch[0])

    // Cache in Supabase (best-effort, fire and forget)
    void supabase.from('articles').upsert(article)

    res.json(article)
  } catch (err) {
    res.status(500).json({ error: 'Failed to generate article' })
  }
})

export default router

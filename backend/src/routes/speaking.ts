import { Router } from 'express'
import Anthropic from '@anthropic-ai/sdk'

const router = Router()
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const TOPIC_CONTEXTS: Record<string, string> = {
  free:       'Open free conversation — follow the student\'s lead naturally.',
  daily:      'Daily life and routines — home, morning habits, weekend plans.',
  travel:     'Travel, places, tourism — destinations, experiences, plans.',
  work:       'Professional English — career, workplace situations, business talk.',
  airport:    'Role-play: you are an airport check-in agent helping a passenger.',
  interview:  'Role-play: you are a professional interviewer conducting a job interview.',
  doctor:     'Role-play: you are a doctor in a medical consultation.',
  debate:     'Debate and opinion — encourage the student to defend their views.',
  shopping:   'Shopping scenarios — clothes, prices, returning items, asking for help.',
  restaurant: 'Role-play: you are a waiter in a restaurant taking the student\'s order.',
}

// POST /api/speaking/respond
router.post('/respond', async (req, res) => {
  const { messages, level, topic } = req.body
  if (!messages || !level) return res.status(400).json({ error: 'messages and level required' })

  const context = TOPIC_CONTEXTS[topic] || TOPIC_CONTEXTS.free

  const systemPrompt = `You are Alex, a professional English conversation tutor specialising in Turkish learners.
Level: ${level} | Topic: ${context}

Strict rules:
- Respond in 2-4 sentences maximum — never longer
- Vocabulary MUST match ${level} level (no complex words for A1/A2, richer language for C1/C2)
- If the user makes a grammar error, silently model the correct form in your reply (do NOT say "you made an error")
- Always end with a natural follow-up question to keep conversation flowing
- For role-plays (airport/interview/doctor/restaurant), stay fully in character
- Be warm, encouraging, and patient — never condescending
- Do not mention you are an AI or that this is a lesson`

  try {
    const anthropicMessages = messages
      .filter((m: { role: string; text: string }) => m.text && m.text.length > 1)
      .map((m: { role: string; text: string }) => ({
        role: m.role === 'ai' ? 'assistant' : 'user',
        content: m.text,
      }))

    if (anthropicMessages.length === 0) {
      anthropicMessages.push({ role: 'user', content: 'Hello' })
    }

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 300,
      system: systemPrompt,
      messages: anthropicMessages,
    })

    const content = message.content[0]
    if (content.type !== 'text') throw new Error('Unexpected response')
    res.json({ text: content.text })
  } catch {
    res.status(500).json({ error: 'Failed to generate response' })
  }
})

// POST /api/speaking/feedback  — detailed end-of-session analysis
router.post('/feedback', async (req, res) => {
  const { messages, level, topic, duration } = req.body
  if (!messages || !level) return res.status(400).json({ error: 'messages and level required' })

  const userMessages = messages.filter((m: { role: string; text: string }) => m.role === 'user')
  if (userMessages.length === 0) {
    return res.json({
      overall: 5, fluency: 5, grammar: 5, vocabulary: 5, confidence: 5,
      corrections: [],
      strengths: ['You started the session — that takes courage!'],
      improvements: ['Try to speak more in the next session.'],
      next_steps: ['Practice 5 minutes daily for best results.'],
    })
  }

  const userText = userMessages.map((m: { role: string; text: string }) => m.text).join('\n')
  const msgCount = userMessages.length
  const wordCount = userText.split(/\s+/).length

  try {
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 800,
      system: 'You are an expert English language examiner. Analyse the student\'s speaking and respond only with valid JSON.',
      messages: [{
        role: 'user',
        content: `Analyse this ${level} English learner's speaking session (topic: ${topic || 'free'}, ${msgCount} messages, ~${wordCount} words, ${duration || 0}s):

Student messages:
${userText}

Return JSON (all scores 1-10):
{
  "overall": <overall speaking score>,
  "fluency": <how naturally and smoothly they spoke>,
  "grammar": <accuracy of grammar>,
  "vocabulary": <range and appropriateness of vocabulary>,
  "confidence": <confidence inferred from message length and variety>,
  "corrections": [
    {"original": "<exact phrase from student>", "corrected": "<corrected version>", "explanation": "<brief reason>"}
  ],
  "strengths": ["<specific strength observed>", "..."],
  "improvements": ["<specific thing to improve>", "..."],
  "next_steps": ["<concrete practice suggestion>", "..."]
}

corrections: max 3 most important ones. strengths/improvements/next_steps: max 3 each. Be encouraging and specific.`,
      }],
    })

    const content = message.content[0]
    if (content.type !== 'text') throw new Error('Unexpected response')
    const jsonMatch = content.text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) throw new Error('No JSON')
    res.json(JSON.parse(jsonMatch[0]))
  } catch {
    res.status(500).json({ error: 'Failed to generate feedback' })
  }
})

export default router

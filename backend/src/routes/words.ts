import { Router } from 'express'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@supabase/supabase-js'

const router = Router()
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_KEY!)

const CACHE_MAX_AGE_DAYS = 30

function isRecent(timestamp: string | null): boolean {
  if (!timestamp) return false
  const age = Date.now() - new Date(timestamp).getTime()
  return age < CACHE_MAX_AGE_DAYS * 86_400_000
}

// GET /api/words?level=B1&limit=10
router.get('/', async (req, res) => {
  const { level = 'B1', limit = 10 } = req.query
  const { data, error } = await supabase
    .from('words')
    .select('*')
    .eq('cefr_level', level)
    .limit(Number(limit))
    .order('word')
  if (error) return res.status(500).json({ error: error.message })
  res.json({ words: data })
})

// POST /api/words/enrich  — cache-first single word lookup
// Used by touch-to-save in Reading, Listening, Speaking
router.post('/enrich', async (req, res) => {
  const { word } = req.body
  if (!word || typeof word !== 'string') return res.status(400).json({ error: 'word required' })
  const clean = word.toLowerCase().trim()

  // 1. Check cache
  const { data: cached } = await supabase
    .from('words')
    .select('*')
    .eq('word', clean)
    .single()

  if (cached && isRecent(cached.ai_generated_at)) {
    return res.json({
      word: cached.word,
      phonetic: cached.phonetic,
      definition_en: cached.definition_en,
      definition_tr: cached.definition_tr,
      example_sentence: cached.example_sentence,
      cefr_level: cached.cefr_level,
      part_of_speech: cached.part_of_speech,
    })
  }

  // 2. Call Claude API
  try {
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 512,
      system: 'You are a bilingual English-Turkish dictionary. Respond only with valid JSON.',
      messages: [{
        role: 'user',
        content: `Given the English word "${clean}", provide:
- Phonetic IPA transcription
- CEFR level (A1/A2/B1/B2/C1/C2)
- Part of speech
- Clear English definition (2 sentences max)
- Turkish translation (natural Turkish, not literal)
- One example sentence using the word naturally in context
- Up to 4 synonyms
- Word family forms

Return only valid JSON:
{
  "word": "${clean}",
  "phonetic": "",
  "cefr_level": "",
  "part_of_speech": "",
  "definition_en": "",
  "definition_tr": "",
  "example_sentence": "",
  "synonyms": [],
  "word_family": []
}`,
      }],
    })

    const content = message.content[0]
    if (content.type !== 'text') throw new Error('Unexpected response type')
    const jsonMatch = content.text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) throw new Error('No JSON in response')
    const enriched = JSON.parse(jsonMatch[0])

    // 3. Upsert into cache
    await supabase.from('words').upsert({
      word: clean,
      phonetic: enriched.phonetic || '',
      definition_en: enriched.definition_en || '',
      definition_tr: enriched.definition_tr || '',
      example_sentence: enriched.example_sentence || '',
      part_of_speech: enriched.part_of_speech || '',
      cefr_level: enriched.cefr_level || 'B1',
      synonyms: enriched.synonyms || [],
      word_family: enriched.word_family || [],
      source: 'ai',
      ai_generated_at: new Date().toISOString(),
    }, { onConflict: 'word' })

    res.json({
      word: clean,
      phonetic: enriched.phonetic,
      definition_en: enriched.definition_en,
      definition_tr: enriched.definition_tr,
      example_sentence: enriched.example_sentence,
      cefr_level: enriched.cefr_level,
      part_of_speech: enriched.part_of_speech,
    })
  } catch (err) {
    res.status(500).json({ error: 'Word enrichment failed' })
  }
})

// POST /api/words/ai-recommend
router.post('/ai-recommend', async (req, res) => {
  const { level, weak_words } = req.body
  if (!level) return res.status(400).json({ error: 'level required' })

  try {
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 2048,
      system: 'You are a language learning expert. Respond only with valid JSON.',
      messages: [{
        role: 'user',
        content: `The user's CEFR level is ${level}. They have struggled with: ${(weak_words || []).join(', ')}.
Recommend 5 new related words. Return ONLY a valid JSON array:
[{
  "word": "",
  "phonetic": "",
  "cefr_level": "${level}",
  "part_of_speech": "",
  "definition_en": "",
  "definition_tr": "",
  "example_sentence": "",
  "synonyms": [],
  "word_family": []
}]`,
      }],
    })
    const content = message.content[0]
    if (content.type !== 'text') throw new Error('Unexpected response')
    const jsonMatch = content.text.match(/\[[\s\S]*\]/)
    if (!jsonMatch) throw new Error('No JSON found')
    const words = JSON.parse(jsonMatch[0])

    // Cache each recommended word and fetch back the real DB row (with id)
    const savedWords = []
    for (const w of words) {
      if (w.word) {
        const { data: row } = await supabase.from('words').upsert({
          word: w.word.toLowerCase(),
          phonetic: w.phonetic || '',
          definition_en: w.definition_en || '',
          definition_tr: w.definition_tr || '',
          example_sentence: w.example_sentence || '',
          part_of_speech: w.part_of_speech || '',
          cefr_level: w.cefr_level || level,
          synonyms: w.synonyms || [],
          word_family: w.word_family || [],
          source: 'ai',
          ai_generated_at: new Date().toISOString(),
        }, { onConflict: 'word' }).select('*').single()
        savedWords.push(row || w)
      }
    }

    res.json({ words: savedWords })
  } catch {
    res.status(500).json({ error: 'AI recommendation failed' })
  }
})

// POST /api/words/mnemonic
router.post('/mnemonic', async (req, res) => {
  const { word, translation } = req.body
  if (!word) return res.status(400).json({ error: 'word required' })

  try {
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 200,
      system: 'You are a language teacher creating fun, memorable mnemonics. Be creative and concise.',
      messages: [{
        role: 'user',
        content: `Create a short, fun mnemonic to help a Turkish speaker remember the English word "${word}" (Turkish: "${translation || ''}").

Rules: 1-2 sentences max. Use wordplay, vivid imagery, or a mini story. Can reference Turkish sounds if helpful. Return ONLY the mnemonic text.`,
      }],
    })
    const content = message.content[0]
    if (content.type !== 'text') throw new Error('Unexpected')
    res.json({ mnemonic: content.text.trim() })
  } catch {
    res.status(500).json({ error: 'Failed to generate mnemonic' })
  }
})

// POST /api/words/atlas  — topic-organized word list (Atlas English style)
router.post('/atlas', async (req, res) => {
  const { level, topic } = req.body
  if (!level || !topic) return res.status(400).json({ error: 'level and topic required' })

  try {
    // Check cache: fetch 12 words for this level+topic combo
    const { data: cached } = await supabase
      .from('words')
      .select('*')
      .eq('cefr_level', level)
      .ilike('example_sentence', `%${topic}%`)
      .limit(12)

    if (cached && cached.length >= 8) {
      return res.json({ words: cached })
    }

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 3000,
      system: 'You are an English vocabulary teacher creating structured word lists. Respond only with valid JSON.',
      messages: [{
        role: 'user',
        content: `Create a structured vocabulary list for the topic "${topic}" at CEFR level ${level} for Turkish speakers.
Generate exactly 12 words. For each word provide:

Return ONLY a valid JSON array:
[{
  "word": "",
  "phonetic": "",
  "cefr_level": "${level}",
  "part_of_speech": "",
  "definition_en": "",
  "definition_tr": "",
  "example_sentence": "",
  "synonyms": [],
  "word_family": []
}]

Make example sentences related to the topic "${topic}". Make Turkish definitions natural (not literal).`,
      }],
    })

    const content = message.content[0]
    if (content.type !== 'text') throw new Error('Unexpected response')
    const jsonMatch = content.text.match(/\[[\s\S]*\]/)
    if (!jsonMatch) throw new Error('No JSON found')
    const words = JSON.parse(jsonMatch[0])

    for (const w of words) {
      if (w.word) {
        await supabase.from('words').upsert({
          word: w.word.toLowerCase(),
          phonetic: w.phonetic || '',
          definition_en: w.definition_en || '',
          definition_tr: w.definition_tr || '',
          example_sentence: w.example_sentence || '',
          part_of_speech: w.part_of_speech || '',
          cefr_level: w.cefr_level || level,
          synonyms: w.synonyms || [],
          word_family: w.word_family || [],
          source: 'ai',
          ai_generated_at: new Date().toISOString(),
        }, { onConflict: 'word' })
      }
    }

    res.json({ words })
  } catch {
    res.status(500).json({ error: 'Atlas word generation failed' })
  }
})

export default router

import { Router } from 'express'
import multer from 'multer'
import { createRequire } from 'module'
const require = createRequire(import.meta.url)
const pdfParseLib = require('pdf-parse')
const pdfParse = (typeof pdfParseLib === 'function' ? pdfParseLib : pdfParseLib.default) as (buffer: Buffer) => Promise<{ text: string; numpages: number }>
import { createClient } from '@supabase/supabase-js'

const router = Router()
const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_KEY!)

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 }, // 20 MB
  fileFilter: (_req, file, cb) => {
    if (file.mimetype === 'application/pdf') cb(null, true)
    else cb(new Error('Only PDF files allowed'))
  },
})

// POST /api/books/upload
router.post('/upload', upload.single('pdf'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No PDF file provided' })
  const userId = req.body.user_id
  if (!userId) return res.status(400).json({ error: 'user_id required' })

  try {
    const data = await pdfParse(req.file.buffer)
    const rawText = data.text

    // Split into pages/chapters by double newlines, clean up
    const paragraphs = rawText
      .split(/\n{2,}/)
      .map((p: string) => p.replace(/\n/g, ' ').replace(/\s+/g, ' ').trim())
      .filter((p: string) => p.length > 20)

    const title = req.body.title || req.file.originalname.replace('.pdf', '')
    const totalWords = rawText.split(/\s+/).length

    const book = {
      user_id: userId,
      title,
      paragraphs,
      total_words: totalWords,
      page_count: data.numpages,
      created_at: new Date().toISOString(),
    }

    const { data: inserted, error } = await supabase
      .from('books')
      .insert(book)
      .select()
      .single()

    if (error) throw error
    res.json(inserted)
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Upload failed'
    res.status(500).json({ error: message })
  }
})

// GET /api/books?user_id=xxx
router.get('/', async (req, res) => {
  const { user_id } = req.query
  if (!user_id) return res.status(400).json({ error: 'user_id required' })

  const { data, error } = await supabase
    .from('books')
    .select('id, title, total_words, page_count, created_at')
    .eq('user_id', user_id)
    .order('created_at', { ascending: false })

  if (error) return res.status(500).json({ error: error.message })
  res.json({ books: data })
})

// GET /api/books/:id
router.get('/:id', async (req, res) => {
  const { data, error } = await supabase
    .from('books')
    .select('*')
    .eq('id', req.params.id)
    .single()

  if (error || !data) return res.status(404).json({ error: 'Book not found' })
  res.json(data)
})

// DELETE /api/books/:id
router.delete('/:id', async (req, res) => {
  const { user_id } = req.body
  const { error } = await supabase
    .from('books')
    .delete()
    .eq('id', req.params.id)
    .eq('user_id', user_id)

  if (error) return res.status(500).json({ error: error.message })
  res.json({ ok: true })
})

export default router

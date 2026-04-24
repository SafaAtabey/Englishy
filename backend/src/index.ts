import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import { rateLimit } from 'express-rate-limit'
import wordsRouter from './routes/words.js'
import writingRouter from './routes/writing.js'
import readingRouter from './routes/reading.js'
import paymentsRouter from './routes/payments.js'
import booksRouter from './routes/books.js'
import speakingRouter from './routes/speaking.js'
import listeningRouter from './routes/listening.js'
import grammarRouter from './routes/grammar.js'
import { requirePro } from './middleware/requirePro.js'

const app = express()
const PORT = process.env.PORT || 3001

app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:5173' }))

// Stripe webhook needs raw body
app.use('/api/payments/webhook', express.raw({ type: 'application/json' }))
app.use(express.json())

const limiter = rateLimit({ windowMs: 60_000, max: 30, message: { error: 'Too many requests' } })
const aiLimiter = rateLimit({ windowMs: 60_000, max: 10, message: { error: 'AI rate limit exceeded' } })

app.use('/api', limiter)
app.use('/api/writing', aiLimiter)
app.use('/api/reading', aiLimiter)
app.use('/api/words/ai-recommend', aiLimiter)
app.use('/api/words/atlas', aiLimiter)
app.use('/api/words/mnemonic', aiLimiter)
app.use('/api/grammar', aiLimiter)
app.use('/api/speaking', aiLimiter)
app.use('/api/listening', aiLimiter)

app.use('/api/words', wordsRouter)
app.use('/api/writing', requirePro, writingRouter)
app.use('/api/reading', readingRouter)           // reading is free
app.use('/api/payments', paymentsRouter)
app.use('/api/books', requirePro, booksRouter)
app.use('/api/speaking', requirePro, speakingRouter)
app.use('/api/listening', requirePro, listeningRouter)
app.use('/api/grammar', grammarRouter)

app.get('/health', (_req, res) => res.json({ ok: true }))

app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`))

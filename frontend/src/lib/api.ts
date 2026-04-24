import type { Word, WritingFeedback, Article, WordPopupData, Book } from '../types'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'

export class ProRequiredError extends Error {
  constructor() { super('PRO_REQUIRED') }
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Request failed' }))
    if (err.code === 'PRO_REQUIRED') throw new ProRequiredError()
    throw new Error(err.error || 'Request failed')
  }
  return res.json()
}

export const api = {
  getWords: (level: string, limit = 10) =>
    request<{ words: Word[] }>(`/api/words?level=${level}&limit=${limit}`),

  getAIWords: (level: string, weakWords: string[]) =>
    request<{ words: Word[] }>('/api/words/ai-recommend', {
      method: 'POST',
      body: JSON.stringify({ level, weak_words: weakWords }),
    }),

  // Enrich a single word — cache-first (checks Supabase before Claude API)
  enrichWord: (word: string) =>
    request<WordPopupData>('/api/words/enrich', {
      method: 'POST',
      body: JSON.stringify({ word }),
    }),

  gradeWrittenSentence: (word: string, sentence: string, level: string) =>
    request<{ correct: boolean; feedback: string; grade: 'correct' | 'grammar' | 'wrong' }>('/api/writing/grade-sentence', {
      method: 'POST',
      body: JSON.stringify({ word, sentence, level }),
    }),

  getWritingFeedback: (text: string, level: string) =>
    request<WritingFeedback>('/api/writing/feedback', {
      method: 'POST',
      body: JSON.stringify({ text, level }),
    }),

  generateArticle: (level: string, topic: string) =>
    request<Article>('/api/reading/generate', {
      method: 'POST',
      body: JSON.stringify({ level, topic }),
    }),

  createCheckoutSession: (plan: string, userId: string) =>
    request<{ url: string }>('/api/payments/checkout', {
      method: 'POST',
      body: JSON.stringify({ plan, user_id: userId }),
    }),

  createPortalSession: (customerId: string) =>
    request<{ url: string }>('/api/payments/portal', {
      method: 'POST',
      body: JSON.stringify({ customer_id: customerId }),
    }),

  getBooks: (userId: string) =>
    request<{ books: Book[] }>(`/api/books?user_id=${userId}`),

  getBook: (id: string, userId?: string) =>
    request<Book>(`/api/books/${id}${userId ? `?user_id=${userId}` : ''}`),

  deleteBook: (id: string, userId: string) =>
    request<{ ok: boolean }>(`/api/books/${id}`, {
      method: 'DELETE',
      body: JSON.stringify({ user_id: userId }),
    }),

  speakingRespond: (messages: { role: string; text: string }[], level: string, topic: string, userId?: string) =>
    request<{ text: string }>('/api/speaking/respond', {
      method: 'POST',
      body: JSON.stringify({ messages, level, topic, user_id: userId }),
    }),

  speakingFeedback: (messages: { role: string; text: string }[], level: string, topic: string, duration: number, userId?: string) =>
    request<{
      overall: number; fluency: number; grammar: number; vocabulary: number; confidence: number;
      corrections: { original: string; corrected: string; explanation: string }[];
      strengths: string[]; improvements: string[]; next_steps: string[];
    }>('/api/speaking/feedback', {
      method: 'POST',
      body: JSON.stringify({ messages, level, topic, duration, user_id: userId }),
    }),

  generateListening: (level: string, userId?: string) =>
    request<{ exercises: unknown[] }>('/api/listening/generate', {
      method: 'POST',
      body: JSON.stringify({ level, user_id: userId }),
    }),

  getWritingFeedbackPro: (text: string, level: string, userId: string) =>
    request<WritingFeedback>('/api/writing/feedback', {
      method: 'POST',
      body: JSON.stringify({ text, level, user_id: userId }),
    }),

  generateMnemonic: (word: string, translation: string) =>
    request<{ mnemonic: string }>('/api/words/mnemonic', {
      method: 'POST',
      body: JSON.stringify({ word, translation }),
    }),

  generateGrammar: (topic: string, level: string) =>
    request<{ questions: { question: string; options: string[]; correct: number; explanation: string }[] }>('/api/grammar/generate', {
      method: 'POST',
      body: JSON.stringify({ topic, level }),
    }),
}

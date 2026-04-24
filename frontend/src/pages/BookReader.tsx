import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useQuery } from '@tanstack/react-query'
import { api } from '../lib/api'
import { useStore } from '../store/useStore'
import WordPopup from '../components/WordPopup'
import type { WordPopupData } from '../types'

export default function BookReader() {
  const { id } = useParams<{ id: string }>()
  const { profile } = useStore()
  const [popup, setPopup] = useState<WordPopupData | null>(null)
  const [loadingWord, setLoadingWord] = useState('')
  const [savedWords, setSavedWords] = useState<Set<string>>(new Set())
  const [fontSize, setFontSize] = useState<'sm' | 'base' | 'lg' | 'xl'>('base')

  const { data: book, isLoading, error } = useQuery({
    queryKey: ['book', id],
    queryFn: () => api.getBook(id!, profile?.id),
    enabled: !!id && !!profile?.id,
  })

  const handleWordTap = async (word: string) => {
    const clean = word.replace(/[^a-zA-Z'-]/g, '').toLowerCase()
    if (!clean || clean.length < 2) return
    setLoadingWord(clean)
    try {
      const data = await api.enrichWord(clean)
      setPopup(data)
    } catch {
      // ignore
    } finally {
      setLoadingWord('')
    }
  }

  const fontSizeClasses = {
    sm: 'text-sm',
    base: 'text-base',
    lg: 'text-lg',
    xl: 'text-xl',
  }

  const renderTappableText = (text: string) => {
    const tokens = text.split(/(\s+|[.,!?;:""''()\[\]—–-])/)
    return tokens.map((token, i) => {
      const clean = token.replace(/[^a-zA-Z'-]/g, '').toLowerCase()
      const isWord = clean.length >= 2
      const isSaved = savedWords.has(clean)
      const isLoading = loadingWord === clean

      if (!isWord) return <span key={i}>{token}</span>

      return (
        <span
          key={i}
          onClick={() => handleWordTap(token)}
          className={`cursor-pointer rounded transition-colors select-none ${
            isLoading
              ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-600 animate-pulse'
              : isSaved
              ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300'
              : 'hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-blue-600 dark:hover:text-blue-400'
          }`}
        >
          {token}
        </span>
      )
    })
  }

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto py-12">
        <div className="space-y-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="h-4 bg-gray-100 dark:bg-slate-700 rounded animate-pulse" style={{ width: `${70 + Math.random() * 30}%` }} />
          ))}
        </div>
      </div>
    )
  }

  if (error || !book) {
    return (
      <div className="max-w-3xl mx-auto text-center py-20">
        <div className="text-5xl mb-4">😕</div>
        <h2 className="text-xl font-bold text-gray-700 dark:text-gray-300 mb-4">Book not found</h2>
        <Link to="/books" className="text-primary-600 hover:underline">← Back to Books</Link>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between mb-6 gap-4">
        <div>
          <Link to="/books" className="text-sm text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 mb-2 block">
            ← My Books
          </Link>
          <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white leading-tight">{book.title}</h1>
          <p className="text-sm text-gray-400 mt-1">{book.page_count} pages • {book.total_words.toLocaleString()} words</p>
        </div>

        {/* Font size controls */}
        <div className="flex items-center gap-1 bg-gray-100 dark:bg-slate-700 rounded-xl p-1 shrink-0">
          {([['sm', 'A', 'text-xs'], ['base', 'A', 'text-sm'], ['lg', 'A', 'text-base'], ['xl', 'A', 'text-lg']] as const).map(([s, label, sz]) => (
            <button
              key={s}
              onClick={() => setFontSize(s)}
              className={`px-2 py-1 rounded-lg font-medium transition-colors ${sz} ${
                fontSize === s
                  ? 'bg-white dark:bg-slate-600 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl flex items-center gap-2 text-sm text-blue-700 dark:text-blue-300">
        <span>👆</span>
        <span>Tap any word to see its Turkish translation and save it to your vocabulary</span>
      </div>

      {/* Book content */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm p-6 lg:p-10"
      >
        <div className={`${fontSizeClasses[fontSize]} text-gray-800 dark:text-gray-200 leading-relaxed space-y-5`} style={{ lineHeight: '1.9' }}>
          {book.paragraphs.map((para, i) => (
            <p key={i} className="text-justify">
              {renderTappableText(para)}
            </p>
          ))}
        </div>
      </motion.div>

      <div className="mt-4 text-center text-xs text-gray-400">
        {savedWords.size > 0 && (
          <span className="bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-300 px-3 py-1 rounded-full">
            {savedWords.size} word{savedWords.size !== 1 ? 's' : ''} saved from this book
          </span>
        )}
      </div>

      <WordPopup
        data={popup}
        onClose={() => setPopup(null)}
        onSaved={(word) => setSavedWords((prev) => new Set([...prev, word.toLowerCase()]))}
      />
    </div>
  )
}

import { useEffect, useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { useStore } from '../store/useStore'
import { supabase } from '../lib/supabase'
import type { UserWord, SaveSource } from '../types'

const SOURCE_LABELS: Record<SaveSource, { icon: string; label: string; color: string }> = {
  flashcard: { icon: '🃏', label: 'Flashcard', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
  touch:     { icon: '👆', label: 'Touch Saved', color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' },
  manual:    { icon: '🔍', label: 'Manual', color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' },
}

type Filter = 'all' | 'due' | SaveSource

export default function VocabSaved() {
  const { profile } = useStore()
  const [words, setWords] = useState<UserWord[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<Filter>('all')

  const load = useCallback(async () => {
    if (!profile) return
    setLoading(true)

    const today = new Date().toISOString().split('T')[0]

    let q = supabase
      .from('user_words')
      .select('*, word:words(*)')
      .eq('user_id', profile.id)
      .in('status', ['saved', 'touch_saved'])

    if (filter === 'due') {
      q = q.lte('next_review_date', today)
    } else if (filter === 'flashcard' || filter === 'touch' || filter === 'manual') {
      q = q.eq('save_source', filter)
    }

    const { data, error } = await q.order('saved_at', { ascending: false })
    if (error) console.error('[VocabSaved] fetch error:', error.message)
    setWords(data || [])
    setLoading(false)
  }, [profile, filter])

  useEffect(() => { load() }, [load])

  const markKnown = async (id: string) => {
    await supabase.from('user_words').update({ status: 'known' }).eq('id', id)
    setWords(w => w.filter(x => x.id !== id))
  }

  const removeWord = async (id: string) => {
    await supabase.from('user_words').delete().eq('id', id)
    setWords(w => w.filter(x => x.id !== id))
  }

  const filters: { key: Filter; label: string }[] = [
    { key: 'all',       label: 'All Saved' },
    { key: 'due',       label: '🗓 Due Today' },
    { key: 'flashcard', label: '🃏 Flashcard' },
    { key: 'touch',     label: '👆 Touch Saved' },
    { key: 'manual',    label: '🔍 Manual' },
  ]

  return (
    <div className="max-w-3xl mx-auto space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white">Saved Words</h1>
          <p className="text-sm text-gray-400 mt-0.5">{words.length} word{words.length !== 1 ? 's' : ''} saved</p>
        </div>
        <Link to="/vocabulary/practice" className="btn-primary text-sm py-2 px-4">🎯 Practice</Link>
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        {filters.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={`px-3 py-1.5 rounded-xl text-sm font-medium transition-all ${
              filter === key
                ? 'bg-primary-600 text-white shadow-sm'
                : 'bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-600'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* List */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="card h-16 animate-pulse bg-gray-100 dark:bg-slate-700" />
          ))}
        </div>
      ) : words.length === 0 ? (
        <div className="text-center py-20 space-y-3">
          <div className="text-5xl">📭</div>
          <p className="font-semibold text-gray-700 dark:text-gray-300">
            {filter === 'due' ? 'No words due today — great work!' : 'No saved words yet.'}
          </p>
          <p className="text-sm text-gray-400">
            {filter !== 'all' ? 'Try switching to "All Saved"' : 'Go to Vocabulary and tap "📌 Study Later" on a card.'}
          </p>
          <Link to="/vocabulary" className="btn-primary mt-2 inline-block text-sm">Learn New Words</Link>
        </div>
      ) : (
        <div className="space-y-2">
          {words.map((uw) => {
            const src = (uw.save_source || 'flashcard') as SaveSource
            const srcMeta = SOURCE_LABELS[src] || SOURCE_LABELS.flashcard
            return (
              <div key={uw.id} className="card flex items-center justify-between gap-4 py-3.5">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-0.5">
                    <span className="font-bold text-gray-900 dark:text-white text-base">{uw.word?.word}</span>
                    {uw.word?.cefr_level && (
                      <span className={`cefr-badge cefr-${uw.word.cefr_level.toLowerCase()}`}>{uw.word.cefr_level}</span>
                    )}
                    {uw.word?.part_of_speech && (
                      <span className="text-xs text-gray-400">{uw.word.part_of_speech}</span>
                    )}
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${srcMeta.color}`}>
                      {srcMeta.icon} {srcMeta.label}
                    </span>
                  </div>
                  {uw.word?.definition_tr && (
                    <p className="text-primary-600 dark:text-primary-400 text-sm font-medium">🇹🇷 {uw.word.definition_tr}</p>
                  )}
                  {uw.word?.definition_en && (
                    <p className="text-gray-500 dark:text-gray-400 text-xs truncate">{uw.word.definition_en}</p>
                  )}
                  {uw.next_review_date && (
                    <p className="text-xs text-amber-500 mt-0.5">📅 Due: {uw.next_review_date}</p>
                  )}
                </div>
                <div className="flex gap-2 shrink-0">
                  <button
                    onClick={() => markKnown(uw.id)}
                    className="text-xs px-3 py-1.5 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 rounded-xl hover:bg-emerald-100 transition-all font-medium border border-emerald-200 dark:border-emerald-800"
                  >
                    ✓ Known
                  </button>
                  <button
                    onClick={() => removeWord(uw.id)}
                    className="text-xs px-3 py-1.5 bg-red-50 dark:bg-red-900/20 text-red-400 rounded-xl hover:bg-red-100 transition-all border border-red-200 dark:border-red-800"
                  >
                    🗑
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {words.length > 0 && (
        <div className="flex gap-3 pt-2">
          <Link to="/vocabulary/practice" className="btn-primary flex-1 text-center py-3">
            🎯 Practice {words.length} Words →
          </Link>
          <Link to="/vocabulary/review" className="btn-outline flex-1 text-center py-3">
            🔁 SRS Review
          </Link>
        </div>
      )}
    </div>
  )
}

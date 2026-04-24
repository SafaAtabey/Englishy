import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useStore } from '../store/useStore'
import { supabase } from '../lib/supabase'
import { sm2Update, type SM2Quality } from '../lib/sm2'
import type { UserWord } from '../types'

const RATINGS: { quality: SM2Quality; label: string; emoji: string; className: string }[] = [
  { quality: 0, label: 'Again', emoji: '🔄', className: 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border-red-200 dark:border-red-800 hover:bg-red-100' },
  { quality: 1, label: 'Hard', emoji: '😰', className: 'bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 border-orange-200 dark:border-orange-800 hover:bg-orange-100' },
  { quality: 2, label: 'Good', emoji: '😊', className: 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800 hover:bg-blue-100' },
  { quality: 3, label: 'Easy', emoji: '🌟', className: 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100' },
]

export default function VocabReview() {
  const { profile } = useStore()
  const [queue, setQueue] = useState<UserWord[]>([])
  const [index, setIndex] = useState(0)
  const [revealed, setRevealed] = useState(false)
  const [loading, setLoading] = useState(true)
  const [done, setDone] = useState(false)
  const [stats, setStats] = useState({ again: 0, hard: 0, good: 0, easy: 0 })

  useEffect(() => {
    if (!profile) return
    const load = async () => {
      const today = new Date().toISOString().split('T')[0]
      const { data } = await supabase.from('user_words')
        .select('*, word:words(*)')
        .eq('user_id', profile.id)
        .lte('next_review_date', today)
        .limit(20)
      setQueue(data || [])
      setLoading(false)
    }
    load()
  }, [profile])

  const current = queue[index]

  const handleRate = async (quality: SM2Quality) => {
    if (!current) return
    const { easeFactor, intervalDays, nextDate } = sm2Update(current.ease_factor, current.interval_days, quality)
    await supabase.from('user_words').update({
      ease_factor: easeFactor,
      interval_days: intervalDays,
      next_review_date: nextDate,
      times_seen: current.times_seen + 1,
      times_correct: quality >= 2 ? current.times_correct + 1 : current.times_correct,
    }).eq('id', current.id)

    const keys = ['again', 'hard', 'good', 'easy'] as const
    setStats(s => ({ ...s, [keys[quality]]: s[keys[quality]] + 1 }))
    setRevealed(false)
    if (index + 1 >= queue.length) setDone(true)
    else setIndex(i => i + 1)
  }

  const speak = (word: string) => {
    if (!('speechSynthesis' in window)) return
    const u = new SpeechSynthesisUtterance(word)
    u.lang = 'en-US'; u.rate = 0.85
    const v = window.speechSynthesis.getVoices().find(v => v.lang === 'en-US')
    if (v) u.voice = v
    window.speechSynthesis.speak(u)
  }

  if (loading) return <div className="flex items-center justify-center h-64 text-4xl animate-spin">⚙️</div>

  if (queue.length === 0) {
    return (
      <div className="max-w-lg mx-auto text-center py-20 space-y-4">
        <div className="text-7xl">✨</div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Nothing to review!</h1>
        <p className="text-gray-500 mb-4">You're all caught up. Come back tomorrow for more.</p>
        <Link to="/vocabulary" className="btn-primary">Learn New Words</Link>
      </div>
    )
  }

  if (done) {
    const total = stats.again + stats.hard + stats.good + stats.easy
    const remembered = stats.good + stats.easy
    const pct = total > 0 ? Math.round((remembered / total) * 100) : 0
    const emoji = pct >= 80 ? '🏆' : pct >= 50 ? '👍' : '💪'
    const msg = pct >= 80
      ? 'Excellent recall! Your memory is getting stronger.'
      : pct >= 50
      ? 'Good effort! Keep reviewing and you\'ll improve fast.'
      : 'Tough session — that\'s okay. Struggling is how you learn.'
    return (
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="max-w-lg mx-auto py-12 space-y-6"
      >
        <div className="text-center space-y-3">
          <div className="w-24 h-24 mx-auto rounded-3xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center text-5xl shadow-xl">{emoji}</div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Review Complete!</h1>
          <p className="text-gray-500 text-sm">{msg}</p>
        </div>

        {/* Accuracy ring */}
        <div className="card text-center py-5">
          <p className="text-5xl font-extrabold text-primary-600">{pct}%</p>
          <p className="text-sm text-gray-500 mt-1">recalled correctly ({remembered}/{total} cards)</p>
        </div>

        <div className="grid grid-cols-4 gap-2">
          {[
            { label: 'Again', value: stats.again, color: 'text-red-600', bg: 'bg-red-50 dark:bg-red-900/20' },
            { label: 'Hard', value: stats.hard, color: 'text-orange-600', bg: 'bg-orange-50 dark:bg-orange-900/20' },
            { label: 'Good', value: stats.good, color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-900/20' },
            { label: 'Easy', value: stats.easy, color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
          ].map(s => (
            <div key={s.label} className={`${s.bg} rounded-2xl py-3 px-2 text-center`}>
              <p className={`text-2xl font-extrabold ${s.color}`}>{s.value}</p>
              <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        {stats.again > 0 && (
          <div className="text-center text-xs text-gray-400 bg-gray-50 dark:bg-slate-800 rounded-xl px-4 py-3">
            💡 {stats.again} card{stats.again > 1 ? 's' : ''} marked "Again" will come back for review soon
          </div>
        )}

        <div className="flex gap-3">
          <Link to="/vocabulary" className="flex-1 btn-primary">Learn New Words</Link>
          <Link to="/dashboard" className="flex-1 btn-outline">Dashboard</Link>
        </div>
      </motion.div>
    )
  }

  if (!current) return null

  return (
    <div className="max-w-xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">🔁 Review</h1>
          <p className="text-xs text-gray-500 mt-0.5">Spaced Repetition · SM-2</p>
        </div>
        <span className="text-sm text-gray-500">{index + 1} / {queue.length}</span>
      </div>

      <div className="h-1.5 bg-gray-100 dark:bg-slate-700 rounded-full overflow-hidden">
        <motion.div className="h-full bg-gradient-to-r from-primary-500 to-primary-600 rounded-full"
          animate={{ width: `${(index / queue.length) * 100}%` }} transition={{ duration: 0.3 }} />
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={current.id}
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
          className="card space-y-5"
        >
          {/* Word face */}
          <div className="text-center py-6 space-y-3">
            <div className="flex items-center justify-center gap-2">
              <span className={`cefr-badge cefr-${current.word?.cefr_level?.toLowerCase()}`}>{current.word?.cefr_level}</span>
              <span className="text-xs text-gray-400 bg-gray-100 dark:bg-slate-700 px-2 py-0.5 rounded-full">{current.word?.part_of_speech}</span>
            </div>
            <h2 className="text-5xl font-extrabold text-gray-900 dark:text-white tracking-tight">{current.word?.word}</h2>
            {current.word?.phonetic && (
              <div className="flex items-center justify-center gap-2">
                <p className="text-gray-400 font-mono text-sm">{current.word.phonetic}</p>
                <button onClick={() => speak(current.word!.word)}
                  className="w-8 h-8 rounded-lg bg-primary-50 dark:bg-primary-900/30 flex items-center justify-center text-primary-600 hover:bg-primary-100 transition-colors text-sm"
                >🔊</button>
              </div>
            )}
          </div>

          {/* Revealed content */}
          <AnimatePresence>
            {revealed && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                className="space-y-4 border-t border-gray-100 dark:border-slate-700 pt-4 overflow-hidden"
              >
                <div className="flex gap-3 items-start p-3 bg-red-50 dark:bg-red-900/20 rounded-xl">
                  <span className="text-lg shrink-0">🇹🇷</span>
                  <p className="text-red-700 dark:text-red-300 font-semibold">{current.word?.definition_tr}</p>
                </div>
                <div className="flex gap-3 items-start">
                  <span className="text-lg shrink-0 mt-0.5">🇬🇧</span>
                  <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed">{current.word?.definition_en}</p>
                </div>
                {current.word?.example_sentence && (
                  <p className="text-gray-400 text-sm italic text-center px-4">
                    "{current.word.example_sentence.replace(/\*\*/g, '')}"
                  </p>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {!revealed && (
            <div className="text-center pb-2">
              <button onClick={() => setRevealed(true)} className="btn-primary px-10">Show Answer</button>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Rating buttons */}
      <AnimatePresence>
        {revealed && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            className="space-y-2"
          >
            <p className="text-xs text-center text-gray-400 font-medium">How well did you remember?</p>
            <div className="grid grid-cols-4 gap-2">
              {RATINGS.map(r => (
                <button key={r.quality} onClick={() => handleRate(r.quality)}
                  className={`py-3 rounded-xl font-semibold text-sm border-2 transition-all ${r.className}`}
                >
                  <div className="text-lg mb-0.5">{r.emoji}</div>
                  {r.label}
                </button>
              ))}
            </div>
            <p className="text-xs text-center text-gray-400">Again = tomorrow · Hard = soon · Good = normal · Easy = longer</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useStore } from '../store/useStore'
import { supabase } from '../lib/supabase'
import { api } from '../lib/api'
import type { Word } from '../types'

interface Stats {
  wordsLearned: number
  wordsToReview: number
  streakCount: number
  dailyGoal: number
  dailyDone: number
}

function getWotdCacheKey(userId: string) {
  const today = new Date().toISOString().split('T')[0]
  return `wotd-${today}-${userId}`
}

function getCachedWotd(userId: string): Word | null {
  try { return JSON.parse(localStorage.getItem(getWotdCacheKey(userId)) || 'null') }
  catch { return null }
}

function cacheWotd(word: Word, userId: string) {
  localStorage.setItem(getWotdCacheKey(userId), JSON.stringify(word))
}

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

export default function Dashboard() {
  const { profile, setProfile } = useStore()
  const [stats, setStats] = useState<Stats>({
    wordsLearned: 0, wordsToReview: 0,
    streakCount: profile?.streak_count || 0,
    dailyGoal: profile?.daily_goal || 10,
    dailyDone: 0,
  })
  const [loading, setLoading] = useState(true)
  const [wotd, setWotd] = useState<Word | null>(null)
  const [wotdOpen, setWotdOpen] = useState(false)

  useEffect(() => {
    if (!profile) return
    const load = async () => {
      const today = new Date().toISOString().split('T')[0]

      // ── Streak update ─────────────────────────────────────────────────────
      const lastActive = profile.last_active?.split('T')[0]
      if (lastActive !== today) {
        const yesterday = new Date(Date.now() - 86_400_000).toISOString().split('T')[0]
        const newStreak = lastActive === yesterday ? (profile.streak_count || 0) + 1 : 1
        await supabase
          .from('users')
          .update({ last_active: today, streak_count: newStreak })
          .eq('id', profile.id)
        setProfile({ ...profile, last_active: today, streak_count: newStreak })
        setStats(s => ({ ...s, streakCount: newStreak }))
      }

      // ── Stats ─────────────────────────────────────────────────────────────
      const [knownRes, reviewRes, todayRes] = await Promise.all([
        supabase.from('user_words').select('id', { count: 'exact' }).eq('user_id', profile.id).eq('status', 'known'),
        supabase.from('user_words').select('id', { count: 'exact' }).eq('user_id', profile.id).lte('next_review_date', today),
        supabase.from('user_words').select('id', { count: 'exact' }).eq('user_id', profile.id).gte('created_at', today),
      ])
      setStats(s => ({
        ...s,
        wordsLearned: knownRes.count || 0,
        wordsToReview: reviewRes.count || 0,
        dailyDone: Math.min(todayRes.count || 0, s.dailyGoal),
      }))
      setLoading(false)

      // ── Word of the Day ───────────────────────────────────────────────────
      const cached = getCachedWotd(profile.id)
      if (cached) {
        setWotd(cached)
      } else {
        try {
          const res = await api.getWords(profile.cefr_level, 30)
          if (res.words?.length) {
            const seed = new Date().getDate()
            const word = res.words[seed % res.words.length]
            cacheWotd(word, profile.id)
            setWotd(word)
          }
        } catch { /* non-critical */ }
      }
    }
    load()
  }, [profile?.id])

  if (!profile) return null

  const streakCount = stats.streakCount
  const dailyProgress = stats.dailyGoal > 0
    ? Math.min((stats.dailyDone / stats.dailyGoal) * 100, 100)
    : 0
  const goalComplete = dailyProgress >= 100

  const quickActions = [
    { icon: '📚', label: 'Learn Words', path: '/vocabulary', color: 'bg-blue-500' },
    { icon: '🔁', label: 'Review', path: '/vocabulary/review', color: 'bg-indigo-500' },
    { icon: '🎙️', label: 'Speaking', path: '/speaking', color: 'bg-purple-500' },
    { icon: '✍️', label: 'Writing', path: '/writing', color: 'bg-pink-500' },
    { icon: '📖', label: 'Reading', path: '/reading', color: 'bg-emerald-500' },
    { icon: '📝', label: 'Grammar', path: '/grammar', color: 'bg-orange-500' },
  ]

  return (
    <div className="space-y-6">

      {/* ── Welcome ─────────────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
            {getGreeting()}, {profile.name?.split(' ')[0]}! 👋
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm">
            Level: <span className={`cefr-badge cefr-${profile.cefr_level.toLowerCase()}`}>{profile.cefr_level}</span>
            {' · '}{profile.subscription_plan} plan
          </p>
        </div>
        <motion.div
          whileHover={{ scale: 1.05 }}
          className="shrink-0 text-center bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-2xl px-5 py-3"
        >
          <div className="text-2xl font-extrabold text-orange-500">🔥 {streakCount}</div>
          <div className="text-xs text-gray-500 mt-0.5">day streak</div>
        </motion.div>
      </div>

      {/* ── Today's Plan ────────────────────────────────────────────────────── */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="card space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-gray-900 dark:text-white text-sm uppercase tracking-wide">Today's Plan</h2>
          {goalComplete && <span className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold">🎉 Goal complete!</span>}
        </div>

        {/* Daily goal progress */}
        <div>
          <div className="flex justify-between text-xs text-gray-500 mb-1.5">
            <span>Daily goal</span>
            <span className="font-semibold">{stats.dailyDone} / {stats.dailyGoal} words</span>
          </div>
          <div className="w-full bg-gray-100 dark:bg-slate-700 rounded-full h-2.5 overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${dailyProgress}%` }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
              className={`h-full rounded-full ${goalComplete ? 'bg-emerald-500' : 'bg-accent-500'}`}
            />
          </div>
        </div>

        {/* Priority action */}
        {!loading && (
          stats.wordsToReview > 0 ? (
            <Link to="/vocabulary/review"
              className="flex items-center justify-between bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800 rounded-xl px-4 py-3 hover:bg-primary-100 dark:hover:bg-primary-900/30 transition-all group"
            >
              <div>
                <p className="font-semibold text-primary-800 dark:text-primary-200 text-sm">
                  🔁 {stats.wordsToReview} word{stats.wordsToReview > 1 ? 's' : ''} due for review
                </p>
                <p className="text-xs text-primary-500 dark:text-primary-400 mt-0.5">Review before they fade from memory</p>
              </div>
              <span className="text-primary-600 dark:text-primary-400 font-bold text-sm group-hover:translate-x-0.5 transition-transform">Start →</span>
            </Link>
          ) : !goalComplete ? (
            <Link to="/vocabulary"
              className="flex items-center justify-between bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl px-4 py-3 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-all group"
            >
              <div>
                <p className="font-semibold text-blue-800 dark:text-blue-200 text-sm">
                  📚 Learn {stats.dailyGoal - stats.dailyDone} more word{stats.dailyGoal - stats.dailyDone > 1 ? 's' : ''}
                </p>
                <p className="text-xs text-blue-500 dark:text-blue-400 mt-0.5">Hit your daily goal</p>
              </div>
              <span className="text-blue-600 dark:text-blue-400 font-bold text-sm group-hover:translate-x-0.5 transition-transform">Learn →</span>
            </Link>
          ) : (
            <div className="flex items-center gap-3 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl px-4 py-3">
              <span className="text-2xl">🌟</span>
              <div>
                <p className="font-semibold text-emerald-800 dark:text-emerald-200 text-sm">All caught up for today!</p>
                <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-0.5">Try speaking or writing to keep going.</p>
              </div>
            </div>
          )
        )}
      </motion.div>

      {/* ── Word of the Day ──────────────────────────────────────────────────── */}
      {wotd && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }} className="card">
          <button onClick={() => setWotdOpen(o => !o)} className="w-full flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-lg">✨</span>
              <span className="font-bold text-gray-900 dark:text-white text-sm uppercase tracking-wide">Word of the Day</span>
            </div>
            <span className="text-gray-400 text-xs">{wotdOpen ? '▲ hide' : '▼ show'}</span>
          </button>

          <div className="mt-3 flex items-baseline gap-3 flex-wrap">
            <h3 className="text-3xl font-extrabold text-gray-900 dark:text-white">{wotd.word}</h3>
            {wotd.phonetic && <span className="text-gray-400 font-mono text-sm">{wotd.phonetic}</span>}
            <span className={`cefr-badge cefr-${(wotd.cefr_level || 'b1').toLowerCase()}`}>{wotd.cefr_level}</span>
          </div>
          <p className="text-xs text-gray-400 mt-0.5 capitalize">{wotd.part_of_speech}</p>

          <AnimatePresence>
            {wotdOpen && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="mt-4 pt-4 border-t border-gray-100 dark:border-slate-700 space-y-3">
                  <div className="flex gap-3 items-start p-3 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-100 dark:border-red-900/40">
                    <span className="text-xl shrink-0">🇹🇷</span>
                    <p className="text-red-700 dark:text-red-300 font-bold">{wotd.definition_tr}</p>
                  </div>
                  <div className="flex gap-3 items-start">
                    <span className="text-xl shrink-0">🇬🇧</span>
                    <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed">{wotd.definition_en}</p>
                  </div>
                  {wotd.example_sentence && (
                    <p className="italic text-gray-400 dark:text-gray-500 text-sm bg-gray-50 dark:bg-slate-700/60 rounded-xl px-4 py-3">
                      "{wotd.example_sentence.replace(/\*\*/g, '')}"
                    </p>
                  )}
                  <Link to="/vocabulary" className="text-xs font-semibold text-primary-600 dark:text-primary-400 hover:underline">
                    Learn more words at your level →
                  </Link>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}

      {/* ── Stats ───────────────────────────────────────────────────────────── */}
      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <div key={i} className="card animate-pulse h-24 bg-gray-100 dark:bg-slate-700" />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Words Learned', value: stats.wordsLearned, icon: '📚', color: 'text-blue-600', to: '/vocabulary/saved' },
            { label: 'Due for Review', value: stats.wordsToReview, icon: '🔁', color: 'text-orange-500', to: '/vocabulary/review' },
            { label: 'Day Streak', value: streakCount, icon: '🔥', color: 'text-red-500', to: null },
            { label: 'Today', value: `${stats.dailyDone}/${stats.dailyGoal}`, icon: '🎯', color: 'text-accent-600', to: null },
          ].map((s) => {
            const inner = (
              <motion.div whileHover={{ y: -2 }} className={`card text-center transition-all ${s.to ? 'cursor-pointer hover:shadow-md' : ''}`}>
                <div className="text-2xl mb-1">{s.icon}</div>
                <div className={`text-2xl font-extrabold ${s.color}`}>{s.value}</div>
                <div className="text-xs text-gray-500 mt-1">{s.label}</div>
              </motion.div>
            )
            return s.to
              ? <Link key={s.label} to={s.to}>{inner}</Link>
              : <div key={s.label}>{inner}</div>
          })}
        </div>
      )}

      {/* ── Quick Actions ────────────────────────────────────────────────────── */}
      <div>
        <h2 className="font-bold text-gray-900 dark:text-white mb-3 text-sm uppercase tracking-wide">Practice Skills</h2>
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
          {quickActions.map((a) => (
            <Link key={a.path} to={a.path}>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                className="card text-center cursor-pointer hover:shadow-md transition-all py-4"
              >
                <div className={`w-10 h-10 ${a.color} rounded-xl flex items-center justify-center text-xl mx-auto mb-2`}>
                  {a.icon}
                </div>
                <p className="text-xs font-semibold text-gray-700 dark:text-gray-300">{a.label}</p>
              </motion.div>
            </Link>
          ))}
        </div>
      </div>

    </div>
  )
}

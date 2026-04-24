import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { useStore } from '../store/useStore'
import { supabase } from '../lib/supabase'

const badges = [
  { id: 'first-word', icon: '🌟', title: 'First Word', desc: 'Save your first word' },
  { id: 'vocab-10', icon: '📖', title: 'Word Collector', desc: 'Learn 10 words' },
  { id: 'vocab-50', icon: '📚', title: 'Vocabulary Builder', desc: 'Learn 50 words' },
  { id: 'vocab-100', icon: '🎓', title: 'Word Master', desc: 'Learn 100 words' },
  { id: 'week-warrior', icon: '🔥', title: 'Week Warrior', desc: '7-day learning streak' },
  { id: 'streak-30', icon: '⚡', title: 'Monthly Master', desc: '30-day learning streak' },
  { id: 'touch-saver', icon: '👆', title: 'Curious Reader', desc: 'Touch-save 5 words while reading' },
  { id: 'bookworm', icon: '📕', title: 'Bookworm', desc: 'Upload your first book' },
  { id: 'level-a2', icon: '🏅', title: 'Beyond Beginner', desc: 'Reach A2 level' },
  { id: 'level-b1', icon: '🥈', title: 'Intermediate', desc: 'Reach B1 level' },
  { id: 'level-b2', icon: '🥇', title: 'Upper Intermediate', desc: 'Reach B2 level' },
  { id: 'level-c1', icon: '💎', title: 'Advanced', desc: 'Reach C1 level' },
]

const LEVEL_ORDER = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2']

export default function Achievements() {
  const { profile } = useStore()
  const [unlocked, setUnlocked] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!profile) return
    const check = async () => {
      const earned = new Set<string>()

      const [knownRes, savedRes, touchRes, booksRes] = await Promise.all([
        supabase.from('user_words').select('id', { count: 'exact' }).eq('user_id', profile.id).eq('status', 'known'),
        supabase.from('user_words').select('id', { count: 'exact' }).eq('user_id', profile.id).eq('status', 'saved'),
        supabase.from('user_words').select('id', { count: 'exact' }).eq('user_id', profile.id).eq('save_source', 'touch'),
        supabase.from('books').select('id', { count: 'exact' }).eq('user_id', profile.id),
      ])

      const knownCount = knownRes.count || 0
      const totalWords = knownCount + (savedRes.count || 0)
      const touchCount = touchRes.count || 0
      const bookCount = booksRes.count || 0
      const streak = profile.streak_count || 0
      const levelIndex = LEVEL_ORDER.indexOf(profile.cefr_level)

      if (totalWords >= 1) earned.add('first-word')
      if (knownCount >= 10) earned.add('vocab-10')
      if (knownCount >= 50) earned.add('vocab-50')
      if (knownCount >= 100) earned.add('vocab-100')
      if (streak >= 7) earned.add('week-warrior')
      if (streak >= 30) earned.add('streak-30')
      if (touchCount >= 5) earned.add('touch-saver')
      if (bookCount >= 1) earned.add('bookworm')
      if (levelIndex >= 1) earned.add('level-a2')
      if (levelIndex >= 2) earned.add('level-b1')
      if (levelIndex >= 3) earned.add('level-b2')
      if (levelIndex >= 4) earned.add('level-c1')

      setUnlocked(earned)
      setLoading(false)
    }
    check()
  }, [profile])

  if (!profile) return null

  const earnedCount = unlocked.size

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">🏆 Achievements</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">{earnedCount} of {badges.length} badges earned</p>
      </div>

      <div className="w-full bg-gray-200 dark:bg-slate-700 rounded-full h-3">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${(earnedCount / badges.length) * 100}%` }}
          className="bg-accent-500 h-3 rounded-full"
        />
      </div>

      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {[...Array(12)].map((_, i) => <div key={i} className="card h-32 animate-pulse bg-gray-100 dark:bg-slate-700" />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {badges.map((badge, i) => {
            const earned = unlocked.has(badge.id)
            return (
              <motion.div
                key={badge.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.04 }}
                className={`card text-center transition-all ${earned ? 'ring-2 ring-accent-400 bg-accent-50 dark:bg-accent-900/10' : 'opacity-50'}`}
              >
                <div className={`text-4xl mb-3 ${!earned ? 'grayscale opacity-40' : ''}`}>{badge.icon}</div>
                <h3 className={`font-bold text-sm ${earned ? 'text-gray-900 dark:text-white' : 'text-gray-400'}`}>{badge.title}</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{badge.desc}</p>
                {earned && <span className="mt-2 inline-block text-xs text-accent-600 dark:text-accent-400 font-semibold">✅ Earned</span>}
              </motion.div>
            )
          })}
        </div>
      )}

      {/* Next to earn */}
      {!loading && earnedCount < badges.length && (
        <div className="card bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800">
          <h2 className="font-semibold text-primary-800 dark:text-primary-300 mb-3">🎯 Next to Earn</h2>
          <div className="flex flex-wrap gap-3">
            {badges.filter(b => !unlocked.has(b.id)).slice(0, 3).map(b => (
              <div key={b.id} className="flex items-center gap-2 bg-white dark:bg-slate-800 px-3 py-2 rounded-xl text-sm">
                <span className="grayscale opacity-40">{b.icon}</span>
                <span className="text-gray-600 dark:text-gray-400">{b.desc}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

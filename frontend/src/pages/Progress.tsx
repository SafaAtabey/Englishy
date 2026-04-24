import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { useStore } from '../store/useStore'
import { supabase } from '../lib/supabase'

const CEFR_ORDER = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2']
const WORDS_PER_LEVEL = 100

export default function Progress() {
  const { profile } = useStore()
  const [stats, setStats] = useState({ knownWords: 0, savedWords: 0, touchSaved: 0 })
  const [weekActivity, setWeekActivity] = useState<number[]>([0, 0, 0, 0, 0, 0, 0])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!profile) return
    const load = async () => {
      // Word counts
      const [knownRes, savedRes, touchRes] = await Promise.all([
        supabase.from('user_words').select('id', { count: 'exact' }).eq('user_id', profile.id).eq('status', 'known'),
        supabase.from('user_words').select('id', { count: 'exact' }).eq('user_id', profile.id).eq('status', 'saved'),
        supabase.from('user_words').select('id', { count: 'exact' }).eq('user_id', profile.id).eq('status', 'touch_saved'),
      ])

      // Weekly activity — words saved each day for past 7 days
      const days: number[] = []
      const now = new Date()
      for (let i = 6; i >= 0; i--) {
        const d = new Date(now)
        d.setDate(now.getDate() - i)
        const dayStart = d.toISOString().split('T')[0]
        const dayEnd = new Date(d.getTime() + 86400000).toISOString().split('T')[0]
        const { count } = await supabase
          .from('user_words')
          .select('id', { count: 'exact' })
          .eq('user_id', profile.id)
          .gte('saved_at', dayStart)
          .lt('saved_at', dayEnd)
        days.push(count || 0)
      }

      setStats({
        knownWords: knownRes.count || 0,
        savedWords: savedRes.count || 0,
        touchSaved: touchRes.count || 0,
      })
      setWeekActivity(days)
      setLoading(false)
    }
    load()
  }, [profile])

  if (!profile) return null

  const totalWords = stats.knownWords + stats.savedWords + stats.touchSaved
  const cefrIndex = CEFR_ORDER.indexOf(profile.cefr_level)
  const cefrProgress = Math.min((stats.knownWords % WORDS_PER_LEVEL) / WORDS_PER_LEVEL * 100, 100)

  const vocabScore = Math.min(Math.round((stats.knownWords / WORDS_PER_LEVEL) * 100), 100)
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
  const maxActivity = Math.max(...weekActivity, 1)

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">📊 Your Progress</h1>

      {/* CEFR level */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="font-bold text-gray-900 dark:text-white text-lg">CEFR Level Progress</h2>
            <p className="text-gray-500 text-sm">Current: <span className={`cefr-badge cefr-${profile.cefr_level.toLowerCase()}`}>{profile.cefr_level}</span></p>
          </div>
          {cefrIndex < 5 && (
            <div className="text-right">
              <p className="text-xs text-gray-500 mb-1">Next level</p>
              <span className={`cefr-badge cefr-${CEFR_ORDER[cefrIndex + 1]?.toLowerCase()}`}>{CEFR_ORDER[cefrIndex + 1]}</span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-1 mb-3">
          {CEFR_ORDER.map((lvl, i) => (
            <div key={lvl} className="flex-1 text-center">
              <div className={`h-3 rounded-full transition-all ${i < cefrIndex ? 'bg-primary-600' : i === cefrIndex ? 'bg-primary-400' : 'bg-gray-200 dark:bg-slate-700'}`} />
              <p className={`text-xs mt-1 ${i === cefrIndex ? 'font-bold text-primary-600' : 'text-gray-400'}`}>{lvl}</p>
            </div>
          ))}
        </div>
        <div>
          <div className="flex justify-between text-xs text-gray-500 mb-1">
            <span>Progress to {CEFR_ORDER[cefrIndex + 1] || 'mastery'} ({stats.knownWords % WORDS_PER_LEVEL}/{WORDS_PER_LEVEL} words)</span>
            <span>{Math.round(cefrProgress)}%</span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-slate-700 rounded-full h-2">
            <motion.div initial={{ width: 0 }} animate={{ width: `${cefrProgress}%` }} className="bg-primary-600 h-2 rounded-full" />
          </div>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {loading ? [...Array(4)].map((_, i) => <div key={i} className="card h-24 animate-pulse bg-gray-100 dark:bg-slate-700" />) : [
          { label: 'Words Learned', value: stats.knownWords, icon: '📚', color: 'text-blue-600' },
          { label: 'Saved for Review', value: stats.savedWords, icon: '📌', color: 'text-orange-500' },
          { label: 'Touch Saved', value: stats.touchSaved, icon: '👆', color: 'text-yellow-600' },
          { label: 'Day Streak', value: `🔥 ${profile.streak_count}`, icon: '', color: 'text-red-500' },
        ].map((s) => (
          <div key={s.label} className="card text-center">
            <div className={`text-2xl font-extrabold ${s.color}`}>{s.value}</div>
            <div className="text-xs text-gray-500 mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Vocabulary skill bar */}
      <div className="card">
        <h2 className="font-bold text-gray-900 dark:text-white mb-4">Vocabulary Progress</h2>
        <div className="flex items-center gap-4">
          <div className="w-8 text-lg">📚</div>
          <div className="w-28 text-sm font-medium text-gray-700 dark:text-gray-300">Vocabulary</div>
          <div className="flex-1 bg-gray-200 dark:bg-slate-700 rounded-full h-3">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${vocabScore}%` }}
              className="h-3 rounded-full bg-primary-600"
            />
          </div>
          <div className="w-12 text-sm font-semibold text-gray-600 dark:text-gray-400 text-right">{vocabScore}%</div>
        </div>
        <p className="text-xs text-gray-400 mt-3 text-center">{totalWords} total words in your collection</p>
      </div>

      {/* Weekly activity */}
      <div className="card">
        <h2 className="font-bold text-gray-900 dark:text-white mb-4">This Week's Activity</h2>
        {loading ? (
          <div className="flex gap-2 items-end h-20">
            {[...Array(7)].map((_, i) => <div key={i} className="flex-1 bg-gray-100 dark:bg-slate-700 rounded-lg animate-pulse" style={{ height: `${20 + Math.random() * 60}px` }} />)}
          </div>
        ) : (
          <div className="flex gap-2 items-end">
            {days.map((day, i) => {
              const val = weekActivity[i]
              const height = Math.max((val / maxActivity) * 80, val > 0 ? 12 : 4)
              return (
                <div key={day} className="flex-1 flex flex-col items-center gap-1">
                  {val > 0 && <span className="text-xs text-primary-600 font-bold">{val}</span>}
                  <div
                    className={`w-full rounded-lg transition-all ${val > 0 ? 'bg-primary-600' : 'bg-gray-200 dark:bg-slate-700'}`}
                    style={{ height: `${height}px` }}
                  />
                  <span className="text-xs text-gray-400">{day}</span>
                </div>
              )
            })}
          </div>
        )}
        {!loading && weekActivity.every(v => v === 0) && (
          <p className="text-center text-sm text-gray-400 mt-3">No activity this week — start learning today!</p>
        )}
      </div>
    </div>
  )
}

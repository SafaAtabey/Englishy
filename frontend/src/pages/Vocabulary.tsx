import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useStore } from '../store/useStore'
import { supabase } from '../lib/supabase'
import { api } from '../lib/api'
import type { Word } from '../types'

export default function Vocabulary() {
  const { profile } = useStore()
  const [words, setWords] = useState<Word[]>([])
  const [index, setIndex] = useState(0)
  const [direction, setDirection] = useState(1)
  const [sessionDone, setSessionDone] = useState(false)
  const [known, setKnown] = useState(0)
  const [savedCount, setSavedCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [showExample, setShowExample] = useState(false)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [mnemonic, setMnemonic] = useState<string | null>(null)
  const [mnemonicLoading, setMnemonicLoading] = useState(false)

  const level = profile?.cefr_level || 'B1'

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      try {
        const res = await api.getWords(level, 20)
        if (res.words && res.words.length > 0) {
          setWords(res.words)
        } else {
          const aiRes = await api.getAIWords(level, [])
          setWords(aiRes.words || [])
        }
      } catch {
        setWords([])
      }
      setLoading(false)
    }
    load()
  }, [level])

  const current = words[index]

  // Fetch Free Dictionary API audio when word changes
  useEffect(() => {
    if (!current) return
    setAudioUrl(null)
    setMnemonic(null)
    setShowExample(false)

    fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(current.word)}`)
      .then(r => (r.ok ? r.json() : null))
      .then((data: any) => {
        if (!data?.[0]) return
        const audio = (data[0].phonetics || []).find((p: any) => p.audio)?.audio || null
        if (audio) setAudioUrl(audio)
      })
      .catch(() => {})
  }, [current?.word])

  const speak = (word: string) => {
    if (audioUrl) {
      new Audio(audioUrl).play().catch(() => speakTTS(word))
    } else {
      speakTTS(word)
    }
  }

  const speakTTS = (word: string) => {
    if (!('speechSynthesis' in window)) return
    const u = new SpeechSynthesisUtterance(word)
    u.lang = 'en-US'
    u.rate = 0.85
    const voices = window.speechSynthesis.getVoices()
    const v = voices.find(v => v.lang === 'en-US') || voices.find(v => v.lang.startsWith('en'))
    if (v) u.voice = v
    window.speechSynthesis.speak(u)
  }

  const generateMnemonic = async () => {
    if (!current || mnemonicLoading) return
    setMnemonicLoading(true)
    try {
      const result = await api.generateMnemonic(current.word, current.definition_tr)
      setMnemonic(result.mnemonic)
    } catch {
      setMnemonic('Could not generate a memory tip right now.')
    }
    setMnemonicLoading(false)
  }

  const saveToSupabase = async (word: Word, status: 'known' | 'saved') => {
    if (!profile) return
    let wordId: string | undefined =
      word.id && word.id !== word.word && word.id.includes('-') ? word.id : undefined
    if (!wordId) {
      const { data } = await supabase.from('words').select('id').eq('word', word.word.toLowerCase()).single()
      wordId = data?.id
    }
    if (!wordId) return
    const daysAhead = status === 'known' ? 7 : 1
    await supabase.from('user_words').upsert(
      {
        user_id: profile.id,
        word_id: wordId,
        status,
        save_source: 'flashcard',
        times_seen: 1,
        times_correct: status === 'known' ? 1 : 0,
        next_review_date: new Date(Date.now() + daysAhead * 86400000).toISOString().split('T')[0],
      },
      { onConflict: 'user_id,word_id' }
    )
  }

  const advance = (dir: 1 | -1) => {
    setDirection(dir)
    setTimeout(() => {
      if (index + 1 >= words.length) setSessionDone(true)
      else setIndex(i => i + 1)
    }, 80)
  }

  const handleKnow = async () => {
    if (current) await saveToSupabase(current, 'known')
    setKnown(k => k + 1)
    advance(1)
  }

  const handleSave = async () => {
    if (current) await saveToSupabase(current, 'saved')
    setSavedCount(s => s + 1)
    advance(1)
  }

  // ── LOADING ───────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="max-w-lg mx-auto space-y-6">
        <Header level={level} />
        <div className="card min-h-[480px] flex flex-col items-center justify-center gap-4">
          <div className="flex gap-1.5">
            {[0, 1, 2].map(i => (
              <motion.div key={i} className="w-2.5 h-2.5 rounded-full bg-primary-400"
                animate={{ y: [0, -8, 0] }} transition={{ repeat: Infinity, duration: 0.7, delay: i * 0.15 }} />
            ))}
          </div>
          <p className="text-gray-400 text-sm">Loading {level} words...</p>
        </div>
      </div>
    )
  }

  if (words.length === 0) {
    return (
      <div className="max-w-lg mx-auto text-center py-20 space-y-4">
        <div className="text-5xl">😕</div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Could not load words</h2>
        <p className="text-sm text-gray-400">Make sure your backend is running.</p>
        <button onClick={() => window.location.reload()} className="btn-primary px-8">Try Again</button>
      </div>
    )
  }

  // ── SESSION DONE ──────────────────────────────────────────────────────────
  if (sessionDone) {
    const accuracy = Math.round((known / words.length) * 100)
    return (
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="max-w-lg mx-auto text-center py-12 space-y-6"
      >
        <div className="w-24 h-24 mx-auto rounded-3xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center text-5xl shadow-xl">
          🎉
        </div>
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white">Session Done!</h1>
          <p className="text-gray-400 mt-1">{words.length} words reviewed</p>
        </div>
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Known', value: known, color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
            { label: 'Saved', value: savedCount, color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-900/20' },
            { label: 'Score', value: `${accuracy}%`, color: 'text-primary-600', bg: 'bg-primary-50 dark:bg-primary-900/20' },
          ].map(s => (
            <div key={s.label} className={`${s.bg} rounded-2xl p-4`}>
              <p className={`text-2xl font-extrabold ${s.color}`}>{s.value}</p>
              <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => { setIndex(0); setSessionDone(false); setKnown(0); setSavedCount(0) }}
            className="flex-1 btn-primary"
          >Restart</button>
          <Link to="/vocabulary/practice" className="flex-1 btn-outline text-center">Practice →</Link>
        </div>
      </motion.div>
    )
  }

  if (!current) return null

  const progress = (index / words.length) * 100

  // ── MAIN CARD ─────────────────────────────────────────────────────────────
  return (
    <div className="max-w-lg mx-auto space-y-5">
      <Header level={level} />

      {/* Progress */}
      <div className="space-y-1.5">
        <div className="flex justify-between text-xs text-gray-400">
          <span>{index + 1} / {words.length}</span>
          <span className="flex gap-3">
            <span className="text-emerald-500 font-medium">✓ {known}</span>
            <span className="text-amber-500 font-medium">📌 {savedCount}</span>
          </span>
        </div>
        <div className="h-1.5 bg-gray-100 dark:bg-slate-700 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-primary-500 to-primary-600 rounded-full"
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={current.id + '-' + index}
          initial={{ opacity: 0, x: direction * 50 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: direction * -50 }}
          transition={{ duration: 0.18 }}
          className="space-y-3"
        >
          {/* ── Word Card ─────────────────────────────────────────────────── */}
          <div className="card space-y-5">

            {/* Word + Audio */}
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <span className={`cefr-badge cefr-${current.cefr_level.toLowerCase()}`}>{current.cefr_level}</span>
                  <span className="text-xs text-gray-400 bg-gray-100 dark:bg-slate-700 px-2 py-0.5 rounded-full capitalize">{current.part_of_speech}</span>
                </div>
                <h2 className="text-5xl font-extrabold text-gray-900 dark:text-white tracking-tight leading-none">{current.word}</h2>
                {current.phonetic && (
                  <p className="text-gray-400 font-mono text-sm mt-2">{current.phonetic}</p>
                )}
              </div>
              <button
                onClick={() => speak(current.word)}
                className="w-12 h-12 rounded-2xl bg-primary-50 dark:bg-primary-900/30 flex items-center justify-center text-primary-600 hover:bg-primary-100 dark:hover:bg-primary-900/50 transition-colors shrink-0 text-xl mt-1"
              >
                🔊
              </button>
            </div>

            <div className="h-px bg-gray-100 dark:bg-slate-700" />

            {/* Turkish — always visible */}
            <div className="flex gap-3 items-start p-4 bg-red-50 dark:bg-red-900/20 rounded-2xl border border-red-100 dark:border-red-900/40">
              <span className="text-2xl shrink-0">🇹🇷</span>
              <div>
                <p className="text-xs text-red-400 font-semibold uppercase tracking-wider mb-1">Türkçe</p>
                <p className="text-red-700 dark:text-red-300 font-bold text-lg leading-snug">{current.definition_tr}</p>
              </div>
            </div>

            {/* English definition */}
            <div className="flex gap-3 items-start">
              <span className="text-xl shrink-0 mt-0.5">🇬🇧</span>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed">{current.definition_en}</p>
            </div>

            {/* Example sentence — toggle */}
            {current.example_sentence && (
              <div>
                <button
                  onClick={() => setShowExample(e => !e)}
                  className="text-xs font-semibold text-primary-600 dark:text-primary-400 hover:underline"
                >
                  {showExample ? '▲ Hide example' : '▼ Show example sentence'}
                </button>
                <AnimatePresence>
                  {showExample && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden mt-2"
                    >
                      <p className="italic text-gray-500 dark:text-gray-400 text-sm bg-gray-50 dark:bg-slate-700 rounded-xl px-4 py-3 leading-relaxed">
                        "{current.example_sentence.replace(/\*\*/g, '')}"
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}

            {/* Synonyms */}
            {current.synonyms?.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                <span className="text-xs text-gray-400 font-semibold mr-1 self-center">Also:</span>
                {current.synonyms.map(s => (
                  <span key={s} className="text-xs px-2.5 py-1 bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-400 rounded-full">{s}</span>
                ))}
              </div>
            )}

            <div className="h-px bg-gray-100 dark:bg-slate-700" />

            {/* AI Mnemonic */}
            {mnemonic ? (
              <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-xl border border-purple-100 dark:border-purple-800"
              >
                <p className="text-xs font-semibold text-purple-500 dark:text-purple-400 mb-1">💡 Memory Tip</p>
                <p className="text-sm text-purple-800 dark:text-purple-200 leading-relaxed">{mnemonic}</p>
              </motion.div>
            ) : (
              <button
                onClick={generateMnemonic}
                disabled={mnemonicLoading}
                className="w-full py-2.5 rounded-xl border border-dashed border-purple-300 dark:border-purple-700 text-purple-600 dark:text-purple-400 text-sm font-medium hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors disabled:opacity-50"
              >
                {mnemonicLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <motion.span animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}>⚙️</motion.span>
                    Generating memory tip...
                  </span>
                ) : '💡 Generate Memory Tip'}
              </button>
            )}
          </div>

          {/* ── Action Buttons ─────────────────────────────────────────────── */}
          <div className="grid grid-cols-2 gap-3">
            <motion.button whileTap={{ scale: 0.97 }} onClick={handleSave}
              className="py-4 rounded-2xl font-bold text-base transition-all bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 border-2 border-amber-200 dark:border-amber-800 hover:bg-amber-100"
            >
              📌 Study Later
            </motion.button>
            <motion.button whileTap={{ scale: 0.97 }} onClick={handleKnow}
              className="py-4 rounded-2xl font-bold text-base transition-all bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 border-2 border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100"
            >
              ✓ I Know It
            </motion.button>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  )
}

function Header({ level }: { level: string }) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white">Vocabulary</h1>
        <p className="text-sm text-gray-400 mt-0.5">
          Level <span className={`cefr-badge cefr-${level.toLowerCase()} text-xs`}>{level}</span>
        </p>
      </div>
      <div className="flex gap-2">
        <Link to="/vocabulary/saved" className="w-9 h-9 rounded-xl bg-gray-100 dark:bg-slate-700 flex items-center justify-center hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors" title="Saved Words">📌</Link>
        <Link to="/vocabulary/review" className="w-9 h-9 rounded-xl bg-gray-100 dark:bg-slate-700 flex items-center justify-center hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors" title="SRS Review">🔁</Link>
        <Link to="/vocabulary/practice" className="w-9 h-9 rounded-xl bg-gray-100 dark:bg-slate-700 flex items-center justify-center hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors" title="Practice">🎯</Link>
      </div>
    </div>
  )
}

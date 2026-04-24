import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useStore } from '../store/useStore'
import { supabase } from '../lib/supabase'
import { api } from '../lib/api'
import { shuffle } from '../lib/sm2'
import type { UserWord } from '../types'

type Mode = 'multiple-choice' | 'scrambled' | 'fill-blank' | 'spelling' | 'write-sentence'

const MODES: { id: Mode; icon: string; title: string; desc: string }[] = [
  { id: 'multiple-choice', icon: '🎯', title: 'Multiple Choice', desc: 'Pick the correct word for the definition' },
  { id: 'scrambled', icon: '🔀', title: 'Scramble Sentence', desc: 'Tap words to rebuild the sentence' },
  { id: 'fill-blank', icon: '✍️', title: 'Fill in the Blank', desc: 'Complete the example sentence' },
  { id: 'spelling', icon: '🔤', title: 'Spelling Challenge', desc: 'Hear the word → type the spelling' },
  { id: 'write-sentence', icon: '📝', title: 'Write a Sentence', desc: 'Use the word in your own sentence (AI graded)' },
]

interface Result { word: string; correct: boolean; xp: number }

export default function VocabPractice() {
  const { profile } = useStore()
  const [mode, setMode] = useState<Mode | null>(null)
  const [queue, setQueue] = useState<UserWord[]>([])
  const [index, setIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  const [results, setResults] = useState<Result[]>([])
  const [done, setDone] = useState(false)

  // Per-card state
  const [revealed, setRevealed] = useState(false)
  const [input, setInput] = useState('')
  const [feedback, setFeedback] = useState<{ correct: boolean; message: string } | null>(null)
  const [grading, setGrading] = useState(false)
  const [letterFeedback, setLetterFeedback] = useState<('correct' | 'wrong' | 'neutral')[]>([])

  // Multiple choice
  const [mcOptions, setMcOptions] = useState<UserWord[]>([])
  const [mcChosen, setMcChosen] = useState<string | null>(null)

  // Scrambled
  const [scramblePool, setScramblePool] = useState<string[]>([])
  const [scrambleBuilt, setScrambleBuilt] = useState<string[]>([])
  const [scrambleChecked, setScrambleChecked] = useState(false)

  useEffect(() => {
    if (!profile) return
    const load = async () => {
      const { data } = await supabase
        .from('user_words')
        .select('*, word:words(*)')
        .eq('user_id', profile.id)
        .in('status', ['saved', 'touch_saved', 'learning'])
        .order('next_review_date', { ascending: true, nullsFirst: false })
        .limit(20)
      setQueue(data || [])
      setLoading(false)
    }
    load()
  }, [profile])

  const current = queue[index]

  // Reset per-card state when mode or index changes
  useEffect(() => {
    setRevealed(false)
    setInput('')
    setFeedback(null)
    setLetterFeedback([])
    setMcChosen(null)
    setScrambleChecked(false)
    setScrambleBuilt([])

    if (!current?.word) return

    if (mode === 'multiple-choice') {
      const others = queue.filter((_, i) => i !== index).filter(u => u.word).slice(0, 3)
      setMcOptions(shuffle([current, ...others]))
    }

    if (mode === 'scrambled') {
      const sentence = current.word.example_sentence?.replace(/\*\*/g, '').trim() || ''
      const words = sentence.split(/\s+/).filter(Boolean)
      setScramblePool(shuffle(words))
    }
  }, [index, mode])

  const speak = (text: string) => {
    if (!('speechSynthesis' in window)) return
    const u = new SpeechSynthesisUtterance(text)
    u.lang = 'en-US'; u.rate = 0.85
    window.speechSynthesis.speak(u)
  }

  const advance = (correct: boolean, xp: number) => {
    if (current?.word) {
      setResults(r => [...r, { word: current.word!.word, correct, xp }])
      supabase.from('user_words').update({
        times_seen: current.times_seen + 1,
        times_correct: correct ? current.times_correct + 1 : current.times_correct,
        next_review_date: correct
          ? new Date(Date.now() + current.interval_days * 86400000).toISOString().split('T')[0]
          : new Date(Date.now() + 86400000).toISOString().split('T')[0],
      }).eq('id', current.id).then(() => {})
    }
    if (index + 1 >= queue.length) setDone(true)
    else setIndex(i => i + 1)
  }

  // ── Multiple Choice handler ─────────────────────────────────────────────
  const handleMCChoice = (chosen: UserWord) => {
    if (mcChosen !== null) return
    setMcChosen(chosen.word!.word)
    const correct = chosen.id === current.id
    setTimeout(() => advance(correct, correct ? 20 : 5), 1000)
  }

  // ── Scramble handlers ───────────────────────────────────────────────────
  const scrambleTapPool = (word: string, idx: number) => {
    if (scrambleChecked) return
    setScrambleBuilt(b => [...b, word])
    setScramblePool(p => p.filter((_, i) => i !== idx))
  }
  const scrambleTapBuilt = (word: string, idx: number) => {
    if (scrambleChecked) return
    setScramblePool(p => [...p, word])
    setScrambleBuilt(b => b.filter((_, i) => i !== idx))
  }
  const scrambleCheck = () => {
    const target = current.word?.example_sentence?.replace(/\*\*/g, '').trim() || ''
    const built = scrambleBuilt.join(' ')
    const correct = built === target
    setScrambleChecked(true)
    setFeedback({ correct, message: correct ? '✅ Perfect!' : `❌ Correct: "${target}"` })
    setTimeout(() => advance(correct, correct ? 25 : 5), 1800)
  }

  // ── Fill blank ──────────────────────────────────────────────────────────
  const checkFillBlank = () => {
    const correct = input.toLowerCase().trim() === current.word!.word.toLowerCase()
    setFeedback({ correct, message: correct ? '✅ Correct!' : `❌ Answer: "${current.word!.word}"` })
    setTimeout(() => advance(correct, correct ? 20 : 5), 1500)
  }

  // ── Spelling ────────────────────────────────────────────────────────────
  const checkSpelling = () => {
    const target = current.word!.word.toLowerCase()
    const attempt = input.toLowerCase().trim()
    const fb = target.split('').map((ch, i) =>
      attempt[i] === ch ? 'correct' : attempt[i] !== undefined ? 'wrong' : 'neutral'
    ) as ('correct' | 'wrong' | 'neutral')[]
    setLetterFeedback(fb)
    const correct = attempt === target
    setFeedback({ correct, message: correct ? '✅ Perfect spelling!' : `❌ Correct: "${target}"` })
    setTimeout(() => advance(correct, correct ? 20 : 5), 1500)
  }

  // ── Write sentence ──────────────────────────────────────────────────────
  const checkWriteSentence = async () => {
    if (!current?.word || input.trim().length < 5) return
    setGrading(true)
    try {
      const result = await api.gradeWrittenSentence(current.word.word, input, profile?.cefr_level || 'B1')
      setFeedback({ correct: result.correct, message: result.feedback })
      if (result.correct && current.times_correct + 1 >= 2) {
        await supabase.from('user_words').update({ status: 'known' }).eq('id', current.id)
      }
      setTimeout(() => advance(result.correct, result.correct ? 30 : 10), 2500)
    } catch {
      setFeedback({ correct: false, message: 'Could not grade — check your connection.' })
      setTimeout(() => advance(false, 0), 1500)
    }
    setGrading(false)
  }

  // ── Guards ──────────────────────────────────────────────────────────────
  if (loading) return <div className="flex items-center justify-center h-64 text-4xl animate-spin">⚙️</div>

  if (queue.length === 0) {
    return (
      <div className="max-w-lg mx-auto text-center py-20">
        <div className="text-7xl mb-6">📭</div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">No saved words yet!</h1>
        <p className="text-gray-500 mb-8">Save words from Vocabulary, Reading, or Listening first.</p>
        <Link to="/vocabulary" className="btn-primary">Learn New Words</Link>
      </div>
    )
  }

  // ── Mode selection ──────────────────────────────────────────────────────
  if (!mode) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">🎯 Practice Your Saved Words</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">You have <strong>{queue.length}</strong> words ready to practice</p>
        </div>
        <div className="space-y-3">
          {MODES.map((m) => (
            <motion.button key={m.id} whileHover={{ y: -1 }} whileTap={{ scale: 0.99 }}
              onClick={() => setMode(m.id)}
              className="w-full card text-left flex items-center gap-4 hover:shadow-lg hover:border-primary-200 dark:hover:border-primary-800 transition-all border-2 border-transparent"
            >
              <span className="text-4xl w-14 text-center">{m.icon}</span>
              <div className="flex-1">
                <h3 className="font-bold text-gray-900 dark:text-white">{m.title}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">{m.desc}</p>
              </div>
              <span className="text-gray-400 text-xl">→</span>
            </motion.button>
          ))}
        </div>
      </div>
    )
  }

  // ── Done ─────────────────────────────────────────────────────────────────
  if (done) {
    const totalXP = results.reduce((s, r) => s + r.xp, 0)
    const mastered = results.filter(r => r.correct).length
    return (
      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
        className="max-w-lg mx-auto text-center py-16 space-y-6"
      >
        <div className="text-7xl">🏆</div>
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Practice Complete!</h1>
          <p className="text-gray-500 mt-2">Tebrikler!</p>
        </div>
        <div className="card">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div><p className="text-3xl font-extrabold text-accent-500">+{totalXP}</p><p className="text-xs text-gray-500 mt-1">XP</p></div>
            <div><p className="text-3xl font-extrabold text-primary-600">{mastered}</p><p className="text-xs text-gray-500 mt-1">Correct</p></div>
            <div><p className="text-3xl font-extrabold text-orange-500">{results.length - mastered}</p><p className="text-xs text-gray-500 mt-1">Review</p></div>
          </div>
        </div>
        {results.filter(r => !r.correct).length > 0 && (
          <div className="card text-left">
            <h3 className="font-semibold text-gray-700 dark:text-gray-300 mb-2 text-sm">Keep practicing:</h3>
            <div className="flex flex-wrap gap-2">
              {results.filter(r => !r.correct).map(r => (
                <span key={r.word} className="px-3 py-1 bg-orange-100 dark:bg-orange-900/20 text-orange-700 dark:text-orange-400 rounded-full text-sm">{r.word}</span>
              ))}
            </div>
          </div>
        )}
        <div className="flex gap-4">
          <button onClick={() => { setMode(null); setIndex(0); setDone(false); setResults([]) }} className="btn-outline flex-1">Try Another Mode</button>
          <Link to="/dashboard" className="btn-primary flex-1">Dashboard</Link>
        </div>
      </motion.div>
    )
  }

  if (!current?.word) return null

  // ── Active practice ───────────────────────────────────────────────────────
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">
            {MODES.find(m => m.id === mode)?.icon} {MODES.find(m => m.id === mode)?.title}
          </h1>
          <p className="text-xs text-gray-500">{index + 1} / {queue.length}</p>
        </div>
        <button onClick={() => setMode(null)} className="text-sm text-gray-400 hover:text-gray-600">← Modes</button>
      </div>

      <div className="h-1.5 bg-gray-100 dark:bg-slate-700 rounded-full overflow-hidden">
        <motion.div className="h-1.5 bg-gradient-to-r from-primary-500 to-primary-600 rounded-full"
          animate={{ width: `${(index / queue.length) * 100}%` }} transition={{ duration: 0.3 }} />
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={`${mode}-${current.id}`}
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
          className="card space-y-5"
        >

          {/* ── MULTIPLE CHOICE ─────────────────────────────────────────── */}
          {mode === 'multiple-choice' && (
            <>
              <div className="space-y-2">
                <p className="text-xs text-gray-400 font-semibold uppercase tracking-wide">Which word means…?</p>
                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
                  <p className="text-gray-800 dark:text-gray-200 font-medium">{current.word.definition_en}</p>
                </div>
                <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-xl">
                  <p className="text-xs text-gray-400 mb-0.5">🇹🇷 Türkçe</p>
                  <p className="text-red-700 dark:text-red-300 font-semibold text-sm">{current.word.definition_tr}</p>
                </div>
              </div>
              <div className="space-y-2">
                {mcOptions.map((opt) => {
                  if (!opt.word) return null
                  const chosen = mcChosen !== null
                  const isCorrect = opt.id === current.id
                  const isChosen = mcChosen === opt.word.word
                  return (
                    <motion.button key={opt.id} whileTap={chosen ? {} : { scale: 0.99 }}
                      onClick={() => handleMCChoice(opt)}
                      disabled={chosen}
                      className={`w-full text-left px-5 py-3 rounded-2xl border-2 font-medium transition-all ${
                        !chosen
                          ? 'border-gray-200 dark:border-slate-600 text-gray-700 dark:text-gray-300 hover:border-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/10'
                          : isCorrect
                          ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300'
                          : isChosen
                          ? 'border-red-400 bg-red-50 dark:bg-red-900/20 text-red-600'
                          : 'border-gray-200 dark:border-slate-600 text-gray-400 opacity-50'
                      }`}
                    >
                      {opt.word.word}
                      {chosen && isCorrect && <span className="float-right">✓</span>}
                      {chosen && isChosen && !isCorrect && <span className="float-right">✗</span>}
                    </motion.button>
                  )
                })}
              </div>
            </>
          )}

          {/* ── SCRAMBLED SENTENCE ──────────────────────────────────────── */}
          {mode === 'scrambled' && (
            <>
              <div>
                <p className="text-xs text-gray-400 font-semibold uppercase tracking-wide mb-2">Rebuild the sentence using:</p>
                <div className="flex items-center justify-center gap-2 flex-wrap p-3 bg-primary-50 dark:bg-primary-900/20 rounded-xl">
                  <span className="text-4xl font-extrabold text-gray-900 dark:text-white">{current.word.word}</span>
                  <span className={`cefr-badge cefr-${current.word.cefr_level.toLowerCase()}`}>{current.word.cefr_level}</span>
                </div>
              </div>

              {/* Built sentence */}
              <div className="min-h-12 p-3 border-2 border-dashed border-gray-200 dark:border-slate-600 rounded-xl flex flex-wrap gap-2 items-center">
                {scrambleBuilt.length === 0 && (
                  <span className="text-gray-400 text-sm">Tap words below to build the sentence…</span>
                )}
                {scrambleBuilt.map((w, i) => (
                  <motion.button key={`${w}-${i}`} initial={{ scale: 0.8 }} animate={{ scale: 1 }}
                    onClick={() => scrambleTapBuilt(w, i)}
                    disabled={scrambleChecked}
                    className="px-3 py-1.5 bg-primary-100 dark:bg-primary-900/40 text-primary-700 dark:text-primary-300 rounded-lg text-sm font-medium border border-primary-200 dark:border-primary-700 hover:bg-primary-200 transition-colors disabled:cursor-default"
                  >
                    {w}
                  </motion.button>
                ))}
              </div>

              {/* Word pool */}
              <div className="flex flex-wrap gap-2">
                {scramblePool.map((w, i) => (
                  <motion.button key={`${w}-${i}`} whileTap={{ scale: 0.95 }}
                    onClick={() => scrambleTapPool(w, i)}
                    disabled={scrambleChecked}
                    className="px-3 py-1.5 bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors"
                  >
                    {w}
                  </motion.button>
                ))}
              </div>

              {feedback ? (
                <div className={`p-4 rounded-xl text-center font-bold ${feedback.correct ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300' : 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400'}`}>
                  {feedback.message}
                </div>
              ) : (
                <button
                  onClick={scrambleCheck}
                  disabled={scrambleBuilt.length === 0}
                  className="btn-primary w-full"
                >
                  Check Answer
                </button>
              )}
            </>
          )}

          {/* ── FILL IN THE BLANK ───────────────────────────────────────── */}
          {mode === 'fill-blank' && (
            <>
              <div>
                <p className="text-xs text-gray-400 font-semibold uppercase tracking-wide mb-2">Complete the sentence:</p>
                <p className="text-lg text-gray-800 dark:text-gray-200 leading-relaxed italic">
                  "{current.word.example_sentence?.replace(/\*\*[^*]+\*\*/g, '_______').replace(/\*\*/g, '')}"
                </p>
                <div className="flex gap-2 mt-2">
                  <span className={`cefr-badge cefr-${current.word.cefr_level.toLowerCase()}`}>{current.word.cefr_level}</span>
                  <span className="cefr-badge bg-gray-100 dark:bg-slate-700 text-gray-600">{current.word.part_of_speech}</span>
                </div>
              </div>
              <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-xl">
                <p className="text-xs text-gray-400 mb-1">🇹🇷 Hint</p>
                <p className="text-sm text-primary-600 dark:text-primary-400 font-medium">{current.word.definition_tr}</p>
              </div>
              {!feedback ? (
                <>
                  <input className="input-field text-lg" placeholder="Type the missing word…" value={input} onChange={e => setInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && input.trim() && checkFillBlank()} />
                  <button onClick={checkFillBlank} disabled={!input.trim()} className="btn-primary w-full">Check Answer</button>
                </>
              ) : (
                <div className={`p-4 rounded-xl text-center font-bold text-lg ${feedback.correct ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400' : 'bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400'}`}>
                  {feedback.message}
                </div>
              )}
            </>
          )}

          {/* ── SPELLING CHALLENGE ──────────────────────────────────────── */}
          {mode === 'spelling' && (
            <>
              <div className="text-center space-y-4">
                <button onClick={() => speak(current.word?.word ?? '')}
                  className="w-16 h-16 rounded-full bg-primary-100 dark:bg-primary-900/30 text-primary-600 text-3xl mx-auto flex items-center justify-center hover:bg-primary-200 transition-colors">
                  🔊
                </button>
                <p className="text-sm text-gray-500">Listen, then type the spelling</p>
                <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-xl">
                  <p className="text-xs text-gray-400 mb-1">🇹🇷 Hint</p>
                  <p className="text-sm text-primary-600 dark:text-primary-400">{current.word.definition_tr}</p>
                </div>
              </div>
              {!feedback ? (
                <>
                  <input className="input-field text-lg text-center" placeholder="Type the spelling…" value={input} onChange={e => setInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && input.trim() && checkSpelling()} />
                  <button onClick={checkSpelling} disabled={!input.trim()} className="btn-primary w-full">Check Spelling</button>
                </>
              ) : (
                <div className="space-y-3">
                  <div className="flex justify-center gap-1 flex-wrap">
                    {current.word.word.split('').map((ch, i) => (
                      <span key={i} className={`w-9 h-9 rounded-lg flex items-center justify-center font-bold text-white text-lg ${letterFeedback[i] === 'correct' ? 'bg-emerald-500' : letterFeedback[i] === 'wrong' ? 'bg-red-500' : 'bg-gray-400'}`}>
                        {ch}
                      </span>
                    ))}
                  </div>
                  <p className={`text-center font-bold text-lg ${feedback.correct ? 'text-emerald-600' : 'text-red-500'}`}>{feedback.message}</p>
                </div>
              )}
            </>
          )}

          {/* ── WRITE A SENTENCE ────────────────────────────────────────── */}
          {mode === 'write-sentence' && (
            <>
              <div className="space-y-3">
                <div className="text-center">
                  <h2 className="text-4xl font-extrabold text-gray-900 dark:text-white">{current.word.word}</h2>
                  <p className="text-gray-400 font-mono text-sm">{current.word.phonetic}</p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl text-sm">
                    <p className="text-xs text-gray-400 mb-1">🇬🇧</p>
                    <p className="text-gray-700 dark:text-gray-300">{current.word.definition_en}</p>
                  </div>
                  <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-xl text-sm">
                    <p className="text-xs text-gray-400 mb-1">🇹🇷</p>
                    <p className="text-primary-700 dark:text-primary-400">{current.word.definition_tr}</p>
                  </div>
                </div>
              </div>
              {!feedback ? (
                <>
                  <textarea className="input-field min-h-24 resize-none"
                    placeholder={`Write a sentence using "${current.word.word}"…`}
                    value={input} onChange={e => setInput(e.target.value)}
                  />
                  <button onClick={checkWriteSentence} disabled={grading || input.trim().length < 5} className="btn-primary w-full">
                    {grading ? <span className="flex items-center justify-center gap-2"><span className="animate-spin">⚙️</span> AI grading…</span> : 'Submit for AI Grading →'}
                  </button>
                </>
              ) : (
                <div className={`p-4 rounded-xl ${feedback.correct ? 'bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200' : 'bg-orange-50 dark:bg-orange-900/20 border border-orange-200'}`}>
                  <p className={`font-bold mb-1 ${feedback.correct ? 'text-emerald-700 dark:text-emerald-400' : 'text-orange-700 dark:text-orange-400'}`}>
                    {feedback.correct ? '✅ Great sentence!' : '⚠️ Needs work'}
                  </p>
                  <p className="text-sm text-gray-700 dark:text-gray-300">{feedback.message}</p>
                </div>
              )}
            </>
          )}

        </motion.div>
      </AnimatePresence>
    </div>
  )
}

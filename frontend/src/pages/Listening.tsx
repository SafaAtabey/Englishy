import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useStore } from '../store/useStore'
import { api } from '../lib/api'
import WordPopup from '../components/WordPopup'
import type { WordPopupData } from '../types'

interface Exercise {
  id: number
  type: 'fill-blank' | 'true-false' | 'dictation'
  level: string
  title: string
  audioText: string
  transcript: string
  answer?: string | boolean
  options?: string[]
  question?: string
  targetSentence?: string
}

const FALLBACK: Exercise[] = [
  { id: 1, type: 'fill-blank', level: 'B1', title: 'At the Coffee Shop', audioText: 'Can I have a large coffee, please? And a chocolate muffin, too.', transcript: 'Can I have a large coffee, please? And a chocolate ___, too.', answer: 'muffin', options: ['cake', 'muffin', 'cookie', 'bread'] },
  { id: 2, type: 'true-false', level: 'B1', title: 'Weather Forecast', audioText: 'Tomorrow will be sunny in the morning, but clouds are expected in the afternoon.', transcript: 'Tomorrow will be sunny in the morning, but clouds are expected in the afternoon.', question: 'It will be cloudy all day tomorrow.', answer: false },
  { id: 3, type: 'dictation', level: 'B1', title: 'Science News', audioText: 'Scientists discovered a new species of bird in the Amazon rainforest.', transcript: '', targetSentence: 'Scientists discovered a new species of bird in the Amazon rainforest.' },
]

export default function Listening() {
  const { profile } = useStore()
  const level = profile?.cefr_level || 'B1'
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [loadingExercises, setLoadingExercises] = useState(true)
  const [current, setCurrent] = useState(0)
  const [playing, setPlaying] = useState(false)
  const [showTranscript, setShowTranscript] = useState(false)
  const [answer, setAnswer] = useState<string | boolean | null>(null)
  const [dictationText, setDictationText] = useState('')
  const [checked, setChecked] = useState(false)
  const [score, setScore] = useState(0)
  const [done, setDone] = useState(false)
  const [popupData, setPopupData] = useState<WordPopupData | null>(null)
  const [popupLoading, setPopupLoading] = useState(false)
  const [savedWords, setSavedWords] = useState<Set<string>>(new Set())

  useEffect(() => {
    const load = async () => {
      setLoadingExercises(true)
      try {
        const res = await api.generateListening(level, profile?.id)
        const exs = res.exercises as Exercise[]
        if (exs && exs.length > 0) setExercises(exs)
        else setExercises(FALLBACK)
      } catch {
        setExercises(FALLBACK)
      }
      setLoadingExercises(false)
    }
    load()
  }, [level])

  const exercise = exercises[current]

  const playAudio = () => {
    if (!exercise || !('speechSynthesis' in window)) return
    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(exercise.audioText)
    utterance.rate = level === 'A1' || level === 'A2' ? 0.7 : level === 'B1' ? 0.85 : 0.95
    utterance.lang = 'en-US'
    setPlaying(true)
    utterance.onend = () => setPlaying(false)
    window.speechSynthesis.speak(utterance)
  }

  const handleWordClick = async (rawWord: string) => {
    if (!showTranscript && !checked) return
    const clean = rawWord.replace(/[.,!?;:'"]/g, '').toLowerCase()
    if (clean.length < 3) return
    setPopupLoading(true)
    setPopupData(null)
    try {
      const data = await api.enrichWord(clean)
      setPopupData(data)
    } catch {
      setPopupData({ word: clean, phonetic: '', definition_en: 'Definition unavailable.', definition_tr: 'Tanım mevcut değil.', example_sentence: '', cefr_level: level as WordPopupData['cefr_level'], part_of_speech: '' })
    }
    setPopupLoading(false)
  }

  const renderTappableText = (text: string) => {
    return text.split(/(\s+)/).map((token, i) => {
      const clean = token.replace(/[.,!?;:'"]/g, '').toLowerCase()
      const isSaved = savedWords.has(clean)
      if (clean.length < 3) return <span key={i}>{token}</span>
      return (
        <span key={i} onClick={() => handleWordClick(token)}
          className={`cursor-pointer rounded px-0.5 hover:bg-yellow-100 dark:hover:bg-yellow-900/30 transition-colors ${isSaved ? 'bg-yellow-200 dark:bg-yellow-800/40' : ''}`}
        >{token}</span>
      )
    })
  }

  const isCorrect = () => {
    if (!exercise) return false
    if (exercise.type === 'fill-blank') return answer === exercise.answer
    if (exercise.type === 'true-false') return answer === exercise.answer
    if (exercise.type === 'dictation') return dictationText.toLowerCase().trim() === (exercise.targetSentence || '').toLowerCase().trim()
    return false
  }

  const checkAnswer = () => {
    setChecked(true)
    if (isCorrect()) setScore(s => s + 1)
  }

  const next = () => {
    if (current + 1 < exercises.length) {
      setCurrent(c => c + 1); setAnswer(null); setDictationText(''); setChecked(false); setShowTranscript(false)
    } else {
      setDone(true)
    }
  }

  const restart = async () => {
    setDone(false); setCurrent(0); setScore(0); setAnswer(null); setDictationText(''); setChecked(false); setShowTranscript(false)
    setLoadingExercises(true)
    try {
      const res = await api.generateListening(level)
      const exs = res.exercises as Exercise[]
      setExercises(exs && exs.length > 0 ? exs : FALLBACK)
    } catch {
      setExercises(FALLBACK)
    }
    setLoadingExercises(false)
  }

  const transcriptText = exercise?.transcript || exercise?.targetSentence || exercise?.audioText || ''

  if (done) {
    return (
      <div className="max-w-2xl mx-auto text-center py-20">
        <div className="text-7xl mb-6">{score === exercises.length ? '🏆' : score >= exercises.length / 2 ? '🎯' : '💪'}</div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Session Complete!</h1>
        <p className="text-xl text-gray-600 dark:text-gray-400 mb-6">{score}/{exercises.length} correct</p>
        <button onClick={restart} className="btn-primary px-10 py-4 text-lg">New Exercises →</button>
      </div>
    )
  }

  if (loadingExercises) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">🎧 Listening Practice</h1>
        <div className="card text-center py-16">
          <p className="text-4xl mb-4 animate-bounce">🎧</p>
          <p className="text-gray-500">Generating {level} level exercises with AI...</p>
        </div>
      </div>
    )
  }

  if (!exercise) return null

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <WordPopup data={popupData} onClose={() => setPopupData(null)} onSaved={(w) => setSavedWords(s => new Set([...s, w]))} />
      {popupLoading && <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-white dark:bg-slate-800 shadow-xl rounded-2xl px-6 py-3 z-40 text-sm flex items-center gap-2"><span className="animate-spin">⚙️</span> Looking up word...</div>}

      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">🎧 Listening Practice</h1>
        <span className="text-sm text-gray-500">Score: {score}/{exercises.length}</span>
      </div>

      <div className="w-full bg-gray-200 dark:bg-slate-700 rounded-full h-2">
        <div className="bg-primary-600 h-2 rounded-full transition-all" style={{ width: `${(current / exercises.length) * 100}%` }} />
      </div>

      <motion.div key={exercise.id} initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} className="card space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <span className={`cefr-badge cefr-${exercise.level.toLowerCase()} mr-2`}>{exercise.level}</span>
            <span className="text-sm font-medium text-gray-600 dark:text-gray-300">{exercise.title}</span>
          </div>
          <span className="text-xs text-gray-400 capitalize">{exercise.type.replace('-', ' ')}</span>
        </div>

        {/* Player */}
        <div className="flex flex-col items-center gap-2">
          <motion.button whileTap={{ scale: 0.95 }} onClick={playAudio} disabled={playing}
            className={`w-20 h-20 rounded-full flex items-center justify-center text-3xl shadow-lg transition-all ${playing ? 'bg-gray-200 dark:bg-slate-700 animate-pulse' : 'bg-primary-600 hover:bg-primary-700 text-white'}`}
          >{playing ? '⏸️' : '▶️'}</motion.button>
          <p className="text-xs text-gray-400">{playing ? 'Playing...' : 'Press to listen'}</p>
        </div>

        {/* Exercise */}
        {exercise.type === 'fill-blank' && (
          <div className="space-y-4">
            <p className="text-gray-700 dark:text-gray-300 text-center italic bg-gray-50 dark:bg-slate-700 p-3 rounded-xl">"{exercise.transcript}"</p>
            <div className="grid grid-cols-2 gap-3">
              {exercise.options?.map((opt) => (
                <button key={opt} onClick={() => !checked && setAnswer(opt)}
                  className={`py-3 rounded-xl font-medium transition-all border-2 ${
                    checked ? opt === exercise.answer ? 'border-accent-500 bg-accent-50 dark:bg-accent-900/20 text-accent-700 dark:text-accent-400' : answer === opt ? 'border-red-400 bg-red-50 dark:bg-red-900/20 text-red-600' : 'border-gray-200 dark:border-slate-600 text-gray-400'
                    : answer === opt ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400' : 'border-gray-200 dark:border-slate-600 hover:border-primary-400 text-gray-700 dark:text-gray-300'
                  }`}
                >{opt}</button>
              ))}
            </div>
          </div>
        )}

        {exercise.type === 'true-false' && (
          <div className="space-y-4">
            <p className="text-center font-medium text-gray-800 dark:text-gray-200 p-3 bg-gray-50 dark:bg-slate-700 rounded-xl">{exercise.question}</p>
            <div className="flex gap-4">
              {[true, false].map((v) => (
                <button key={String(v)} onClick={() => !checked && setAnswer(v)}
                  className={`flex-1 py-3 rounded-xl font-bold transition-all border-2 ${
                    checked ? v === exercise.answer ? 'border-accent-500 bg-accent-50 text-accent-700' : answer === v ? 'border-red-400 bg-red-50 text-red-600' : 'border-gray-200 dark:border-slate-600 text-gray-400'
                    : answer === v ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-700' : 'border-gray-200 dark:border-slate-600 hover:border-primary-400 text-gray-700 dark:text-gray-300'
                  }`}
                >{v ? 'True ✓' : 'False ✗'}</button>
              ))}
            </div>
          </div>
        )}

        {exercise.type === 'dictation' && (
          <div className="space-y-3">
            <p className="text-sm text-gray-500 text-center">Listen carefully and type exactly what you hear</p>
            <input className="input-field" placeholder="Type what you hear..." value={dictationText} onChange={(e) => setDictationText(e.target.value)} disabled={checked} />
            {checked && (
              <div className="p-3 rounded-xl bg-primary-50 dark:bg-primary-900/20">
                <p className="text-xs text-gray-500 mb-1">Correct answer:</p>
                <p className="font-medium text-primary-700 dark:text-primary-400">{exercise.targetSentence}</p>
              </div>
            )}
          </div>
        )}

        {/* Transcript */}
        {!showTranscript ? (
          <button onClick={() => setShowTranscript(true)} className="text-xs text-gray-400 hover:text-primary-600 w-full text-center underline">
            Show transcript (words become tappable)
          </button>
        ) : (
          <div className="p-3 bg-gray-50 dark:bg-slate-700 rounded-xl">
            <p className="text-xs text-gray-400 mb-2 font-medium">Tap any word for its Turkish translation:</p>
            <p className="text-sm text-gray-600 dark:text-gray-400 italic leading-relaxed">{renderTappableText(transcriptText)}</p>
          </div>
        )}

        {!checked ? (
          <button onClick={checkAnswer} disabled={answer === null && dictationText.length === 0} className="btn-primary w-full">
            Check Answer
          </button>
        ) : (
          <div className="space-y-3">
            <p className={`text-center font-bold text-lg ${isCorrect() ? 'text-accent-600 dark:text-accent-400' : 'text-red-500'}`}>
              {isCorrect() ? '✅ Correct!' : '❌ Not quite — check the answer above'}
            </p>
            <button onClick={next} className="btn-primary w-full">
              {current + 1 < exercises.length ? 'Next Exercise →' : 'See Results →'}
            </button>
          </div>
        )}
      </motion.div>
    </div>
  )
}

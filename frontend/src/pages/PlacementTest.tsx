import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '../lib/supabase'
import { useStore } from '../store/useStore'
import { getPlacementTest, getLevelUpTest, calculateCEFR, calculateLevelUp } from '../lib/placementQuestions'
import type { PlacementQuestion } from '../types'

interface Props {
  mode?: 'placement' | 'levelup'
}

export default function PlacementTest({ mode = 'placement' }: Props) {
  const navigate = useNavigate()
  const { profile, setProfile } = useStore()
  const currentLevel = profile?.cefr_level || 'A1'
  const LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2']
  const nextLevel = LEVELS[LEVELS.indexOf(currentLevel) + 1] || null

  const [questions, setQuestions] = useState<PlacementQuestion[]>([])
  const [started, setStarted] = useState(false)
  const [current, setCurrent] = useState(0)
  const [answers, setAnswers] = useState<number[]>([])
  const [result, setResult] = useState<string | null>(null)
  const [leveled, setLeveled] = useState(false)
  const [saving, setSaving] = useState(false)
  const [selected, setSelected] = useState<number | null>(null)

  const isLevelUp = mode === 'levelup'

  const startTest = () => {
    const qs = isLevelUp && nextLevel
      ? getLevelUpTest(currentLevel)
      : getPlacementTest()
    setQuestions(qs)
    setStarted(true)
    setCurrent(0)
    setAnswers([])
    setResult(null)
    setSelected(null)
  }

  const handleAnswer = async (idx: number) => {
    if (selected !== null) return
    setSelected(idx)
    await new Promise(r => setTimeout(r, 600))

    const newAnswers = [...answers, idx]
    setAnswers(newAnswers)
    setSelected(null)

    if (current + 1 < questions.length) {
      setCurrent(current + 1)
    } else {
      if (isLevelUp && nextLevel) {
        const passed = calculateLevelUp(newAnswers, questions, nextLevel)
        const newLevel = passed ? nextLevel : currentLevel
        setResult(newLevel)
        setLeveled(passed)
        if (profile) {
          setSaving(true)
          if (passed) {
            await supabase.from('users').update({ cefr_level: newLevel }).eq('id', profile.id)
            setProfile({ ...profile, cefr_level: newLevel })
          }
          setSaving(false)
        }
      } else {
        const level = calculateCEFR(newAnswers, questions)
        setResult(level)
        if (profile) {
          setSaving(true)
          await supabase.from('users').update({ cefr_level: level }).eq('id', profile.id)
          setProfile({ ...profile, cefr_level: level })
          setSaving(false)
        }
      }
    }
  }

  const q = questions[current]
  const progress = questions.length > 0 ? (current / questions.length) * 100 : 0

  // ── INTRO ──────────────────────────────────────────────────────────────────
  if (!started) {
    return (
      <div className="max-w-lg mx-auto py-12 space-y-8">
        <div className="text-center space-y-4">
          <div className="w-20 h-20 mx-auto rounded-3xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center text-4xl shadow-xl">
            {isLevelUp ? '🚀' : '🎯'}
          </div>
          <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white">
            {isLevelUp ? `Level Up Challenge` : 'Level Placement Test'}
          </h1>
          {isLevelUp ? (
            <p className="text-gray-500 dark:text-gray-400 leading-relaxed">
              You've been doing great at <strong>{currentLevel}</strong>!
              This 10-question challenge tests your <strong>{nextLevel}</strong> skills.
              Score 70% or above on the {nextLevel} questions to level up.
            </p>
          ) : (
            <p className="text-gray-500 dark:text-gray-400 leading-relaxed">
              Answer {questions.length || '~21'} questions to determine your English level.
              Questions are randomly selected each time. Your current level will be updated automatically.
            </p>
          )}
          {profile && (
            <p className="text-sm text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 px-4 py-2 rounded-xl border border-amber-200 dark:border-amber-800">
              Current level: <strong>{profile.cefr_level}</strong>
              {isLevelUp && nextLevel && <> → aiming for <strong>{nextLevel}</strong></>}
            </p>
          )}
          {isLevelUp && !nextLevel && (
            <p className="text-sm text-emerald-600 font-medium">You are already at the highest level (C2)! 🏆</p>
          )}
        </div>

        <div className="card space-y-3">
          <h2 className="font-bold text-gray-900 dark:text-white text-sm uppercase tracking-wide">What to expect</h2>
          {(isLevelUp ? [
            ['📝', `10 mixed questions from ${currentLevel} and ${nextLevel}`],
            ['🎯', `Score 70%+ on ${nextLevel} questions to level up`],
            ['⏱', 'No time limit — take your time'],
            ['🔄', 'You can retry from the Grammar or Settings page'],
          ] : [
            ['📝', 'Grammar questions from A1 to C2'],
            ['📖', 'Vocabulary and reading comprehension'],
            ['⏱', 'No time limit — take your time'],
            ['🔀', 'Questions are randomly selected each attempt'],
          ]).map(([icon, text]) => (
            <div key={text as string} className="flex gap-3 text-sm text-gray-600 dark:text-gray-300">
              <span>{icon}</span><span>{text}</span>
            </div>
          ))}
        </div>

        <button
          onClick={startTest}
          disabled={isLevelUp && !nextLevel}
          className="btn-primary w-full py-4 text-lg disabled:opacity-50"
        >
          {isLevelUp ? `Start Level Up Challenge →` : 'Start Test →'}
        </button>
        {isLevelUp && (
          <button onClick={() => navigate(-1)} className="btn-outline w-full">
            ← Go Back
          </button>
        )}
      </div>
    )
  }

  // ── RESULT ─────────────────────────────────────────────────────────────────
  if (result) {
    const levelDesc: Record<string, string> = {
      A1: 'Beginner — you are just starting your English journey.',
      A2: 'Elementary — you can handle basic everyday conversations.',
      B1: 'Intermediate — you can communicate in familiar situations.',
      B2: 'Upper Intermediate — you can understand complex topics.',
      C1: 'Advanced — you express yourself fluently and spontaneously.',
      C2: 'Proficiency — you understand virtually everything you hear or read.',
    }
    return (
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
        className="max-w-lg mx-auto py-12 text-center space-y-6"
      >
        <div className="w-24 h-24 mx-auto rounded-3xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center text-5xl shadow-xl">
          {isLevelUp ? (leveled ? '🚀' : '💪') : '🏆'}
        </div>
        <div>
          {isLevelUp ? (
            leveled ? (
              <>
                <p className="text-gray-500 text-sm font-medium uppercase tracking-wide mb-2">Level Up!</p>
                <div className="flex items-center justify-center gap-3 mb-3">
                  <span className={`cefr-badge cefr-${currentLevel.toLowerCase()} text-2xl font-extrabold px-4 py-2`}>{currentLevel}</span>
                  <span className="text-2xl">→</span>
                  <span className={`cefr-badge cefr-${result.toLowerCase()} text-2xl font-extrabold px-4 py-2`}>{result}</span>
                </div>
                <p className="text-gray-600 dark:text-gray-300 leading-relaxed">{levelDesc[result]}</p>
              </>
            ) : (
              <>
                <p className="text-gray-500 text-sm font-medium uppercase tracking-wide mb-2">Not quite yet</p>
                <div className={`cefr-badge cefr-${currentLevel.toLowerCase()} text-3xl font-extrabold px-5 py-2 inline-block mb-3`}>{currentLevel}</div>
                <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                  Keep practicing at <strong>{currentLevel}</strong> level and try again when you feel ready!
                </p>
              </>
            )
          ) : (
            <>
              <p className="text-gray-500 text-sm font-medium uppercase tracking-wide mb-2">Your English Level</p>
              <div className={`cefr-badge cefr-${result.toLowerCase()} text-4xl font-extrabold px-6 py-3 inline-block mb-3`}>{result}</div>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed">{levelDesc[result]}</p>
            </>
          )}
        </div>

        {saving ? (
          <p className="text-sm text-gray-400">Saving your level...</p>
        ) : (
          <p className="text-sm text-emerald-600 dark:text-emerald-400 font-medium">
            {isLevelUp && leveled ? '🎉 Your level has been upgraded!' : isLevelUp ? '✓ Keep practicing — you got this!' : '✓ Your level has been updated'}
          </p>
        )}

        <div className="flex gap-3">
          <button onClick={() => navigate('/dashboard')} className="flex-1 btn-primary">
            Go to Dashboard →
          </button>
          <button onClick={startTest} className="flex-1 btn-outline">
            Try Again
          </button>
        </div>
      </motion.div>
    )
  }

  // ── QUESTIONS ──────────────────────────────────────────────────────────────
  return (
    <div className="max-w-lg mx-auto py-8 space-y-6">
      <div className="space-y-2">
        <div className="flex justify-between items-center text-sm">
          <span className="text-gray-500">Question {current + 1} of {questions.length}</span>
          <span className={`cefr-badge cefr-${q.level.toLowerCase()}`}>{q.level}</span>
        </div>
        <div className="h-2 bg-gray-100 dark:bg-slate-700 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-primary-500 to-primary-600 rounded-full"
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={current}
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -30 }}
          transition={{ duration: 0.18 }}
          className="space-y-5"
        >
          <div className="card">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white leading-relaxed">{q.question}</h2>
          </div>

          <div className="space-y-3">
            {q.options.map((opt, i) => {
              const isSelected = selected === i
              const isCorrect = selected !== null && i === q.correct
              const isWrong = isSelected && i !== q.correct
              return (
                <motion.button
                  key={i}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleAnswer(i)}
                  disabled={selected !== null}
                  className={`w-full text-left px-5 py-4 rounded-2xl border-2 transition-all font-medium ${
                    isCorrect
                      ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300'
                      : isWrong
                      ? 'border-red-400 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400'
                      : isSelected
                      ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                      : 'border-gray-200 dark:border-slate-600 text-gray-700 dark:text-gray-300 hover:border-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/10'
                  }`}
                >
                  <span className="text-primary-600 dark:text-primary-400 font-bold mr-3">
                    {String.fromCharCode(65 + i)}.
                  </span>
                  {opt}
                  {isCorrect && <span className="float-right">✓</span>}
                  {isWrong && <span className="float-right">✗</span>}
                </motion.button>
              )
            })}
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  )
}

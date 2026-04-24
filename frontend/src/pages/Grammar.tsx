import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useStore } from '../store/useStore'
import { api } from '../lib/api'

interface LessonSection { title: string; body: string; examples: string[] }
interface Lesson { summary: string; sections: LessonSection[] }

const TOPICS: { id: string; label: string; icon: string; levels: string[] }[] = [
  { id: 'tenses',       label: 'Verb Tenses',          icon: '⏱',  levels: ['A1','A2','B1','B2','C1','C2'] },
  { id: 'articles',     label: 'Articles (a/an/the)',   icon: '📰', levels: ['A1','A2','B1'] },
  { id: 'conditionals', label: 'Conditionals',          icon: '🔀', levels: ['B1','B2','C1','C2'] },
  { id: 'passive',      label: 'Passive Voice',         icon: '🔄', levels: ['B1','B2','C1','C2'] },
  { id: 'modal',        label: 'Modal Verbs',           icon: '🎛',  levels: ['A2','B1','B2'] },
  { id: 'reported',     label: 'Reported Speech',       icon: '💬', levels: ['B1','B2','C1'] },
  { id: 'prepositions', label: 'Prepositions',          icon: '📍', levels: ['A1','A2','B1','B2'] },
  { id: 'relative',     label: 'Relative Clauses',      icon: '🔗', levels: ['B1','B2','C1','C2'] },
  { id: 'subjunctive',  label: 'Subjunctive & Wishes',  icon: '✨', levels: ['C1','C2'] },
]

const LESSONS: Record<string, Lesson> = {
  tenses: {
    summary: 'English has 12 main tenses. Each tense tells us WHEN an action happens and whether it is simple, continuous, or perfect.',
    sections: [
      {
        title: 'Present Tenses',
        body: 'Simple present = habits/facts. Present continuous = happening now. Present perfect = past action with present relevance.',
        examples: ['I drink coffee every morning. (habit)', 'She is reading a book right now. (now)', 'I have visited Paris. (experience, no specific time)'],
      },
      {
        title: 'Past Tenses',
        body: 'Simple past = completed action at a specific time. Past continuous = action in progress when another happened. Past perfect = action completed before another past action.',
        examples: ['He called me yesterday.', 'I was sleeping when the phone rang.', 'She had already eaten when we arrived.'],
      },
      {
        title: 'Future Tenses',
        body: 'Will = spontaneous decisions/predictions. Going to = planned intentions. Present continuous can also express future arrangements.',
        examples: ["I'll help you with that! (spontaneous)", "We're going to travel in June. (plan)", "I'm meeting Ana tomorrow. (arranged)"],
      },
    ],
  },
  articles: {
    summary: 'Use "a/an" for singular countable nouns mentioned for the first time or when the listener doesn\'t know which one. Use "the" when both speaker and listener know which specific thing is meant.',
    sections: [
      {
        title: 'A / An',
        body: 'Use "a" before consonant sounds, "an" before vowel sounds. Use when introducing something new or when it could be any one of its kind.',
        examples: ['I saw a dog in the park.', 'She is an engineer.', 'Can I have a glass of water?'],
      },
      {
        title: 'The',
        body: 'Use "the" when the noun is already known, unique, or when it has been mentioned before. Also use with superlatives and specific groups.',
        examples: ['The dog I saw was huge. (we know which dog)', 'The sun rises in the east. (unique)', 'She is the best student in class.'],
      },
      {
        title: 'No Article (Zero Article)',
        body: 'No article with plural/uncountable nouns when speaking generally, proper nouns, languages, meals, and most countries.',
        examples: ['Dogs are loyal animals. (general)', 'I love music.', 'She speaks Turkish and English.'],
      },
    ],
  },
  conditionals: {
    summary: 'Conditionals express "if" situations. The type depends on how real or likely the situation is.',
    sections: [
      {
        title: 'Zero Conditional — Always True',
        body: 'If + present simple → present simple. For facts and things that are always true.',
        examples: ['If you heat water to 100°C, it boils.', 'If I miss breakfast, I get hungry.'],
      },
      {
        title: 'First Conditional — Real Future',
        body: 'If + present simple → will + verb. For realistic future possibilities.',
        examples: ["If it rains tomorrow, we'll stay home.", "If you study hard, you'll pass."],
      },
      {
        title: 'Second Conditional — Unreal Present/Future',
        body: 'If + past simple → would + verb. For hypothetical or unlikely situations.',
        examples: ['If I had a million dollars, I would travel the world.', "If she knew the answer, she'd tell us."],
      },
      {
        title: 'Third Conditional — Unreal Past',
        body: 'If + past perfect → would have + past participle. For imagining how the past could have been different.',
        examples: ['If I had studied more, I would have passed.', "If she hadn't missed the bus, she wouldn't have been late."],
      },
    ],
  },
  passive: {
    summary: 'The passive voice shifts focus from who does the action to what receives the action. Form: subject + be + past participle.',
    sections: [
      {
        title: 'How to Form the Passive',
        body: 'Take the object of the active sentence and make it the subject. Use the correct form of "be" + past participle. The original subject can be added with "by".',
        examples: ['Active: The chef cooked the meal.', 'Passive: The meal was cooked (by the chef).', 'Active: They will announce the results.  →  Passive: The results will be announced.'],
      },
      {
        title: 'When to Use the Passive',
        body: 'Use passive when the doer is unknown, unimportant, or obvious. It is common in academic and formal writing.',
        examples: ['My wallet was stolen. (we don\'t know who)', 'The bridge was built in 1890.', 'Mistakes were made.'],
      },
    ],
  },
  modal: {
    summary: 'Modal verbs (can, could, may, might, must, should, will, would, shall, ought to) add meaning about ability, permission, possibility, obligation, or advice. They are followed by the base verb (no "to" or "-s").',
    sections: [
      {
        title: 'Ability',
        body: '"Can" = present ability. "Could" = past ability or polite request.',
        examples: ['She can speak four languages.', 'I could swim when I was five.', 'Could you help me, please?'],
      },
      {
        title: 'Permission & Possibility',
        body: '"May/might" = possibility. "May" = formal permission.',
        examples: ['It might rain later.', 'You may leave early today.', 'She may be at the office.'],
      },
      {
        title: 'Obligation & Advice',
        body: '"Must" = strong obligation (often from speaker). "Have to" = external obligation. "Should" = advice or recommendation.',
        examples: ['You must wear a seatbelt.', 'I have to finish this report by 5pm.', 'You should drink more water.'],
      },
    ],
  },
  reported: {
    summary: 'Reported (indirect) speech is used to tell what someone said without quoting them directly. Tenses usually shift back one step, and pronouns and time expressions change.',
    sections: [
      {
        title: 'Tense Shifts',
        body: 'Present simple → past simple. Present continuous → past continuous. Will → would. Can → could. Past simple → past perfect.',
        examples: ['"I am tired." → She said she was tired.', '"I will call you." → He said he would call me.', '"We can help." → They said they could help.'],
      },
      {
        title: 'Questions in Reported Speech',
        body: 'Use "asked" + if/whether (yes/no questions) or wh-word (wh-questions). The word order becomes statement order (no inversion).',
        examples: ['"Are you coming?" → He asked if I was coming.', '"Where do you live?" → She asked where I lived.'],
      },
      {
        title: 'Time & Place Changes',
        body: 'Time and place expressions often change to reflect the new context.',
        examples: ['today → that day', 'here → there', 'yesterday → the day before', 'tomorrow → the next day'],
      },
    ],
  },
  prepositions: {
    summary: 'Prepositions link nouns/pronouns to other words, showing time, place, direction, or manner. Common ones: in, on, at, by, for, with, from, to, about, of.',
    sections: [
      {
        title: 'Prepositions of Time',
        body: '"At" for specific times. "On" for days and dates. "In" for months, years, seasons, and longer periods.',
        examples: ['at 3 o\'clock · at night', 'on Monday · on 5th April', 'in January · in 2020 · in the morning'],
      },
      {
        title: 'Prepositions of Place',
        body: '"At" for a specific point or location. "On" for surfaces. "In" for enclosed spaces.',
        examples: ['at the bus stop · at school', 'on the table · on the wall', 'in the box · in Istanbul'],
      },
      {
        title: 'Common Preposition Collocations',
        body: 'Many verbs and adjectives are paired with specific prepositions. These must be memorized.',
        examples: ['interested in · good at · afraid of', 'depend on · look for · listen to', 'by bus · on foot · in cash'],
      },
    ],
  },
  relative: {
    summary: 'Relative clauses add extra information about a noun. They begin with relative pronouns: who, whom, whose, which, or that.',
    sections: [
      {
        title: 'Defining Relative Clauses',
        body: 'Identifies which person or thing we mean. No commas. "That" can replace "who" or "which".',
        examples: ['The man who called you is outside.', 'The book that I bought is great.', 'The city where she grew up is beautiful.'],
      },
      {
        title: 'Non-Defining Relative Clauses',
        body: 'Adds extra information that could be removed without changing the core meaning. Always use commas. Cannot use "that".',
        examples: ['My sister, who lives in London, is a doctor.', 'The Eiffel Tower, which was built in 1889, is stunning.'],
      },
      {
        title: 'Omitting the Relative Pronoun',
        body: 'You can omit the relative pronoun when it is the object of the clause (not the subject).',
        examples: ['The film (that) I watched was amazing. (object — can omit)', 'The man who called me was lost. (subject — cannot omit)'],
      },
    ],
  },
  subjunctive: {
    summary: 'The subjunctive mood expresses wishes, hypothetical situations, suggestions, and necessities. It often uses a past form for present/future meaning.',
    sections: [
      {
        title: 'Wish & If Only',
        body: 'Use "wish + past simple" to express a wish about the present (something untrue now). Use "wish + past perfect" for regrets about the past.',
        examples: ['I wish I knew the answer. (but I don\'t)', 'If only she were here. ("were" is formal/correct)', 'I wish I had studied harder. (regret about the past)'],
      },
      {
        title: 'Formal Subjunctive (that-clauses)',
        body: 'After verbs like suggest, recommend, insist, demand, require — use "that + subject + base verb" (no -s, no past).',
        examples: ['The doctor suggested that he take more rest.', 'It is essential that every student submit the form.', 'She insisted that he be present.'],
      },
      {
        title: 'As If / As Though',
        body: 'Use past forms after "as if/as though" to describe something untrue or imaginary.',
        examples: ['He talks as if he knew everything. (but he doesn\'t)', 'She looked as though she had seen a ghost.'],
      },
    ],
  },
}

interface Question {
  question: string
  options: string[]
  correct: number
  explanation: string
}

interface GrammarSession {
  topic: string
  questions: Question[]
}

interface TopicProgress { score: number; total: number; date: string }

function getTopicProgress(userId: string, topicId: string): TopicProgress | null {
  try { return JSON.parse(localStorage.getItem(`grammar-${userId}-${topicId}`) || 'null') }
  catch { return null }
}

function saveTopicProgress(userId: string, topicId: string, score: number, total: number) {
  const record: TopicProgress = { score, total, date: new Date().toISOString().split('T')[0] }
  localStorage.setItem(`grammar-${userId}-${topicId}`, JSON.stringify(record))
}

export default function Grammar() {
  const { profile } = useStore()
  const level = profile?.cefr_level || 'B1'
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null)
  const [showLesson, setShowLesson] = useState(false)
  const [session, setSession] = useState<GrammarSession | null>(null)
  const [loading, setLoading] = useState(false)
  const [current, setCurrent] = useState(0)
  const [selected, setSelected] = useState<number | null>(null)
  const [answers, setAnswers] = useState<{ chosen: number; correct: number; explanation: string }[]>([])
  const [done, setDone] = useState(false)
  const [topicProgressMap, setTopicProgressMap] = useState<Record<string, TopicProgress>>({})
  const availableTopics = TOPICS.filter(t => t.levels.includes(level))

  // Load topic progress from localStorage on mount
  useEffect(() => {
    if (!profile) return
    const map: Record<string, TopicProgress> = {}
    TOPICS.forEach(t => {
      const p = getTopicProgress(profile.id, t.id)
      if (p) map[t.id] = p
    })
    setTopicProgressMap(map)
  }, [profile?.id])

  const openLesson = (topicId: string) => {
    setSelectedTopic(topicId)
    setShowLesson(true)
    setSession(null)
    setDone(false)
    setCurrent(0)
    setAnswers([])
    setSelected(null)
  }

  const startSession = async (topicId: string) => {
    setShowLesson(false)
    setLoading(true)
    try {
      const data = await api.generateGrammar(topicId, level)
      setSession({ topic: topicId, questions: data.questions || [] })
    } catch {
      setSelectedTopic(null)
    }
    setLoading(false)
  }

  const handleAnswer = (idx: number) => {
    if (selected !== null || !session) return
    setSelected(idx)

    setTimeout(() => {
      const q = session.questions[current]
      const newAnswers = [...answers, { chosen: idx, correct: q.correct, explanation: q.explanation }]
      setAnswers(newAnswers)
      setSelected(null)

      if (current + 1 >= session.questions.length) {
        setDone(true)
        if (profile && selectedTopic) {
          const finalScore = newAnswers.filter(a => a.chosen === a.correct).length
          saveTopicProgress(profile.id, selectedTopic, finalScore, session.questions.length)
          setTopicProgressMap(m => ({
            ...m,
            [selectedTopic]: { score: finalScore, total: session.questions.length, date: new Date().toISOString().split('T')[0] },
          }))
        }
      } else {
        setCurrent(c => c + 1)
      }
    }, 900)
  }

  const LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2']
  const score = answers.filter(a => a.chosen === a.correct).length
  const topicLabel = TOPICS.find(t => t.id === selectedTopic)?.label || ''
  const canLevelUp = score >= session?.questions.length! * 0.8
    && LEVELS.indexOf(level) < LEVELS.length - 1

  // ── RESULTS ────────────────────────────────────────────────────────────────
  if (done && session) {
    return (
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="max-w-xl mx-auto py-8 space-y-6"
      >
        <div className="text-center space-y-3">
          <div className="w-20 h-20 mx-auto rounded-3xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center text-4xl shadow-xl">
            {score >= session.questions.length * 0.8 ? '🏆' : score >= session.questions.length * 0.5 ? '👍' : '💪'}
          </div>
          <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white">{topicLabel}</h1>
          <div className="flex items-center justify-center gap-2">
            <span className="text-4xl font-extrabold text-primary-600">{score}</span>
            <span className="text-gray-400 text-xl">/ {session.questions.length}</span>
          </div>
          <p className="text-gray-500 text-sm">
            {score === session.questions.length ? 'Perfect score! Excellent!' : score >= session.questions.length * 0.7 ? 'Great work! Keep it up.' : 'Keep practising — you\'ll get there!'}
          </p>
        </div>

        {/* Review */}
        <div className="space-y-3">
          <h2 className="font-bold text-gray-900 dark:text-white text-sm uppercase tracking-wide">Review</h2>
          {session.questions.map((q, i) => {
            const a = answers[i]
            const isCorrect = a.chosen === a.correct
            return (
              <div key={i} className={`card border-2 ${isCorrect ? 'border-emerald-200 dark:border-emerald-800' : 'border-red-200 dark:border-red-800'}`}>
                <p className="font-medium text-gray-900 dark:text-white text-sm mb-2">{q.question}</p>
                {!isCorrect && (
                  <p className="text-xs text-red-500 mb-1">✗ You answered: <em>{q.options[a.chosen]}</em></p>
                )}
                <p className={`text-xs font-semibold mb-1 ${isCorrect ? 'text-emerald-600' : 'text-emerald-600'}`}>
                  ✓ Correct: <em>{q.options[a.correct]}</em>
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{a.explanation}</p>
              </div>
            )
          })}
        </div>

        {canLevelUp && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            className="card bg-gradient-to-r from-emerald-50 to-primary-50 dark:from-emerald-900/20 dark:to-primary-900/20 border border-emerald-200 dark:border-emerald-800 text-center space-y-2 py-5"
          >
            <p className="text-2xl">🚀</p>
            <p className="font-bold text-gray-900 dark:text-white">Ready to level up?</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              You scored {score}/{session!.questions.length} at <span className={`cefr-badge cefr-${level.toLowerCase()} text-xs`}>{level}</span>.
              Take the level-up challenge!
            </p>
            <Link to="/level-up" className="btn-primary inline-block mt-1 px-6">
              Take Level Up Test →
            </Link>
          </motion.div>
        )}

        <div className="flex gap-3">
          <button onClick={() => { setSession(null); setSelectedTopic(null); setDone(false) }} className="flex-1 btn-outline">
            Change Topic
          </button>
          <button onClick={() => startSession(selectedTopic!)} className="flex-1 btn-primary">
            Try Again →
          </button>
        </div>
      </motion.div>
    )
  }

  // ── ACTIVE QUIZ ────────────────────────────────────────────────────────────
  if (session && session.questions.length > 0 && !done) {
    const q = session.questions[current]
    const progress = (current / session.questions.length) * 100

    return (
      <div className="max-w-xl mx-auto py-8 space-y-6">
        {/* Header */}
        <div className="space-y-2">
          <div className="flex justify-between items-center text-sm">
            <span className="text-gray-500 font-medium">{topicLabel}</span>
            <span className="text-gray-400">{current + 1} / {session.questions.length}</span>
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
          <motion.div key={current}
            initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}
            transition={{ duration: 0.18 }}
            className="space-y-4"
          >
            <div className="card">
              <p className="text-lg font-bold text-gray-900 dark:text-white leading-relaxed">{q.question}</p>
            </div>

            <div className="space-y-3">
              {q.options.map((opt, i) => {
                const isSelected = selected === i
                const showResult = selected !== null
                const isCorrect = showResult && i === q.correct
                const isWrong = isSelected && i !== q.correct

                return (
                  <motion.button key={i} whileTap={{ scale: 0.98 }}
                    onClick={() => handleAnswer(i)}
                    disabled={selected !== null}
                    className={`w-full text-left px-5 py-4 rounded-2xl border-2 font-medium transition-all ${
                      isCorrect ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300'
                      : isWrong ? 'border-red-400 bg-red-50 dark:bg-red-900/20 text-red-600'
                      : isSelected ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                      : 'border-gray-200 dark:border-slate-600 text-gray-700 dark:text-gray-300 hover:border-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/10'
                    }`}
                  >
                    <span className="text-primary-600 font-bold mr-3">{String.fromCharCode(65 + i)}.</span>
                    {opt}
                    {isCorrect && <span className="float-right">✓</span>}
                    {isWrong && <span className="float-right">✗</span>}
                  </motion.button>
                )
              })}
            </div>

            {selected !== null && (
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-2xl border border-blue-100 dark:border-blue-800"
              >
                <p className="text-sm text-blue-700 dark:text-blue-300 font-medium">💡 {q.explanation}</p>
              </motion.div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    )
  }

  // ── LESSON VIEW ────────────────────────────────────────────────────────────
  if (showLesson && selectedTopic) {
    const topic = TOPICS.find(t => t.id === selectedTopic)!
    const lesson = LESSONS[selectedTopic]
    return (
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
        className="max-w-2xl mx-auto space-y-6 pb-8"
      >
        {/* Header */}
        <div className="flex items-center gap-4">
          <button onClick={() => { setShowLesson(false); setSelectedTopic(null) }}
            className="w-9 h-9 rounded-xl bg-gray-100 dark:bg-slate-700 flex items-center justify-center text-gray-500 hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors"
          >←</button>
          <div>
            <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white">{topic.icon} {topic.label}</h1>
            <p className="text-xs text-gray-400 mt-0.5">Lesson · {level} level</p>
          </div>
        </div>

        {/* Summary */}
        <div className="card bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800">
          <p className="text-primary-800 dark:text-primary-200 leading-relaxed">{lesson.summary}</p>
        </div>

        {/* Sections */}
        <div className="space-y-4">
          {lesson.sections.map((sec, i) => (
            <div key={i} className="card space-y-3">
              <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-primary-100 dark:bg-primary-900/40 text-primary-600 dark:text-primary-400 text-xs flex items-center justify-center font-bold">{i + 1}</span>
                {sec.title}
              </h3>
              <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed">{sec.body}</p>
              <div className="space-y-1.5">
                {sec.examples.map((ex, j) => (
                  <div key={j} className="flex gap-2 text-sm">
                    <span className="text-primary-400 mt-0.5 shrink-0">▸</span>
                    <span className="text-gray-700 dark:text-gray-300 italic">{ex}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Start Practice */}
        <button onClick={() => startSession(selectedTopic)}
          className="btn-primary w-full py-4 text-base"
        >
          Start Practice Quiz →
        </button>
      </motion.div>
    )
  }

  // ── LOADING (quiz generating) ──────────────────────────────────────────────
  if (loading) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="card flex items-center justify-center gap-3 py-16">
          <div className="flex gap-1.5">
            {[0,1,2].map(i => (
              <motion.div key={i} className="w-2 h-2 rounded-full bg-primary-400"
                animate={{ y: [0,-6,0] }} transition={{ repeat: Infinity, duration: 0.7, delay: i * 0.15 }} />
            ))}
          </div>
          <p className="text-gray-400 text-sm">Generating questions for {topicLabel}...</p>
        </div>
      </div>
    )
  }

  // ── TOPIC SELECTION ────────────────────────────────────────────────────────
  const completedCount = availableTopics.filter(t => {
    const p = topicProgressMap[t.id]
    return p && p.score / p.total >= 0.7
  }).length

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white">📝 Grammar</h1>
          <p className="text-gray-400 text-sm mt-0.5">
            Learn the rule, then practice · Level <span className={`cefr-badge cefr-${level.toLowerCase()} text-xs`}>{level}</span>
          </p>
        </div>
        {availableTopics.length > 0 && (
          <div className="shrink-0 text-center bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-2xl px-4 py-2.5">
            <p className="text-xl font-extrabold text-emerald-600 dark:text-emerald-400">{completedCount}/{availableTopics.length}</p>
            <p className="text-xs text-gray-500">completed</p>
          </div>
        )}
      </div>

      <div className="grid sm:grid-cols-2 gap-3">
        {availableTopics.map(topic => {
          const prog = topicProgressMap[topic.id]
          const pct = prog ? Math.round((prog.score / prog.total) * 100) : null
          const passed = pct !== null && pct >= 70
          return (
            <motion.button key={topic.id} whileHover={{ y: -2 }} whileTap={{ scale: 0.98 }}
              onClick={() => openLesson(topic.id)}
              className={`card text-left hover:shadow-lg transition-all border-2 group ${
                passed
                  ? 'border-emerald-200 dark:border-emerald-800 bg-emerald-50/40 dark:bg-emerald-900/10'
                  : 'border-transparent hover:border-primary-200 dark:hover:border-primary-800'
              }`}
            >
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl transition-colors ${
                  passed
                    ? 'bg-emerald-100 dark:bg-emerald-900/40'
                    : 'bg-primary-50 dark:bg-primary-900/30 group-hover:bg-primary-100'
                }`}>
                  {topic.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-gray-900 dark:text-white">{topic.label}</p>
                  {prog ? (
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex-1 bg-gray-200 dark:bg-slate-700 rounded-full h-1.5 max-w-[80px]">
                        <div
                          className={`h-full rounded-full ${passed ? 'bg-emerald-500' : 'bg-amber-400'}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className={`text-xs font-semibold ${passed ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`}>
                        {prog.score}/{prog.total}
                      </span>
                    </div>
                  ) : (
                    <p className="text-xs text-gray-400 mt-0.5">Lesson + quiz · {level}</p>
                  )}
                </div>
                <span className={`text-lg transition-colors ${passed ? 'text-emerald-400' : 'text-gray-300 dark:text-slate-600 group-hover:text-primary-400'}`}>
                  {passed ? '✓' : '→'}
                </span>
              </div>
            </motion.button>
          )
        })}
      </div>
    </div>
  )
}

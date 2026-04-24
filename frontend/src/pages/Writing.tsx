import { useState } from 'react'
import { motion } from 'framer-motion'
import { useStore } from '../store/useStore'
import { api, ProRequiredError } from '../lib/api'
import UpgradeModal from '../components/UpgradeModal'
import type { WritingFeedback } from '../types'

const tasks: Record<string, { label: string; prompt: string; minWords: number }[]> = {
  A1: [{ label: 'About Your Day', prompt: 'Write 3 sentences about what you did today.', minWords: 15 }],
  A2: [
    { label: 'Email to a Friend', prompt: 'Write a short email to a friend about your weekend plans. (50 words)', minWords: 40 },
    { label: 'Describe a Place', prompt: 'Describe your home in 4-5 sentences.', minWords: 30 },
  ],
  B1: [
    { label: 'Hometown Description', prompt: 'Write a paragraph describing your hometown. What do you like about it? (100 words)', minWords: 80 },
    { label: 'Advantages & Disadvantages', prompt: 'Write about the advantages and disadvantages of living in a big city. (100 words)', minWords: 80 },
  ],
  B2: [
    { label: 'Opinion Essay', prompt: 'Write an opinion essay: "Technology has made our lives better." Do you agree? (200 words)', minWords: 160 },
    { label: 'Problem-Solution', prompt: 'Describe a problem in modern society and suggest solutions. (200 words)', minWords: 160 },
  ],
  C1: [
    { label: 'Formal Letter', prompt: 'Write a formal letter to a company complaining about a product. (300 words)', minWords: 250 },
    { label: 'Analytical Essay', prompt: 'Analyze the impact of social media on human relationships. (300 words)', minWords: 250 },
  ],
  C2: [
    { label: 'Academic Essay', prompt: 'Write a well-structured academic essay on climate change and global responsibility. (400 words)', minWords: 350 },
  ],
}

export default function Writing() {
  const { profile } = useStore()
  const level = profile?.cefr_level || 'B1'
  const levelTasks = tasks[level] || tasks['B1']

  const [selectedTask, setSelectedTask] = useState(0)
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(false)
  const [feedback, setFeedback] = useState<WritingFeedback | null>(null)
  const [error, setError] = useState('')
  const [showUpgrade, setShowUpgrade] = useState(false)

  const task = levelTasks[selectedTask]
  const wordCount = text.trim().split(/\s+/).filter(Boolean).length

  const handleSubmit = async () => {
    if (wordCount < 5) { setError('Please write more before submitting.'); return }
    if (profile?.subscription_plan === 'free') { setShowUpgrade(true); return }
    setLoading(true)
    setError('')
    try {
      const result = await api.getWritingFeedbackPro(text, level, profile!.id)
      setFeedback(result)
    } catch (e) {
      if (e instanceof ProRequiredError) { setShowUpgrade(true) }
      else setError('Failed to get feedback. Please check your connection and try again.')
    }
    setLoading(false)
  }

  if (feedback) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-3xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">✍️ Writing Feedback</h1>
          <button onClick={() => { setFeedback(null); setText('') }} className="btn-outline text-sm py-2 px-4">New Task</button>
        </div>

        {/* Score */}
        <div className="card flex items-center gap-6">
          <div className="text-center">
            <div className={`text-5xl font-extrabold ${feedback.score >= 80 ? 'text-accent-500' : feedback.score >= 60 ? 'text-yellow-500' : 'text-red-500'}`}>
              {feedback.score}
            </div>
            <div className="text-sm text-gray-500">/ 100</div>
          </div>
          <div className="flex-1">
            <div className="w-full bg-gray-200 dark:bg-slate-700 rounded-full h-3">
              <div className={`h-3 rounded-full transition-all ${feedback.score >= 80 ? 'bg-accent-500' : feedback.score >= 60 ? 'bg-yellow-500' : 'bg-red-500'}`}
                style={{ width: `${feedback.score}%` }} />
            </div>
            <p className="text-sm text-gray-500 mt-2">
              {feedback.score >= 80 ? '🌟 Excellent work!' : feedback.score >= 60 ? '👍 Good effort, keep improving!' : '📚 Keep practicing — you\'re getting there!'}
            </p>
          </div>
        </div>

        {/* Positive highlights */}
        {feedback.positive_highlights.length > 0 && (
          <div className="card bg-accent-50 dark:bg-accent-900/20 border border-accent-200 dark:border-accent-800">
            <h3 className="font-bold text-accent-700 dark:text-accent-400 mb-3">✅ What You Did Well</h3>
            {feedback.positive_highlights.map((h, i) => (
              <p key={i} className="text-sm text-accent-800 dark:text-accent-300 mb-1">• {h}</p>
            ))}
          </div>
        )}

        {/* Grammar */}
        {feedback.grammar_errors.length > 0 && (
          <div className="card">
            <h3 className="font-bold text-gray-900 dark:text-white mb-4">🔴 Grammar Corrections</h3>
            <div className="space-y-3">
              {feedback.grammar_errors.map((e, i) => (
                <div key={i} className="p-3 bg-red-50 dark:bg-red-900/20 rounded-xl">
                  <div className="flex gap-4 text-sm">
                    <div className="text-red-600"><span className="font-medium">Error:</span> {e.error}</div>
                    <div className="text-accent-600"><span className="font-medium">✓</span> {e.correction}</div>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">{e.explanation}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Vocabulary */}
        {feedback.vocabulary_suggestions.length > 0 && (
          <div className="card">
            <h3 className="font-bold text-gray-900 dark:text-white mb-4">💡 Vocabulary Suggestions</h3>
            <div className="space-y-2">
              {feedback.vocabulary_suggestions.map((v, i) => (
                <div key={i} className="flex items-center gap-3 text-sm">
                  <span className="text-gray-500 line-through">{v.original}</span>
                  <span className="text-gray-400">→</span>
                  <span className="text-primary-600 font-medium">{v.better}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Structure */}
        {feedback.structure_feedback && (
          <div className="card">
            <h3 className="font-bold text-gray-900 dark:text-white mb-2">📋 Structure Feedback</h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm">{feedback.structure_feedback}</p>
          </div>
        )}

        {/* Corrected text */}
        {feedback.corrected_text && (
          <div className="card">
            <h3 className="font-bold text-gray-900 dark:text-white mb-3">📝 Corrected Version</h3>
            <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed font-serif">{feedback.corrected_text}</p>
          </div>
        )}
      </motion.div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <UpgradeModal open={showUpgrade} onClose={() => setShowUpgrade(false)} feature="AI Writing Feedback" />
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">✍️ Writing Practice</h1>

      {/* Task selection */}
      <div className="flex gap-3 flex-wrap">
        {levelTasks.map((t, i) => (
          <button key={i} onClick={() => setSelectedTask(i)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${selectedTask === i ? 'bg-primary-600 text-white' : 'bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200'}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Prompt */}
      <div className="card bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800">
        <h2 className="font-bold text-primary-800 dark:text-primary-300 mb-2">📋 Task</h2>
        <p className="text-gray-700 dark:text-gray-300">{task.prompt}</p>
        <p className="text-xs text-gray-500 mt-2">Minimum: ~{task.minWords} words</p>
      </div>

      {/* Editor */}
      <div className="card p-0 overflow-hidden">
        <textarea
          className="w-full p-6 min-h-48 text-gray-800 dark:text-gray-200 bg-transparent resize-none focus:outline-none font-serif text-lg leading-relaxed"
          placeholder="Start writing here..."
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <div className="px-6 py-3 border-t border-gray-100 dark:border-slate-700 flex justify-between items-center bg-gray-50 dark:bg-slate-800">
          <span className={`text-sm font-medium ${wordCount >= task.minWords ? 'text-accent-600' : 'text-gray-400'}`}>
            {wordCount} words {wordCount >= task.minWords ? '✅' : `(need ${task.minWords - wordCount} more)`}
          </span>
          <button onClick={() => setText('')} className="text-xs text-gray-400 hover:text-red-400 transition-colors">Clear</button>
        </div>
      </div>

      {error && <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">{error}</div>}

      <button
        onClick={handleSubmit}
        disabled={loading || wordCount < 5}
        className="btn-primary w-full py-4 text-lg"
      >
        {loading ? (
          <span className="flex items-center justify-center gap-2"><span className="animate-spin">⚙️</span> Analyzing your writing...</span>
        ) : 'Get AI Feedback →'}
      </button>
    </div>
  )
}

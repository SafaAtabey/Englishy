import { useState } from 'react'
import { useStore } from '../store/useStore'
import { api } from '../lib/api'
import WordPopup from '../components/WordPopup'
import type { Article, WordPopupData } from '../types'

const topics = ['Technology', 'Nature', 'Culture', 'Travel', 'Science', 'Food', 'Sports', 'History', 'Health', 'Business']

export default function Reading() {
  const { profile } = useStore()
  const level = profile?.cefr_level || 'B1'
  const [selectedTopic, setSelectedTopic] = useState('Technology')
  const [article, setArticle] = useState<Article | null>(null)
  const [loading, setLoading] = useState(false)
  const [popupData, setPopupData] = useState<WordPopupData | null>(null)
  const [popupLoading, setPopupLoading] = useState(false)
  const [savedWords, setSavedWords] = useState<Set<string>>(new Set())
  const [quizMode, setQuizMode] = useState(false)
  const [quizAnswers, setQuizAnswers] = useState<Record<number, number>>({})
  const [quizSubmitted, setQuizSubmitted] = useState(false)

  const generateArticle = async () => {
    setLoading(true)
    setArticle(null)
    try {
      const result = await api.generateArticle(level, selectedTopic)
      setArticle(result)
    } catch {
      setArticle({
        id: 'demo', title: `${selectedTopic} in the Modern World`,
        content: `Technology has transformed the way we live, work, and communicate. In the past, people relied on newspapers and letters to stay informed and connected. Today, smartphones and the internet have made it possible to access information instantly from anywhere in the world.\n\nArtificial intelligence is one of the most exciting developments in modern technology. Machines can now learn from data and make decisions that once required human intelligence. This has led to improvements in healthcare, transportation, and education.\n\nHowever, technology also brings challenges. Many people worry about privacy and the security of their personal data. Others are concerned about the impact of automation on jobs. Despite these challenges, most experts agree that technology, when used responsibly, can greatly improve our quality of life.`,
        cefr_level: level as Article['cefr_level'], topic: selectedTopic, word_count: 145,
        comprehension_questions: [
          { question: 'What has transformed the way we live?', options: ['Sports', 'Technology', 'Travel', 'Food'], answer: 1 },
          { question: 'What can AI machines now do?', options: ['Only calculate numbers', 'Learn from data and make decisions', 'Replace all humans', 'None of the above'], answer: 1 },
          { question: 'What challenge does technology bring?', options: ['More books', 'Privacy and security concerns', 'Better weather', 'Cheaper food'], answer: 1 },
        ],
        created_at: new Date().toISOString(),
      })
    }
    setLoading(false)
  }

  const handleWordClick = async (rawWord: string) => {
    const clean = rawWord.replace(/[.,!?;:'"()\[\]]/g, '').toLowerCase()
    if (clean.length < 3) return
    setPopupLoading(true)
    setPopupData(null)
    try {
      const data = await api.enrichWord(clean)
      setPopupData(data)
    } catch {
      // Fallback popup with minimal data
      setPopupData({
        word: clean, phonetic: '',
        definition_en: 'Definition not available — please add an API key.',
        definition_tr: 'Tanım mevcut değil.',
        example_sentence: `The word "${clean}" was used in this article.`,
        cefr_level: level as WordPopupData['cefr_level'],
        part_of_speech: '',
      })
    }
    setPopupLoading(false)
  }

  const renderContent = (content: string) => {
    return content.split('\n\n').map((para, pi) => (
      <p key={pi} className="mb-4 font-serif text-lg leading-relaxed text-gray-800 dark:text-gray-200">
        {para.split(/(\s+)/).map((token, ti) => {
          const clean = token.replace(/[.,!?;:'"()\[\]]/g, '').toLowerCase()
          const isSaved = savedWords.has(clean)
          const isWord = clean.length >= 3
          if (!isWord) return <span key={ti}>{token}</span>
          return (
            <span
              key={ti}
              onClick={() => handleWordClick(token)}
              className={`cursor-pointer rounded px-0.5 transition-colors hover:bg-yellow-100 dark:hover:bg-yellow-900/30 ${isSaved ? 'bg-yellow-200 dark:bg-yellow-800/40 text-yellow-900 dark:text-yellow-300' : ''}`}
            >
              {token}
            </span>
          )
        })}
      </p>
    ))
  }

  const quizScore = article ? article.comprehension_questions.filter((q, i) => quizAnswers[i] === q.answer).length : 0

  if (article) {
    return (
      <div className="max-w-3xl mx-auto space-y-6">
        <WordPopup
          data={popupData}
          onClose={() => setPopupData(null)}
          onSaved={(word) => setSavedWords(s => new Set([...s, word]))}
        />

        {popupLoading && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-white dark:bg-slate-800 shadow-xl rounded-2xl px-6 py-3 z-40 flex items-center gap-3 text-sm">
            <span className="animate-spin">⚙️</span> Looking up word...
          </div>
        )}

        <div className="flex items-center justify-between">
          <button onClick={() => { setArticle(null); setQuizMode(false); setSavedWords(new Set()) }} className="text-sm text-primary-600 hover:underline">← Back</button>
          <div className="flex gap-2">
            <span className={`cefr-badge cefr-${article.cefr_level.toLowerCase()}`}>{article.cefr_level}</span>
            <span className="cefr-badge bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300">{article.word_count} words</span>
            {savedWords.size > 0 && (
              <span className="cefr-badge bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400">
                💾 {savedWords.size} saved
              </span>
            )}
          </div>
        </div>

        <div className="card">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-2 font-serif">{article.title}</h1>
          <p className="text-xs text-gray-400 mb-6 italic">Tap any word to see its definition + Turkish meaning</p>
          <div>{renderContent(article.content)}</div>
        </div>

        {!quizMode ? (
          <button onClick={() => setQuizMode(true)} className="btn-primary w-full py-4">
            Take Comprehension Quiz →
          </button>
        ) : (
          <div className="card space-y-6">
            <h2 className="font-bold text-gray-900 dark:text-white text-lg">📝 Comprehension Quiz</h2>
            {article.comprehension_questions.map((q, qi) => (
              <div key={qi}>
                <p className="font-medium text-gray-800 dark:text-gray-200 mb-3">{qi + 1}. {q.question}</p>
                <div className="space-y-2">
                  {q.options.map((opt, oi) => (
                    <button key={oi} onClick={() => !quizSubmitted && setQuizAnswers(a => ({ ...a, [qi]: oi }))}
                      className={`w-full text-left px-4 py-3 rounded-xl border text-sm transition-all ${
                        quizSubmitted
                          ? oi === q.answer ? 'border-accent-500 bg-accent-50 dark:bg-accent-900/20 text-accent-700'
                            : quizAnswers[qi] === oi ? 'border-red-400 bg-red-50 text-red-600' : 'border-gray-200 dark:border-slate-600 text-gray-400'
                          : quizAnswers[qi] === oi ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                          : 'border-gray-200 dark:border-slate-600 hover:border-primary-300'
                      }`}
                    >{opt}</button>
                  ))}
                </div>
              </div>
            ))}
            {!quizSubmitted ? (
              <button onClick={() => setQuizSubmitted(true)} className="btn-primary w-full">Submit Answers</button>
            ) : (
              <div className="text-center p-4 bg-primary-50 dark:bg-primary-900/20 rounded-xl">
                <p className="text-2xl font-bold text-primary-600">{quizScore}/{article.comprehension_questions.length}</p>
                <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
                  {quizScore === article.comprehension_questions.length ? '🎉 Perfect score!' : quizScore >= 2 ? '👍 Well done!' : '📚 Keep reading and try again!'}
                </p>
                <button onClick={() => setArticle(null)} className="btn-primary mt-4">Read Another</button>
              </div>
            )}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">📖 Reading Practice</h1>
      <p className="text-gray-500 dark:text-gray-400">AI-generated articles at your <strong>{level}</strong> level. Tap any word for instant definitions + Turkish meaning.</p>

      <div>
        <h2 className="font-semibold text-gray-800 dark:text-gray-200 mb-3">Choose a Topic</h2>
        <div className="flex flex-wrap gap-2">
          {topics.map((t) => (
            <button key={t} onClick={() => setSelectedTopic(t)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${selectedTopic === t ? 'bg-primary-600 text-white' : 'bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200'}`}
            >{t}</button>
          ))}
        </div>
      </div>

      <button onClick={generateArticle} disabled={loading} className="btn-primary w-full py-4 text-lg">
        {loading ? <span className="flex items-center justify-center gap-2"><span className="animate-spin">⚙️</span> Generating article...</span> : `Generate ${selectedTopic} Article →`}
      </button>
    </div>
  )
}

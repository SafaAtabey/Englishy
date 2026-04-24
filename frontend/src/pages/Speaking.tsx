import { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useStore } from '../store/useStore'
import { api, ProRequiredError } from '../lib/api'
import WordPopup from '../components/WordPopup'
import UpgradeModal from '../components/UpgradeModal'
import type { WordPopupData } from '../types'

const topics = [
  { id: 'free',       label: 'Free Conversation', desc: 'Talk about anything you like',       icon: '💬', difficulty: 'All levels',    color: 'from-blue-500 to-indigo-500',   levels: ['A1','A2','B1','B2','C1','C2'], tips: ['Express your opinion','Use connecting words','Ask questions back'] },
  { id: 'daily',      label: 'Daily Routine',      desc: 'Describe your day-to-day life',      icon: '☀️', difficulty: 'Beginner',       color: 'from-yellow-400 to-orange-400', levels: ['A1','A2'],                    tips: ['Use present tense','Time expressions: every morning, usually','Common verbs: wake up, have, go'] },
  { id: 'travel',     label: 'Travel & Places',    desc: 'Discuss destinations & experiences', icon: '✈️', difficulty: 'Intermediate',   color: 'from-sky-400 to-cyan-500',      levels: ['B1','B2'],                    tips: ['Past experiences: I visited...','Recommendations: You should...','Comparisons: better than'] },
  { id: 'work',       label: 'Work & Career',      desc: 'Professional English practice',      icon: '💼', difficulty: 'Intermediate',   color: 'from-slate-500 to-gray-600',    levels: ['B1','B2','C1'],               tips: ['Formal language','Describe responsibilities','Express opinions professionally'] },
  { id: 'airport',    label: 'At the Airport',     desc: 'Role-play: check-in desk scenario',  icon: '🛫', difficulty: 'Beginner',       color: 'from-teal-400 to-emerald-500',  levels: ['A2','B1'],                    tips: ['Polite requests: Can I...','Essential travel words','Ask for clarification'] },
  { id: 'interview',  label: 'Job Interview',      desc: 'Role-play: practice your interview', icon: '🤝', difficulty: 'Advanced',       color: 'from-purple-500 to-violet-600', levels: ['B2','C1','C2'],               tips: ['Highlight achievements','Use past tense for experience','Structured answers: STAR method'] },
  { id: 'doctor',     label: "Doctor's Visit",     desc: 'Role-play: medical consultation',    icon: '🏥', difficulty: 'Intermediate',   color: 'from-rose-400 to-pink-500',     levels: ['B1','B2'],                    tips: ['Describe symptoms clearly','Body vocabulary','Ask about treatment'] },
  { id: 'debate',     label: 'Debate & Opinions',  desc: 'Express and defend your views',      icon: '🗣️', difficulty: 'Advanced',       color: 'from-amber-500 to-red-500',     levels: ['B2','C1','C2'],               tips: ['Agree/disagree phrases','Give reasons: because, therefore','Counter-arguments'] },
  { id: 'shopping',   label: 'Shopping',           desc: 'Role-play: shopping scenarios',      icon: '🛍️', difficulty: 'Beginner',       color: 'from-pink-400 to-fuchsia-500',  levels: ['A2','B1'],                    tips: ['Ask about prices','Sizes and colours','Polite requests'] },
  { id: 'restaurant', label: 'At a Restaurant',    desc: 'Role-play: ordering food',           icon: '🍽️', difficulty: 'Beginner',       color: 'from-orange-400 to-amber-500',  levels: ['A1','A2','B1'],               tips: ['Ordering phrases','Dietary preferences','Complimenting food'] },
]

const STARTERS: Record<string, string> = {
  free:       "Hello! Great to meet you. What's on your mind today — is there anything you'd like to talk about?",
  daily:      "Hi there! Let's talk about your daily routine. Can you describe what a typical morning looks like for you?",
  travel:     "Wonderful topic! Have you travelled anywhere interesting recently, or is there a place you're dreaming of visiting?",
  work:       "Great, let's practise some professional English. Could you start by telling me a little about your work or career goals?",
  airport:    "Good morning! Welcome to the check-in desk. May I see your passport and booking reference, please?",
  interview:  "Good morning, thank you for coming in today. We're really pleased to meet you. Could you start by telling me a little about yourself?",
  doctor:     "Good morning! Please have a seat. What brings you in to see me today — how are you feeling?",
  debate:     "Let's have a good discussion! Here's my opening question: Do you think social media has been more positive or negative for society? Tell me what you think.",
  shopping:   "Hello and welcome! Are you looking for something in particular today, or just browsing?",
  restaurant: "Good evening! Welcome to the restaurant. My name is Alex and I'll be your server tonight. Can I start you off with something to drink?",
}

const DIFFICULTY_COLORS: Record<string, string> = {
  'All levels':   'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  'Beginner':     'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
  'Intermediate': 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  'Advanced':     'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300',
}

interface Message { role: 'user' | 'ai'; text: string; ts: number }
interface Feedback {
  overall: number; fluency: number; grammar: number; vocabulary: number; confidence: number;
  corrections: { original: string; corrected: string; explanation: string }[];
  strengths: string[]; improvements: string[]; next_steps: string[];
}

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    SpeechRecognition: any
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    webkitSpeechRecognition: any
  }
}

function ScoreRing({ score, label, color }: { score: number; label: string; color: string }) {
  const r = 28
  const circ = 2 * Math.PI * r
  const offset = circ - (score / 10) * circ
  return (
    <div className="flex flex-col items-center gap-1">
      <svg width="72" height="72" className="-rotate-90">
        <circle cx="36" cy="36" r={r} fill="none" stroke="currentColor" strokeWidth="5" className="text-gray-200 dark:text-slate-700" />
        <motion.circle
          cx="36" cy="36" r={r} fill="none" stroke={color} strokeWidth="5"
          strokeLinecap="round"
          strokeDasharray={circ}
          initial={{ strokeDashoffset: circ }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1, delay: 0.3 }}
        />
      </svg>
      <span className="text-xl font-extrabold text-gray-900 dark:text-white -mt-12">{score}</span>
      <span className="text-xs text-gray-500 mt-8">{label}</span>
    </div>
  )
}

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0')
  const s = (seconds % 60).toString().padStart(2, '0')
  return `${m}:${s}`
}

export default function Speaking() {
  const { profile } = useStore()
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null)
  const [sessionActive, setSessionActive] = useState(false)
  const [recording, setRecording] = useState(false)
  const [aiThinking, setAiThinking] = useState(false)
  const [aiSpeaking, setAiSpeaking] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [feedback, setFeedback] = useState<Feedback | null>(null)
  const [loadingFeedback, setLoadingFeedback] = useState(false)
  const [popupData, setPopupData] = useState<WordPopupData | null>(null)
  const [popupLoading, setPopupLoading] = useState(false)
  const [savedWords, setSavedWords] = useState<Set<string>>(new Set())
  const [speechSupported] = useState(() => !!(window.SpeechRecognition || window.webkitSpeechRecognition))
  const [manualInput, setManualInput] = useState('')
  const [timer, setTimer] = useState(0)
  const [showPhrases, setShowPhrases] = useState(false)
  const [lastAiText, setLastAiText] = useState('')
  const [showUpgrade, setShowUpgrade] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const recognitionRef = useRef<any>(null)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const sessionStartRef = useRef<number>(0)
  const messagesRef = useRef<Message[]>([])

  const level = profile?.cefr_level || 'B1'
  const filteredTopics = topics.filter(t => t.levels.includes(level))
  const currentTopic = topics.find(t => t.id === selectedTopic)

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages, aiThinking])
  useEffect(() => { messagesRef.current = messages }, [messages])

  useEffect(() => {
    if (sessionActive) {
      sessionStartRef.current = Date.now()
      timerRef.current = setInterval(() => setTimer(t => t + 1), 1000)
    } else {
      if (timerRef.current) clearInterval(timerRef.current)
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [sessionActive])

  const speakAI = useCallback((text: string) => {
    if (!('speechSynthesis' in window)) return

    window.speechSynthesis.cancel()

    const doSpeak = () => {
      const u = new SpeechSynthesisUtterance(text)
      u.lang = 'en-US'
      u.rate = level === 'A1' || level === 'A2' ? 0.8 : level === 'B1' ? 0.9 : 0.95
      u.pitch = 1.05

      const voices = window.speechSynthesis.getVoices()
      const voice =
        voices.find(v => v.lang === 'en-US' && v.name.includes('Google')) ??
        voices.find(v => v.lang === 'en-US') ??
        voices.find(v => v.lang.startsWith('en'))
      if (voice) u.voice = voice

      setAiSpeaking(true)
      u.onend = () => setAiSpeaking(false)
      u.onerror = () => setAiSpeaking(false)
      window.speechSynthesis.speak(u)
    }

    const voices = window.speechSynthesis.getVoices()
    if (voices.length > 0) {
      // Chrome bug: cancel() + immediate speak() is often silent — delay fixes it
      setTimeout(doSpeak, 150)
    } else {
      // Voices not loaded yet — wait once
      window.speechSynthesis.addEventListener('voiceschanged', doSpeak, { once: true })
    }
  }, [level])

  const getAIResponse = useCallback(async (userText: string, history: Message[]) => {
    setAiThinking(true)
    try {
      const res = await api.speakingRespond(
        [...history, { role: 'user', text: userText }],
        level,
        selectedTopic || 'free',
        profile?.id
      )
      const aiText = res.text
      setMessages(prev => [...prev, { role: 'ai', text: aiText, ts: Date.now() }])
      setLastAiText(aiText)
      speakAI(aiText)
    } catch (e) {
      if (e instanceof ProRequiredError) { setShowUpgrade(true); setSessionActive(false); return }
      const fallback = "I didn't quite catch that. Could you say that again?"
      setMessages(prev => [...prev, { role: 'ai', text: fallback, ts: Date.now() }])
      setLastAiText(fallback)
    } finally {
      setAiThinking(false)
    }
  }, [level, selectedTopic, speakAI, profile?.id])

  const startSession = useCallback(() => {
    const starter = STARTERS[selectedTopic || 'free']
    setSessionActive(true)
    setTimer(0)
    setMessages([{ role: 'ai', text: starter, ts: Date.now() }])
    setLastAiText(starter)
    speakAI(starter)
  }, [selectedTopic, speakAI])

  const startRecording = useCallback(() => {
    if (!speechSupported || recording || aiThinking) return
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    const recognition = new SR()
    recognition.lang = 'en-US'
    recognition.continuous = true
    recognition.interimResults = false
    recognitionRef.current = recognition
    window.speechSynthesis.cancel()
    setAiSpeaking(false)

    let collected = ''
    recognition.onstart = () => setRecording(true)
    recognition.onend = () => {
      setRecording(false)
      const transcript = collected.trim()
      collected = ''
      if (transcript) {
        const snapshot = messagesRef.current
        setMessages(prev => [...prev, { role: 'user', text: transcript, ts: Date.now() }])
        getAIResponse(transcript, snapshot)
      }
    }
    recognition.onerror = () => { setRecording(false); collected = '' }
    recognition.onresult = (e: SpeechRecognitionEvent) => {
      for (let i = e.resultIndex; i < e.results.length; i++) {
        if (e.results[i].isFinal) collected += e.results[i][0].transcript + ' '
      }
    }
    recognition.start()
  }, [speechSupported, recording, aiThinking, getAIResponse])

  const stopRecording = useCallback(() => {
    recognitionRef.current?.stop()
    setRecording(false)
  }, [])

  const sendManual = useCallback(() => {
    const text = manualInput.trim()
    if (!text || aiThinking) return
    setManualInput('')
    const snapshot = messagesRef.current
    setMessages(prev => [...prev, { role: 'user', text, ts: Date.now() }])
    getAIResponse(text, snapshot)
  }, [manualInput, aiThinking, getAIResponse])

  const endSession = useCallback(async () => {
    window.speechSynthesis.cancel()
    setSessionActive(false)
    setAiThinking(false)
    setAiSpeaking(false)
    setLoadingFeedback(true)
    try {
      const fb = await api.speakingFeedback(messages, level, selectedTopic || 'free', timer)
      setFeedback(fb)
    } catch {
      setFeedback({ overall: 6, fluency: 6, grammar: 6, vocabulary: 6, confidence: 6, corrections: [], strengths: ['Good effort!'], improvements: ['Keep practising daily.'], next_steps: ['Try a 10-minute session tomorrow.'] })
    } finally {
      setLoadingFeedback(false)
    }
  }, [messages, level, selectedTopic, timer])

  const replayAI = useCallback(() => {
    if (lastAiText) speakAI(lastAiText)
  }, [lastAiText, speakAI])

  const handleWordClick = useCallback(async (rawWord: string) => {
    const clean = rawWord.replace(/[.,!?;:'"()]/g, '').toLowerCase()
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
  }, [level])

  const renderTappable = useCallback((text: string) => {
    return text.split(/(\s+)/).map((token, i) => {
      const clean = token.replace(/[.,!?;:'"()]/g, '').toLowerCase()
      const isSaved = savedWords.has(clean)
      if (clean.length < 3) return <span key={i}>{token}</span>
      return (
        <span key={i} onClick={() => handleWordClick(token)}
          className={`cursor-pointer rounded px-0.5 transition-colors hover:bg-yellow-100 dark:hover:bg-yellow-900/30 ${isSaved ? 'bg-yellow-200 dark:bg-yellow-800/40 font-medium' : ''}`}
        >{token}</span>
      )
    })
  }, [savedWords, handleWordClick])

  const userMsgCount = messages.filter(m => m.role === 'user').length

  // ── FEEDBACK SCREEN ──────────────────────────────────────────────────────
  if (loadingFeedback) {
    return (
      <div className="max-w-2xl mx-auto text-center py-24 space-y-4">
        <div className="text-5xl animate-bounce">📊</div>
        <p className="text-xl font-bold text-gray-900 dark:text-white">Analysing your session...</p>
        <p className="text-gray-500">Alex is reviewing your performance</p>
      </div>
    )
  }

  if (feedback) {
    const scoreColor = (s: number) => s >= 8 ? '#10B981' : s >= 6 ? '#F59E0B' : '#EF4444'
    return (
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-2xl mx-auto space-y-6 pb-8">
        <WordPopup data={popupData} onClose={() => setPopupData(null)} onSaved={w => setSavedWords(s => new Set([...s, w]))} />

        {/* Header */}
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center text-white text-2xl font-bold shadow-lg">A</div>
          <div>
            <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white">Session Report</h1>
            <p className="text-gray-500 text-sm">{currentTopic?.label} · {formatTime(timer)} · {userMsgCount} messages</p>
          </div>
        </div>

        {/* Overall score banner */}
        <div className={`card bg-gradient-to-r ${feedback.overall >= 8 ? 'from-emerald-500 to-teal-600' : feedback.overall >= 6 ? 'from-amber-500 to-orange-500' : 'from-primary-600 to-primary-700'} text-white`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white/80 text-sm font-medium">Overall Score</p>
              <p className="text-5xl font-extrabold mt-1">{feedback.overall}<span className="text-2xl font-normal text-white/60">/10</span></p>
              <p className="text-white/80 text-sm mt-1">
                {feedback.overall >= 8 ? '🌟 Excellent!' : feedback.overall >= 6 ? '👍 Good progress!' : '💪 Keep practising!'}
              </p>
            </div>
            <div className="text-6xl opacity-20 font-black">{feedback.overall >= 8 ? 'A' : feedback.overall >= 6 ? 'B' : 'C'}</div>
          </div>
        </div>

        {/* 4 sub-scores */}
        <div className="card">
          <h2 className="font-bold text-gray-900 dark:text-white mb-5">Skill Breakdown</h2>
          <div className="grid grid-cols-4 gap-2">
            <ScoreRing score={feedback.fluency}    label="Fluency"    color={scoreColor(feedback.fluency)} />
            <ScoreRing score={feedback.grammar}    label="Grammar"    color={scoreColor(feedback.grammar)} />
            <ScoreRing score={feedback.vocabulary} label="Vocabulary" color={scoreColor(feedback.vocabulary)} />
            <ScoreRing score={feedback.confidence} label="Confidence" color={scoreColor(feedback.confidence)} />
          </div>
        </div>

        {/* Corrections */}
        {feedback.corrections.length > 0 && (
          <div className="card">
            <h2 className="font-bold text-gray-900 dark:text-white mb-3">✏️ Grammar Corrections</h2>
            <div className="space-y-3">
              {feedback.corrections.map((c, i) => (
                <div key={i} className="p-3 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-100 dark:border-red-800">
                  <div className="flex items-start gap-2 mb-1">
                    <span className="text-red-400 text-sm line-through shrink-0">"{c.original}"</span>
                    <span className="text-gray-400">→</span>
                    <span className="text-emerald-600 dark:text-emerald-400 font-semibold text-sm">"{c.corrected}"</span>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{c.explanation}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Strengths & improvements */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="card">
            <h2 className="font-bold text-emerald-600 dark:text-emerald-400 mb-3">✅ Strengths</h2>
            <ul className="space-y-2">
              {feedback.strengths.map((s, i) => (
                <li key={i} className="flex gap-2 text-sm text-gray-700 dark:text-gray-300">
                  <span className="text-emerald-500 shrink-0">•</span>{s}
                </li>
              ))}
            </ul>
          </div>
          <div className="card">
            <h2 className="font-bold text-amber-600 dark:text-amber-400 mb-3">📈 To Improve</h2>
            <ul className="space-y-2">
              {feedback.improvements.map((s, i) => (
                <li key={i} className="flex gap-2 text-sm text-gray-700 dark:text-gray-300">
                  <span className="text-amber-500 shrink-0">•</span>{s}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Next steps */}
        <div className="card bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800">
          <h2 className="font-bold text-primary-700 dark:text-primary-300 mb-3">🎯 Next Steps</h2>
          <ul className="space-y-2">
            {feedback.next_steps.map((s, i) => (
              <li key={i} className="flex gap-2 text-sm text-primary-800 dark:text-primary-300">
                <span className="shrink-0 font-bold">{i + 1}.</span>{s}
              </li>
            ))}
          </ul>
        </div>

        {/* Transcript */}
        {messages.length > 0 && (
          <div className="card">
            <h2 className="font-bold text-gray-900 dark:text-white mb-1">📋 Session Transcript</h2>
            <p className="text-xs text-gray-400 mb-3">Tap any word to save it to your vocabulary</p>
            <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
              {messages.map((msg, i) => (
                <div key={i} className={`p-3 rounded-xl text-sm ${msg.role === 'ai' ? 'bg-gray-50 dark:bg-slate-700' : 'bg-primary-50 dark:bg-primary-900/20 ml-6'}`}>
                  <span className="text-xs font-bold text-gray-400 block mb-1">{msg.role === 'ai' ? '🤖 Alex' : '👤 You'}</span>
                  <span className="leading-relaxed text-gray-700 dark:text-gray-300">{renderTappable(msg.text)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex gap-3">
          <button onClick={() => { setFeedback(null); setSelectedTopic(null); setMessages([]); setTimer(0) }} className="btn-outline flex-1">New Session</button>
          <button onClick={() => { setFeedback(null); startSession() }} className="btn-primary flex-1">Try Again →</button>
        </div>
      </motion.div>
    )
  }

  // ── ACTIVE SESSION ────────────────────────────────────────────────────────
  if (sessionActive) {
    return (
      <div className="max-w-2xl mx-auto flex flex-col h-[calc(100vh-7rem)]">
        <WordPopup data={popupData} onClose={() => setPopupData(null)} onSaved={w => setSavedWords(s => new Set([...s, w]))} />
        {popupLoading && <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-white dark:bg-slate-800 shadow-xl rounded-2xl px-5 py-3 z-40 text-sm flex items-center gap-2 border border-gray-100 dark:border-slate-700"><span className="animate-spin">⚙️</span> Looking up...</div>}

        {/* Session header */}
        <div className="flex items-center gap-3 mb-4 pb-4 border-b border-gray-100 dark:border-slate-700">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center text-white font-extrabold text-lg shrink-0 shadow">A</div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-gray-900 dark:text-white text-sm">Alex — AI Tutor</p>
            <p className="text-xs text-gray-400 truncate">{currentTopic?.label} · {level}</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-center">
              <div className="text-sm font-mono font-bold text-primary-600 dark:text-primary-400">{formatTime(timer)}</div>
              <div className="text-xs text-gray-400">{userMsgCount} msg</div>
            </div>
            {savedWords.size > 0 && (
              <div className="text-center">
                <div className="text-sm font-bold text-yellow-600 dark:text-yellow-400">{savedWords.size}</div>
                <div className="text-xs text-gray-400">saved</div>
              </div>
            )}
            <button onClick={endSession} className="px-3 py-2 text-xs font-semibold text-red-500 border border-red-200 dark:border-red-800 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 transition-all whitespace-nowrap">
              End
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto space-y-3 mb-3 pr-1">
          {messages.map((msg, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              className={`flex items-end gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {msg.role === 'ai' && (
                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center text-white text-xs font-bold shrink-0 mb-0.5">A</div>
              )}
              <div className={`max-w-[78%] px-4 py-3 rounded-2xl text-sm leading-relaxed shadow-sm ${
                msg.role === 'ai'
                  ? 'bg-white dark:bg-slate-700 text-gray-800 dark:text-gray-200 rounded-bl-sm'
                  : 'bg-primary-600 text-white rounded-br-sm'
              }`}>
                {msg.role === 'ai' ? renderTappable(msg.text) : msg.text}
              </div>
              {msg.role === 'user' && (
                <div className="w-7 h-7 rounded-lg bg-gray-200 dark:bg-slate-600 flex items-center justify-center text-gray-600 dark:text-gray-300 text-xs font-bold shrink-0 mb-0.5">
                  {profile?.name?.[0]?.toUpperCase() || 'U'}
                </div>
              )}
            </motion.div>
          ))}

          {aiThinking && (
            <div className="flex items-end gap-2">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center text-white text-xs font-bold shrink-0">A</div>
              <div className="bg-white dark:bg-slate-700 shadow-sm px-4 py-3 rounded-2xl rounded-bl-sm flex items-center gap-1.5">
                {[0, 1, 2].map(i => (
                  <motion.span key={i} className="w-2 h-2 rounded-full bg-gray-400 block"
                    animate={{ y: [0, -4, 0] }} transition={{ repeat: Infinity, duration: 0.8, delay: i * 0.15 }} />
                ))}
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Suggested phrases */}
        <AnimatePresence>
          {showPhrases && currentTopic && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden mb-2"
            >
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-3 border border-blue-100 dark:border-blue-800">
                <p className="text-xs font-semibold text-blue-600 dark:text-blue-400 mb-2">💡 Suggested phrases for this topic</p>
                <div className="flex flex-wrap gap-2">
                  {currentTopic.tips.map((tip, i) => (
                    <button key={i} onClick={() => { setManualInput(tip); setShowPhrases(false) }}
                      className="text-xs px-3 py-1.5 bg-white dark:bg-slate-700 border border-blue-200 dark:border-blue-700 text-blue-700 dark:text-blue-300 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors"
                    >{tip}</button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Input area */}
        <div className="space-y-2.5 pb-1">
          {speechSupported && (
            <div className="flex items-center justify-center gap-6">
              {/* Replay AI */}
              <button onClick={replayAI} disabled={!lastAiText || aiThinking}
                className={`w-10 h-10 rounded-full border-2 flex items-center justify-center transition-all ${aiSpeaking ? 'border-primary-400 bg-primary-50 text-primary-600 animate-pulse' : 'border-gray-200 dark:border-slate-600 text-gray-400 hover:text-primary-600 hover:border-primary-400'}`}
                title="Replay last message"
              >
                🔊
              </button>

              {/* Mic button with pulse rings */}
              <div className="relative">
                {recording && (
                  <>
                    <span className="absolute inset-0 rounded-full bg-red-400 opacity-30 animate-ping" />
                    <span className="absolute -inset-2 rounded-full border-2 border-red-400 opacity-20 animate-ping" style={{ animationDelay: '0.2s' }} />
                  </>
                )}
                <motion.button
                  whileTap={{ scale: 0.92 }}
                  onClick={recording ? stopRecording : startRecording}
                  disabled={aiThinking}
                  className={`relative w-16 h-16 rounded-full shadow-lg flex items-center justify-center text-2xl transition-all z-10 ${
                    recording ? 'bg-red-500 text-white' : aiThinking ? 'bg-gray-200 dark:bg-slate-600 text-gray-400 cursor-not-allowed' : 'bg-primary-600 hover:bg-primary-700 text-white'
                  }`}
                >
                  {recording ? '⏹' : '🎙️'}
                </motion.button>
              </div>

              {/* Phrases toggle */}
              <button onClick={() => setShowPhrases(p => !p)}
                className={`w-10 h-10 rounded-full border-2 flex items-center justify-center transition-all ${showPhrases ? 'border-blue-400 bg-blue-50 text-blue-600' : 'border-gray-200 dark:border-slate-600 text-gray-400 hover:text-blue-600 hover:border-blue-400'}`}
                title="Suggested phrases"
              >
                💡
              </button>
            </div>
          )}

          {/* Text input */}
          <div className="flex gap-2">
            <input
              className="input-field flex-1 text-sm"
              placeholder={speechSupported ? 'Or type your message...' : 'Type your message...'}
              value={manualInput}
              onChange={e => setManualInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendManual()}
              disabled={aiThinking}
            />
            <button onClick={sendManual} disabled={!manualInput.trim() || aiThinking}
              className="px-4 py-2.5 bg-primary-600 text-white rounded-xl disabled:opacity-40 hover:bg-primary-700 transition-colors text-sm font-semibold"
            >
              Send
            </button>
          </div>
          <p className="text-center text-xs text-gray-400">
            {recording ? 'Listening… tap ⏹ to stop' : speechSupported ? 'Tap mic to speak  ·  tap 🔊 to replay  ·  tap 💡 for phrases' : 'Type your reply and press Enter'}
          </p>
        </div>
      </div>
    )
  }

  // ── TOPIC SELECTION ───────────────────────────────────────────────────────
  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <UpgradeModal open={showUpgrade} onClose={() => setShowUpgrade(false)} feature="AI Speaking Practice" />
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center text-white text-2xl font-extrabold shadow-lg">A</div>
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white">Speaking Practice</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-0.5">Real AI conversation with Alex · Your level: <span className={`cefr-badge cefr-${level.toLowerCase()} text-xs`}>{level}</span></p>
        </div>
      </div>

      {/* Voice support banner */}
      {speechSupported ? (
        <div className="flex items-center gap-3 p-4 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-2xl">
          <span className="text-2xl">🎙️</span>
          <div>
            <p className="font-semibold text-emerald-800 dark:text-emerald-300 text-sm">Voice mode active</p>
            <p className="text-emerald-700 dark:text-emerald-400 text-xs">Tap the mic to start speaking — tap again to stop — Alex will respond out loud</p>
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-3 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-2xl">
          <span className="text-2xl">⌨️</span>
          <div>
            <p className="font-semibold text-amber-800 dark:text-amber-300 text-sm">Text mode</p>
            <p className="text-amber-700 dark:text-amber-400 text-xs">Your browser doesn't support voice input — you can type your messages instead</p>
          </div>
        </div>
      )}

      {/* Topic grid */}
      <div>
        <h2 className="font-bold text-gray-900 dark:text-white mb-4 text-lg">Choose a Topic</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filteredTopics.map((topic) => {
            const isSelected = selectedTopic === topic.id
            return (
              <motion.button key={topic.id} whileHover={{ y: -2 }} whileTap={{ scale: 0.98 }}
                onClick={() => setSelectedTopic(topic.id)}
                className={`text-left rounded-2xl overflow-hidden border-2 transition-all shadow-sm ${
                  isSelected ? 'border-primary-500 shadow-primary-100 dark:shadow-primary-900/20' : 'border-transparent hover:border-gray-200 dark:hover:border-slate-600'
                }`}
              >
                {/* Gradient top bar */}
                <div className={`h-1.5 w-full bg-gradient-to-r ${topic.color}`} />
                <div className={`p-4 ${isSelected ? 'bg-primary-50 dark:bg-primary-900/20' : 'bg-white dark:bg-slate-800'}`}>
                  <div className="flex items-start justify-between mb-2">
                    <span className="text-2xl">{topic.icon}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${DIFFICULTY_COLORS[topic.difficulty]}`}>{topic.difficulty}</span>
                  </div>
                  <h3 className="font-bold text-gray-900 dark:text-white text-sm mb-1">{topic.label}</h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">{topic.desc}</p>
                  <div className="space-y-1">
                    {topic.tips.map((tip, i) => (
                      <p key={i} className="text-xs text-gray-400 dark:text-gray-500 flex items-center gap-1">
                        <span className="w-1 h-1 rounded-full bg-gray-300 dark:bg-gray-600 shrink-0" />{tip}
                      </p>
                    ))}
                  </div>
                </div>
              </motion.button>
            )
          })}
        </div>
      </div>

      {/* Start button */}
      <AnimatePresence>
        {selectedTopic && (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="flex items-center justify-center gap-4"
          >
            <div className="text-center">
              <button
                onClick={() => profile?.subscription_plan === 'free' ? setShowUpgrade(true) : startSession()}
                className="px-12 py-4 bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white font-bold text-lg rounded-2xl shadow-lg shadow-primary-200 dark:shadow-primary-900/30 transition-all active:scale-95"
              >
                {profile?.subscription_plan === 'free' ? '⭐ Upgrade to Start' : 'Start Session with Alex →'}
              </button>
              <p className="text-xs text-gray-400 mt-2">Topic: <strong>{currentTopic?.label}</strong></p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

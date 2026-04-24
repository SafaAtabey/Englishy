import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useStore } from '../store/useStore'
import { supabase } from '../lib/supabase'
import type { WordPopupData } from '../types'

interface Props {
  data: WordPopupData | null
  onClose: () => void
  onSaved?: (word: string) => void
}

export default function WordPopup({ data, onClose, onSaved }: Props) {
  const { profile } = useStore()
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const handleSave = async () => {
    if (!profile || !data || saving || saved) return
    setSaving(true)
    try {
      // Ensure word exists in words table
      const { data: existing } = await supabase.from('words').select('id').eq('word', data.word.toLowerCase()).single()
      let wordId = existing?.id
      if (!wordId) {
        const { data: inserted } = await supabase.from('words').insert({
          word: data.word.toLowerCase(),
          phonetic: data.phonetic,
          definition_en: data.definition_en,
          definition_tr: data.definition_tr,
          example_sentence: data.example_sentence,
          cefr_level: data.cefr_level,
          part_of_speech: data.part_of_speech,
          source: 'touch_saved',
          ai_generated_at: new Date().toISOString(),
        }).select('id').single()
        wordId = inserted?.id
      }
      if (wordId) {
        await supabase.from('user_words').upsert({
          user_id: profile.id,
          word_id: wordId,
          status: 'touch_saved',
          save_source: 'touch',
          next_review_date: new Date(Date.now() + 86400000).toISOString().split('T')[0],
        })
        setSaved(true)
        onSaved?.(data.word)
      }
    } finally {
      setSaving(false)
    }
  }

  const speak = () => {
    if (!data || !('speechSynthesis' in window)) return
    const u = new SpeechSynthesisUtterance(`${data.word}. ${data.example_sentence}`)
    u.lang = 'en-US'
    u.rate = 0.85
    window.speechSynthesis.speak(u)
  }

  return (
    <AnimatePresence>
      {data && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 z-40"
            onClick={onClose}
          />
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-slate-800 rounded-t-3xl shadow-2xl p-6 max-w-lg mx-auto"
          >
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <button onClick={speak} className="w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-primary-600 hover:bg-primary-200 transition-colors" aria-label="Play pronunciation">
                  🔊
                </button>
                <div>
                  <h2 className="text-2xl font-extrabold text-gray-900 dark:text-white capitalize">{data.word}</h2>
                  <p className="text-gray-400 font-mono text-sm">{data.phonetic}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className={`cefr-badge cefr-${data.cefr_level.toLowerCase()}`}>{data.cefr_level}</span>
                <span className="cefr-badge bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300">{data.part_of_speech}</span>
                <button onClick={onClose} className="w-8 h-8 rounded-full bg-gray-100 dark:bg-slate-700 flex items-center justify-center text-gray-500 hover:bg-gray-200 transition-colors">✕</button>
              </div>
            </div>

            {/* Definitions */}
            <div className="space-y-3 mb-4">
              <div className="flex gap-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
                <span className="text-lg shrink-0">🇬🇧</span>
                <p className="text-gray-800 dark:text-gray-200 text-sm leading-relaxed">{data.definition_en}</p>
              </div>
              <div className="flex gap-3 p-3 bg-red-50 dark:bg-red-900/20 rounded-xl">
                <span className="text-lg shrink-0">🇹🇷</span>
                <p className="text-gray-800 dark:text-gray-200 text-sm leading-relaxed font-medium">{data.definition_tr}</p>
              </div>
            </div>

            {/* Example */}
            <div className="p-3 bg-gray-50 dark:bg-slate-700 rounded-xl mb-5">
              <p className="text-xs text-gray-400 mb-1 font-medium uppercase tracking-wide">Example</p>
              <p className="text-gray-700 dark:text-gray-300 text-sm italic">"{data.example_sentence}"</p>
            </div>

            {/* Save button */}
            <button
              onClick={handleSave}
              disabled={saving || saved}
              className={`w-full py-3.5 rounded-xl font-bold text-base transition-all ${
                saved
                  ? 'bg-accent-100 dark:bg-accent-900/30 text-accent-700 dark:text-accent-400'
                  : 'bg-primary-600 hover:bg-primary-700 text-white shadow-md active:scale-95'
              }`}
            >
              {saved ? '✅ Word Saved to Your List!' : saving ? 'Saving...' : '💾 Save This Word'}
            </button>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

export type CEFRLevel = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2'
export type SubscriptionPlan = 'free' | 'pro' | 'annual'
export type WordStatus = 'learning' | 'known' | 'saved' | 'touch_saved'
export type SaveSource = 'flashcard' | 'touch' | 'manual'

export interface Word {
  id: string
  word: string
  phonetic: string
  definition_en: string
  definition_tr: string
  example_sentence: string
  part_of_speech: string
  cefr_level: CEFRLevel
  synonyms: string[]
  word_family: string[]
  audio_url?: string | null
  source: 'oxford' | 'ai' | 'touch_saved'
  ai_generated_at?: string | null
}

export interface UserWord {
  id: string
  user_id: string
  word_id: string
  status: WordStatus
  save_source: SaveSource
  ease_factor: number
  interval_days: number
  next_review_date: string | null
  times_seen: number
  times_correct: number
  saved_at?: string
  word?: Word
}

export interface UserProfile {
  id: string
  email: string
  name: string
  native_language: string
  cefr_level: CEFRLevel
  subscription_plan: SubscriptionPlan
  stripe_customer_id?: string | null
  daily_goal: number
  streak_count: number
  last_active: string | null
  created_at: string
}

export interface WritingFeedback {
  score: number
  grammar_errors: { error: string; correction: string; explanation: string }[]
  vocabulary_suggestions: { original: string; better: string }[]
  structure_feedback: string
  positive_highlights: string[]
  corrected_text: string
}

export interface Article {
  id: string
  title: string
  content: string
  cefr_level: CEFRLevel
  topic: string
  word_count: number
  comprehension_questions: { question: string; options: string[]; answer: number }[]
  created_at: string
}

export interface PlacementQuestion {
  id: number
  question: string
  options: string[]
  correct: number
  level: CEFRLevel
}

export interface Book {
  id: string
  user_id: string
  title: string
  paragraphs: string[]
  total_words: number
  page_count: number
  created_at: string
}

export interface AtlasUnit {
  unit: number
  title: string
  topic: string
  words: Word[]
}

export interface WordPopupData {
  word: string
  phonetic: string
  definition_en: string
  definition_tr: string
  example_sentence: string
  cefr_level: CEFRLevel
  part_of_speech: string
}

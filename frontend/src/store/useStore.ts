import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { User, Session } from '@supabase/supabase-js'

interface UserProfile {
  id: string
  email: string
  name: string
  native_language: string
  cefr_level: string
  subscription_plan: string
  stripe_customer_id?: string | null
  daily_goal: number
  streak_count: number
  last_active: string | null
}

interface AppState {
  user: User | null
  session: Session | null
  profile: UserProfile | null
  darkMode: boolean
  language: 'en' | 'tr'
  initializing: boolean
  setUser: (user: User | null) => void
  setSession: (session: Session | null) => void
  setProfile: (profile: UserProfile | null) => void
  toggleDarkMode: () => void
  setLanguage: (lang: 'en' | 'tr') => void
  setInitializing: (v: boolean) => void
}

export const useStore = create<AppState>()(
  persist(
    (set) => ({
      user: null,
      session: null,
      profile: null,
      darkMode: false,
      language: 'en',
      initializing: true,
      setUser: (user) => set({ user }),
      setSession: (session) => set({ session }),
      setProfile: (profile) => set({ profile }),
      toggleDarkMode: () => set((s) => {
        const next = !s.darkMode
        document.documentElement.classList.toggle('dark', next)
        return { darkMode: next }
      }),
      setLanguage: (language) => set({ language }),
      setInitializing: (initializing) => set({ initializing }),
    }),
    {
      name: 'englify-store',
      partialize: (s) => ({ darkMode: s.darkMode, language: s.language }),
    }
  )
)

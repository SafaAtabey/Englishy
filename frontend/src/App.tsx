import { useEffect } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { supabase } from './lib/supabase'
import { useStore } from './store/useStore'
import Layout from './components/Layout'
import ProtectedRoute from './components/ProtectedRoute'

import Landing from './pages/Landing'
import Login from './pages/Login'
import Signup from './pages/Signup'
import Dashboard from './pages/Dashboard'
import Vocabulary from './pages/Vocabulary'
import VocabSaved from './pages/VocabSaved'
import VocabReview from './pages/VocabReview'
import VocabPractice from './pages/VocabPractice'
import Books from './pages/Books'
import BookReader from './pages/BookReader'
import Speaking from './pages/Speaking'
import Writing from './pages/Writing'
import Reading from './pages/Reading'
import Listening from './pages/Listening'
import Progress from './pages/Progress'
import Achievements from './pages/Achievements'
import Settings from './pages/Settings'
import Pricing from './pages/Pricing'
import PlacementTest from './pages/PlacementTest'
import Grammar from './pages/Grammar'

const queryClient = new QueryClient()

export default function App() {
  const { setUser, setSession, setProfile, darkMode, setInitializing } = useStore()

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode)
  }, [darkMode])

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setUser(session.user)
        setSession(session)
        supabase.from('users').select('*').eq('id', session.user.id).single().then(({ data }) => {
          if (data) setProfile(data)
          setInitializing(false)
        })
      } else {
        setInitializing(false)
      }
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      setSession(session)
      if (session?.user) {
        supabase.from('users').select('*').eq('id', session.user.id).single().then(({ data }) => {
          if (data) setProfile(data)
        })
      } else {
        setProfile(null)
      }
    })
    return () => subscription.unsubscribe()
  }, [])

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/pricing" element={<Pricing />} />

          <Route path="/dashboard" element={<ProtectedRoute><Layout><Dashboard /></Layout></ProtectedRoute>} />
          <Route path="/vocabulary" element={<ProtectedRoute><Layout><Vocabulary /></Layout></ProtectedRoute>} />
          <Route path="/vocabulary/saved" element={<ProtectedRoute><Layout><VocabSaved /></Layout></ProtectedRoute>} />
          <Route path="/vocabulary/review" element={<ProtectedRoute><Layout><VocabReview /></Layout></ProtectedRoute>} />
          <Route path="/vocabulary/practice" element={<ProtectedRoute><Layout><VocabPractice /></Layout></ProtectedRoute>} />
          <Route path="/books" element={<ProtectedRoute><Layout><Books /></Layout></ProtectedRoute>} />
          <Route path="/books/:id" element={<ProtectedRoute><Layout><BookReader /></Layout></ProtectedRoute>} />
          <Route path="/speaking" element={<ProtectedRoute><Layout><Speaking /></Layout></ProtectedRoute>} />
          <Route path="/writing" element={<ProtectedRoute><Layout><Writing /></Layout></ProtectedRoute>} />
          <Route path="/reading" element={<ProtectedRoute><Layout><Reading /></Layout></ProtectedRoute>} />
          <Route path="/listening" element={<ProtectedRoute><Layout><Listening /></Layout></ProtectedRoute>} />
          <Route path="/progress" element={<ProtectedRoute><Layout><Progress /></Layout></ProtectedRoute>} />
          <Route path="/achievements" element={<ProtectedRoute><Layout><Achievements /></Layout></ProtectedRoute>} />
          <Route path="/settings" element={<ProtectedRoute><Layout><Settings /></Layout></ProtectedRoute>} />
          <Route path="/placement-test" element={<ProtectedRoute><Layout><PlacementTest /></Layout></ProtectedRoute>} />
          <Route path="/level-up" element={<ProtectedRoute><Layout><PlacementTest mode="levelup" /></Layout></ProtectedRoute>} />
          <Route path="/grammar" element={<ProtectedRoute><Layout><Grammar /></Layout></ProtectedRoute>} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  )
}

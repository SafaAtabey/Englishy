import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '../lib/supabase'
import { useStore } from '../store/useStore'
import { placementQuestions, calculateCEFR } from '../lib/placementQuestions'

type Step = 'register' | 'placement' | 'plan' | 'done'

export default function Signup() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { setUser, setSession, setProfile } = useStore()

  const [step, setStep] = useState<Step>('register')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [userId, setUserId] = useState('')

  // Placement test
  const [current, setCurrent] = useState(0)
  const [answers, setAnswers] = useState<number[]>([])
  const [cefrLevel, setCefrLevel] = useState('')

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    const { data, error } = await supabase.auth.signUp({ email, password })
    if (error) { setError(error.message); setLoading(false); return }
    if (data.user) {
      setUser(data.user)
      setSession(data.session)
      setUserId(data.user.id)
      // Create user profile
      await supabase.from('users').insert({
        id: data.user.id,
        email,
        name,
        native_language: 'Turkish',
        cefr_level: 'A1',
        subscription_plan: 'free',
        daily_goal: 10,
        streak_count: 0,
      })
    }
    setLoading(false)
    setStep('placement')
  }

  const handleAnswer = (idx: number) => {
    const newAnswers = [...answers, idx]
    setAnswers(newAnswers)
    if (current + 1 < placementQuestions.length) {
      setCurrent(current + 1)
    } else {
      const level = calculateCEFR(newAnswers, placementQuestions)
      setCefrLevel(level)
      supabase.from('users').update({ cefr_level: level }).eq('id', userId)
      setStep('plan')
    }
  }

  const handlePlan = async (plan: string) => {
    await supabase.from('users').update({ subscription_plan: plan }).eq('id', userId)
    const { data: profileData } = await supabase.from('users').select('*').eq('id', userId).single()
    if (profileData) setProfile(profileData)
    setStep('done')
    setTimeout(() => navigate('/dashboard'), 1500)
  }

  const defaultPlan = searchParams.get('plan') || 'free'

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-600 to-primary-800 flex items-center justify-center p-4">
      <AnimatePresence mode="wait">
        {step === 'register' && (
          <motion.div key="register" initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }}
            className="w-full max-w-md bg-white dark:bg-slate-800 rounded-2xl shadow-2xl p-8"
          >
            <div className="text-center mb-8">
              <span className="text-4xl">🎓</span>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white mt-3">Create your account</h1>
              <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Start your English journey today</p>
            </div>
            {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">{error}</div>}
            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Full Name</label>
                <input className="input-field" placeholder="Ahmet Yılmaz" value={name} onChange={(e) => setName(e.target.value)} required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Email</label>
                <input type="email" className="input-field" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Password</label>
                <input type="password" className="input-field" placeholder="Min 6 characters" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />
              </div>
              <button type="submit" disabled={loading} className="btn-primary w-full">
                {loading ? 'Creating account...' : 'Create Account'}
              </button>
            </form>
            <p className="text-center text-sm text-gray-500 mt-4">
              Already have an account? <Link to="/login" className="text-primary-600 font-medium hover:underline">Sign in</Link>
            </p>
          </motion.div>
        )}

        {step === 'placement' && (
          <motion.div key="placement" initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }}
            className="w-full max-w-lg bg-white dark:bg-slate-800 rounded-2xl shadow-2xl p-8"
          >
            <div className="mb-6">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-gray-500">Question {current + 1} of {placementQuestions.length}</span>
                <span className="cefr-badge cefr-{placementQuestions[current].level.toLowerCase()}">{placementQuestions[current].level}</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-slate-700 rounded-full h-2 mb-6">
                <div className="bg-primary-600 h-2 rounded-full transition-all" style={{ width: `${(current / placementQuestions.length) * 100}%` }} />
              </div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">{placementQuestions[current].question}</h2>
              <div className="space-y-3">
                {placementQuestions[current].options.map((opt, i) => (
                  <button
                    key={i}
                    onClick={() => handleAnswer(i)}
                    className="w-full text-left px-5 py-4 rounded-xl border-2 border-gray-200 dark:border-slate-600 hover:border-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-all font-medium text-gray-700 dark:text-gray-300"
                  >
                    <span className="text-primary-600 font-bold mr-2">{String.fromCharCode(65 + i)}.</span>
                    {opt}
                  </button>
                ))}
              </div>
            </div>
            <p className="text-xs text-gray-400 text-center">This test determines your starting CEFR level</p>
          </motion.div>
        )}

        {step === 'plan' && (
          <motion.div key="plan" initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }}
            className="w-full max-w-2xl bg-white dark:bg-slate-800 rounded-2xl shadow-2xl p-8"
          >
            <div className="text-center mb-8">
              <div className="text-5xl mb-3">🎉</div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Your level is <span className="text-primary-600">{cefrLevel}</span></h2>
              <p className="text-gray-500 dark:text-gray-400 mt-2">Choose a plan to start learning</p>
            </div>
            <div className="grid md:grid-cols-3 gap-4">
              {[
                { plan: 'free', label: 'Free', price: '$0/mo', features: ['10 words/day', 'Basic progress'] },
                { plan: 'pro', label: 'Pro', price: '$9.99/mo', features: ['Unlimited words', 'AI speaking', 'Writing feedback'] },
                { plan: 'annual', label: 'Annual', price: '$79/yr', features: ['Everything in Pro', '34% savings'] },
              ].map(({ plan, label, price, features }) => (
                <button
                  key={plan}
                  onClick={() => handlePlan(plan)}
                  className={`p-5 rounded-xl border-2 text-left transition-all hover:scale-105 ${
                    plan === defaultPlan || (defaultPlan !== 'pro' && defaultPlan !== 'annual' && plan === 'pro')
                      ? 'border-primary-600 bg-primary-50 dark:bg-primary-900/20'
                      : 'border-gray-200 dark:border-slate-600 hover:border-primary-400'
                  }`}
                >
                  <p className="font-bold text-gray-900 dark:text-white">{label}</p>
                  <p className="text-primary-600 font-semibold text-lg">{price}</p>
                  <ul className="mt-3 space-y-1">
                    {features.map((f) => <li key={f} className="text-xs text-gray-600 dark:text-gray-400">✓ {f}</li>)}
                  </ul>
                </button>
              ))}
            </div>
          </motion.div>
        )}

        {step === 'done' && (
          <motion.div key="done" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
            className="text-center text-white"
          >
            <div className="text-7xl mb-4">✅</div>
            <h2 className="text-3xl font-bold">You're all set!</h2>
            <p className="text-primary-200 mt-2">Redirecting to your dashboard...</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useStore } from '../store/useStore'
import { api } from '../lib/api'

const plans = [
  {
    id: 'free',
    name: 'Free',
    price: '$0',
    period: '/month',
    features: ['10 vocabulary words/day', 'Basic progress tracking', 'Reading practice', 'Comprehension quizzes', 'Limited vocabulary access'],
    missing: ['AI speaking practice', 'Writing feedback', 'Listening exercises', 'Streak shields', 'Leaderboard'],
    cta: 'Get Started Free',
  },
  {
    id: 'pro',
    name: 'Pro',
    price: '$9.99',
    period: '/month',
    highlight: true,
    priceId: import.meta.env.VITE_STRIPE_PRO_PRICE_ID,
    features: ['Unlimited vocabulary', 'AI speaking practice (Realtime)', 'Writing feedback (Claude AI)', 'All 5 skill modules', 'Spaced repetition system', 'Streak shields', 'Weekly leaderboard', 'Export vocabulary as PDF'],
    cta: 'Start Pro',
  },
  {
    id: 'annual',
    name: 'Annual',
    price: '$79',
    period: '/year',
    badge: 'Save 34%',
    priceId: import.meta.env.VITE_STRIPE_ANNUAL_PRICE_ID,
    features: ['Everything in Pro', '2 months free', 'Priority support', 'Early access to new features'],
    cta: 'Save 34%',
  },
]

export default function Pricing() {
  const { user, profile } = useStore()
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null)
  const [errorMsg, setErrorMsg] = useState('')

  const handleCheckout = async (plan: string) => {
    if (!user) { window.location.href = '/signup?plan=' + plan; return }
    setLoadingPlan(plan)
    setErrorMsg('')
    try {
      const { url } = await api.createCheckoutSession(plan, user.id)
      if (url) window.location.href = url
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Payment unavailable'
      setErrorMsg(msg)
    } finally {
      setLoadingPlan(null)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 py-20 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-14">
          <h1 className="text-4xl font-extrabold text-gray-900 dark:text-white mb-4">Choose Your Plan</h1>
          <p className="text-gray-600 dark:text-gray-400 text-lg">Start free. Upgrade when you're ready for AI-powered learning.</p>
        </div>

        {errorMsg && (
          <div className="mb-8 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl text-center">
            <p className="text-red-600 dark:text-red-400 font-semibold text-sm">⚠️ Payment error: {errorMsg}</p>
            <p className="text-red-500 text-xs mt-1">Make sure Stripe API keys are configured in your backend .env file.</p>
          </div>
        )}

        <div className="grid md:grid-cols-3 gap-8 items-start">
          {plans.map((plan) => (
            <motion.div key={plan.id} whileHover={{ y: -4 }}
              className={`card relative ${plan.highlight ? 'border-2 border-primary-600 shadow-xl scale-105' : ''}`}
            >
              {plan.highlight && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-primary-600 text-white text-xs font-bold px-5 py-1.5 rounded-full">
                  MOST POPULAR
                </div>
              )}
              {plan.badge && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-accent-500 text-white text-xs font-bold px-5 py-1.5 rounded-full">
                  {plan.badge}
                </div>
              )}
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{plan.name}</h2>
              <div className="flex items-end gap-1 my-4">
                <span className="text-4xl font-extrabold text-gray-900 dark:text-white">{plan.price}</span>
                <span className="text-gray-500 mb-1">{plan.period}</span>
              </div>

              <div className="space-y-2 mb-6">
                {plan.features.map((f) => (
                  <div key={f} className="flex gap-2 text-sm text-gray-700 dark:text-gray-300">
                    <span className="text-accent-500 mt-0.5">✓</span> {f}
                  </div>
                ))}
                {plan.missing?.map((f) => (
                  <div key={f} className="flex gap-2 text-sm text-gray-400">
                    <span className="mt-0.5">✗</span> {f}
                  </div>
                ))}
              </div>

              {plan.id === 'free' ? (
                <Link to={user ? '/dashboard' : '/signup'} className={`block text-center py-3 px-6 rounded-xl font-semibold border-2 border-gray-200 text-gray-600 hover:bg-gray-100 transition-all`}>
                  {user ? 'Your Current Plan' : plan.cta}
                </Link>
              ) : (
                <button
                  onClick={() => handleCheckout(plan.id)}
                  disabled={loadingPlan === plan.id}
                  className={`w-full py-3 px-6 rounded-xl font-semibold transition-all disabled:opacity-60 ${plan.highlight ? 'bg-primary-600 hover:bg-primary-700 text-white shadow-md' : 'border-2 border-primary-600 text-primary-600 hover:bg-primary-600 hover:text-white'}`}
                >
                  {loadingPlan === plan.id ? 'Redirecting...' : profile?.subscription_plan === plan.id ? 'Current Plan' : plan.cta}
                </button>
              )}
            </motion.div>
          ))}
        </div>

        <div className="text-center mt-12 text-gray-500 text-sm">
          <p>All plans include secure payment via Stripe. Cancel anytime.</p>
          <p className="mt-1">Questions? Contact us at <a href="mailto:hello@englify.app" className="text-primary-600 hover:underline">hello@englify.app</a></p>
        </div>
      </div>
    </div>
  )
}

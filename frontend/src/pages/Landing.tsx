import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'

const features = [
  { icon: '📚', title: 'Smart Vocabulary', desc: 'Oxford 3000/5000 words with spaced repetition — learn at your exact CEFR level.' },
  { icon: '🎙️', title: 'AI Speaking Partner', desc: 'Real-time voice conversations with an AI tutor powered by OpenAI Realtime API.' },
  { icon: '✍️', title: 'Writing Feedback', desc: 'Submit essays and get detailed AI feedback on grammar, vocabulary, and structure.' },
  { icon: '📖', title: 'Leveled Reading', desc: 'AI-generated articles at your level. Tap any word for instant definitions.' },
  { icon: '🎧', title: 'Listening Practice', desc: 'Audio dialogues with fill-in-the-blank and dictation exercises.' },
  { icon: '📊', title: 'Progress Tracking', desc: 'Streaks, XP, skill radar charts, and CEFR level advancement.' },
]

const plans = [
  {
    name: 'Free',
    price: '$0',
    period: '/month',
    color: 'border-gray-200',
    features: ['10 words per day', 'Basic progress tracking', 'Reading practice', 'Limited vocabulary'],
    cta: 'Get Started Free',
    link: '/signup',
    highlight: false,
  },
  {
    name: 'Pro',
    price: '$9.99',
    period: '/month',
    color: 'border-primary-600',
    features: ['Unlimited vocabulary', 'AI speaking sessions', 'Writing feedback', 'All 5 practice modes', 'Streak shields', 'Leaderboard'],
    cta: 'Start Pro',
    link: '/signup?plan=pro',
    highlight: true,
  },
  {
    name: 'Annual',
    price: '$79',
    period: '/year',
    color: 'border-accent-500',
    features: ['Everything in Pro', '34% savings', 'Priority support', 'Early access features'],
    cta: 'Save 34%',
    link: '/signup?plan=annual',
    highlight: false,
  },
]

const testimonials = [
  { name: 'Ayşe K.', level: 'B1 → B2', text: 'I went from B1 to B2 in 3 months. The speaking practice is incredible — talking to an AI removed my fear of making mistakes!' },
  { name: 'Mehmet D.', level: 'A2 → B1', text: 'The spaced repetition system is genius. Words I struggled with just stuck after a few review sessions.' },
  { name: 'Zeynep A.', level: 'B2 → C1', text: 'The writing feedback from Claude AI is detailed and actionable. My IELTS writing score improved by 1.5 bands.' },
]

export default function Landing() {
  return (
    <div className="min-h-screen bg-white dark:bg-slate-900">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-gray-100 dark:border-slate-800">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🎓</span>
            <span className="font-bold text-xl text-primary-600">Englify</span>
          </div>
          <div className="hidden md:flex items-center gap-6 text-gray-600 dark:text-gray-300 text-sm font-medium">
            <a href="#features" className="hover:text-primary-600 transition-colors">Features</a>
            <a href="#pricing" className="hover:text-primary-600 transition-colors">Pricing</a>
            <a href="#testimonials" className="hover:text-primary-600 transition-colors">Reviews</a>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/login" className="text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-primary-600 transition-colors">Sign In</Link>
            <Link to="/signup" className="btn-primary text-sm py-2 px-4">Get Started Free</Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-24 pb-20 px-4 bg-gradient-to-br from-primary-600 via-primary-700 to-primary-800 text-white">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <span className="inline-block bg-accent-500 text-white text-sm font-semibold px-4 py-1.5 rounded-full mb-6">
              🚀 AI-Powered English Learning
            </span>
            <h1 className="text-5xl md:text-6xl font-extrabold leading-tight mb-6">
              Master English with<br />
              <span className="text-accent-400">AI by Your Side</span>
            </h1>
            <p className="text-xl text-primary-200 mb-10 max-w-2xl mx-auto">
              From A1 to C2 — personalized vocabulary, real-time AI speaking practice, and expert writing feedback. Built for Turkish learners and beyond.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/signup" className="bg-accent-500 hover:bg-accent-600 text-white font-bold px-8 py-4 rounded-xl text-lg transition-all shadow-xl hover:shadow-2xl active:scale-95">
                Start Learning Free →
              </Link>
              <a href="#features" className="bg-white/10 hover:bg-white/20 text-white font-semibold px-8 py-4 rounded-xl text-lg transition-all border border-white/30">
                See How It Works
              </a>
            </div>
            <p className="mt-4 text-primary-300 text-sm">No credit card required • Free forever plan available</p>
          </motion.div>
        </div>
      </section>

      {/* Stats */}
      <section className="bg-primary-800 py-10 px-4">
        <div className="max-w-4xl mx-auto grid grid-cols-3 gap-8 text-center text-white">
          {[['5,000+', 'Oxford Words'], ['6', 'CEFR Levels'], ['AI-Powered', 'All 5 Skills']].map(([val, label]) => (
            <div key={label}>
              <div className="text-3xl font-extrabold text-accent-400">{val}</div>
              <div className="text-primary-200 text-sm mt-1">{label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 px-4 bg-gray-50 dark:bg-slate-900">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 dark:text-white mb-4">Everything You Need to Succeed</h2>
            <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">A complete learning system covering all five English skills — personalized to your level.</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f) => (
              <motion.div
                key={f.title}
                whileHover={{ y: -4 }}
                className="card hover:shadow-lg transition-all"
              >
                <div className="text-4xl mb-4">{f.icon}</div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">{f.title}</h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 px-4 bg-white dark:bg-slate-800">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 dark:text-white mb-4">Get Started in 3 Steps</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { step: '01', title: 'Take Placement Test', desc: '20 questions to find your exact CEFR level (A1–C2) in 5 minutes.' },
              { step: '02', title: 'Learn Every Day', desc: 'Work through vocabulary, speaking, writing, reading, and listening at your pace.' },
              { step: '03', title: 'Track Your Progress', desc: 'Watch your level advance with streaks, badges, and skill charts.' },
            ].map((s) => (
              <div key={s.step} className="text-center">
                <div className="w-16 h-16 rounded-2xl bg-primary-600 text-white text-2xl font-extrabold flex items-center justify-center mx-auto mb-4">{s.step}</div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">{s.title}</h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="py-20 px-4 bg-gray-50 dark:bg-slate-900">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 dark:text-white mb-4">Learners Love Englify</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((t) => (
              <div key={t.name} className="card">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-primary-600 text-white font-bold flex items-center justify-center">{t.name[0]}</div>
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white text-sm">{t.name}</p>
                    <p className="text-accent-500 text-xs font-medium">{t.level}</p>
                  </div>
                </div>
                <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">"{t.text}"</p>
                <div className="mt-3 text-yellow-400 text-sm">★★★★★</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-20 px-4 bg-white dark:bg-slate-800">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 dark:text-white mb-4">Simple, Transparent Pricing</h2>
            <p className="text-gray-600 dark:text-gray-400">Start free. Upgrade when you're ready.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {plans.map((plan) => (
              <div
                key={plan.name}
                className={`card border-2 ${plan.color} ${plan.highlight ? 'shadow-xl scale-105' : ''} relative`}
              >
                {plan.highlight && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-primary-600 text-white text-xs font-bold px-4 py-1 rounded-full">
                    MOST POPULAR
                  </div>
                )}
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1">{plan.name}</h3>
                <div className="flex items-end gap-1 mb-6">
                  <span className="text-4xl font-extrabold text-gray-900 dark:text-white">{plan.price}</span>
                  <span className="text-gray-500 mb-1">{plan.period}</span>
                </div>
                <ul className="space-y-3 mb-8">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                      <span className="text-accent-500">✓</span> {f}
                    </li>
                  ))}
                </ul>
                <Link
                  to={plan.link}
                  className={`block text-center py-3 px-6 rounded-xl font-semibold transition-all ${
                    plan.highlight
                      ? 'bg-primary-600 hover:bg-primary-700 text-white shadow-md'
                      : 'border-2 border-primary-600 text-primary-600 hover:bg-primary-600 hover:text-white'
                  }`}
                >
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4 bg-gradient-to-r from-primary-600 to-primary-800 text-white">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-extrabold mb-4">Ready to Transform Your English?</h2>
          <p className="text-primary-200 text-lg mb-8">Join thousands of learners who are advancing their CEFR level with AI.</p>
          <Link to="/signup" className="inline-block bg-accent-500 hover:bg-accent-600 text-white font-bold px-10 py-4 rounded-xl text-lg transition-all shadow-xl hover:shadow-2xl active:scale-95">
            Start Free Today →
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-10 px-4">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="text-xl">🎓</span>
            <span className="font-bold text-white">Englify</span>
          </div>
          <p className="text-sm">© 2025 Englify. AI-powered English learning for Turkish speakers and beyond.</p>
          <div className="flex gap-6 text-sm">
            <Link to="/pricing" className="hover:text-white transition-colors">Pricing</Link>
            <a href="#" className="hover:text-white transition-colors">Privacy</a>
            <a href="#" className="hover:text-white transition-colors">Terms</a>
          </div>
        </div>
      </footer>
    </div>
  )
}

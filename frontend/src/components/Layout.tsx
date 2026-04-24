import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useStore } from '../store/useStore'
import { supabase } from '../lib/supabase'

const navItems = [
  { path: '/dashboard', label: 'Dashboard', icon: '📊' },
  { path: '/vocabulary', label: 'Vocabulary', icon: '📚' },
  { path: '/speaking', label: 'Speaking', icon: '🎙️' },
  { path: '/writing', label: 'Writing', icon: '✍️' },
  { path: '/reading', label: 'Reading', icon: '📖' },
  { path: '/books', label: 'My Books', icon: '📚' },
  { path: '/listening', label: 'Listening', icon: '🎧' },
  { path: '/grammar', label: 'Grammar', icon: '📝' },
  { path: '/progress', label: 'Progress', icon: '📈' },
]

export default function Layout({ children }: { children: React.ReactNode }) {
  const location = useLocation()
  const navigate = useNavigate()
  const { profile, darkMode, toggleDarkMode, setUser, setSession, setProfile } = useStore()
  const [mobileOpen, setMobileOpen] = useState(false)

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    setUser(null)
    setSession(null)
    setProfile(null)
    navigate('/')
  }

  return (
    <div className={`min-h-screen bg-gray-50 dark:bg-slate-900 flex`}>
      {/* Sidebar desktop */}
      <aside className="hidden lg:flex flex-col w-64 bg-white dark:bg-slate-800 border-r border-gray-100 dark:border-slate-700 fixed inset-y-0">
        <div className="p-6 border-b border-gray-100 dark:border-slate-700">
          <Link to="/dashboard" className="flex items-center gap-2">
            <span className="text-2xl">🎓</span>
            <span className="font-bold text-xl text-primary-600 dark:text-primary-400">Englify</span>
          </Link>
        </div>
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const active = location.pathname.startsWith(item.path)
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all ${
                  active
                    ? 'bg-primary-600 text-white shadow-md'
                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700'
                }`}
              >
                <span className="text-lg">{item.icon}</span>
                {item.label}
              </Link>
            )
          })}
        </nav>
        <div className="p-4 border-t border-gray-100 dark:border-slate-700 space-y-2">
          <Link
            to="/achievements"
            className="flex items-center gap-3 px-4 py-2 rounded-xl text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 transition-all"
          >
            <span>🏆</span> Achievements
          </Link>
          <Link
            to="/settings"
            className="flex items-center gap-3 px-4 py-2 rounded-xl text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 transition-all"
          >
            <span>⚙️</span> Settings
          </Link>
          <button
            onClick={toggleDarkMode}
            className="w-full flex items-center gap-3 px-4 py-2 rounded-xl text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 transition-all"
          >
            <span>{darkMode ? '☀️' : '🌙'}</span>
            {darkMode ? 'Light Mode' : 'Dark Mode'}
          </button>
          {profile && (
            <div className="flex items-center gap-3 px-4 py-2">
              <div className="w-8 h-8 rounded-full bg-primary-600 flex items-center justify-center text-white font-bold text-sm">
                {profile.name?.[0]?.toUpperCase() || 'U'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{profile.name}</p>
                <p className="text-xs text-gray-500 capitalize">{profile.cefr_level} • {profile.subscription_plan}</p>
              </div>
              <button onClick={handleSignOut} className="text-gray-400 hover:text-red-500 transition-colors" title="Sign out">
                ↩
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* Mobile header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-white dark:bg-slate-800 border-b border-gray-100 dark:border-slate-700 px-4 py-3 flex items-center justify-between">
        <Link to="/dashboard" className="flex items-center gap-2">
          <span className="text-xl">🎓</span>
          <span className="font-bold text-lg text-primary-600 dark:text-primary-400">Englify</span>
        </Link>
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="w-9 h-9 flex items-center justify-center rounded-xl bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-200 text-lg font-bold"
          aria-label="Toggle menu"
        >
          {mobileOpen ? '✕' : '☰'}
        </button>
      </div>

      {/* Mobile drawer backdrop */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="lg:hidden fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Mobile drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 280 }}
            className="lg:hidden fixed top-0 left-0 bottom-0 z-50 w-72 bg-white dark:bg-slate-800 shadow-2xl flex flex-col"
          >
            {/* Drawer header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-slate-700">
              <Link to="/dashboard" onClick={() => setMobileOpen(false)} className="flex items-center gap-2">
                <span className="text-2xl">🎓</span>
                <span className="font-bold text-xl text-primary-600 dark:text-primary-400">Englify</span>
              </Link>
              <button
                onClick={() => setMobileOpen(false)}
                className="w-8 h-8 flex items-center justify-center rounded-lg bg-gray-100 dark:bg-slate-700 text-gray-500 dark:text-gray-400 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            {/* Nav links */}
            <nav className="flex-1 overflow-y-auto p-4 space-y-1">
              {navItems.map((item) => {
                const active = location.pathname.startsWith(item.path)
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setMobileOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all ${
                      active
                        ? 'bg-primary-600 text-white shadow-md'
                        : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700'
                    }`}
                  >
                    <span className="text-lg">{item.icon}</span>
                    {item.label}
                  </Link>
                )
              })}
            </nav>

            {/* Drawer footer */}
            <div className="p-4 border-t border-gray-100 dark:border-slate-700 space-y-1">
              <Link to="/achievements" onClick={() => setMobileOpen(false)}
                className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 transition-all">
                <span>🏆</span> Achievements
              </Link>
              <Link to="/settings" onClick={() => setMobileOpen(false)}
                className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 transition-all">
                <span>⚙️</span> Settings
              </Link>
              <button onClick={toggleDarkMode}
                className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 transition-all">
                <span>{darkMode ? '☀️' : '🌙'}</span>
                {darkMode ? 'Light Mode' : 'Dark Mode'}
              </button>
              {profile && (
                <div className="flex items-center gap-3 px-4 py-2.5">
                  <div className="w-8 h-8 rounded-full bg-primary-600 flex items-center justify-center text-white font-bold text-sm shrink-0">
                    {profile.name?.[0]?.toUpperCase() || 'U'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{profile.name}</p>
                    <p className="text-xs text-gray-500 capitalize">{profile.cefr_level} · {profile.subscription_plan}</p>
                  </div>
                  <button onClick={handleSignOut} className="text-gray-400 hover:text-red-500 transition-colors text-lg" title="Sign out">↩</button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main content */}
      <main className="lg:ml-64 flex-1 pt-16 lg:pt-0 min-h-screen">
        <div className="p-4 lg:p-8 max-w-6xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  )
}

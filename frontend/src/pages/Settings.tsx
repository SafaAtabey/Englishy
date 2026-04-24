import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useStore } from '../store/useStore'
import { supabase } from '../lib/supabase'
import { api } from '../lib/api'

export default function Settings() {
  const navigate = useNavigate()
  const { profile, setProfile, setUser, setSession, darkMode, toggleDarkMode, language, setLanguage } = useStore()
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [name, setName] = useState(profile?.name || '')
  const [dailyGoal, setDailyGoal] = useState(profile?.daily_goal || 10)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleteInput, setDeleteInput] = useState('')
  const [deleting, setDeleting] = useState(false)

  const saveProfile = async () => {
    if (!profile) return
    setSaving(true)
    await supabase.from('users').update({ name, daily_goal: dailyGoal }).eq('id', profile.id)
    setProfile({ ...profile, name, daily_goal: dailyGoal })
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const manageSubscription = async () => {
    if (!profile?.stripe_customer_id) return
    try {
      const { url } = await api.createPortalSession(profile.stripe_customer_id)
      window.location.href = url
    } catch {
      alert('Could not open billing portal. Please contact support.')
    }
  }

  const handleDeleteAccount = async () => {
    if (!profile || deleteInput !== 'DELETE') return
    setDeleting(true)
    try {
      // Delete user data first
      await supabase.from('user_words').delete().eq('user_id', profile.id)
      await supabase.from('books').delete().eq('user_id', profile.id)
      await supabase.from('users').delete().eq('id', profile.id)
      // Sign out
      await supabase.auth.signOut()
      setUser(null)
      setSession(null)
      setProfile(null)
      navigate('/')
    } catch {
      alert('Failed to delete account. Please contact support.')
    } finally {
      setDeleting(false)
    }
  }

  if (!profile) return null

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">⚙️ Settings</h1>

      {/* Profile */}
      <div className="card space-y-4">
        <h2 className="font-bold text-gray-900 dark:text-white">Profile</h2>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Name</label>
          <input className="input-field" value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Email</label>
          <input className="input-field" value={profile.email} disabled />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">English Level</label>
          <div className="flex items-center justify-between p-3.5 bg-gray-50 dark:bg-slate-700/50 rounded-2xl border border-gray-200 dark:border-slate-600">
            <div className="flex items-center gap-3">
              <span className={`cefr-badge cefr-${profile.cefr_level.toLowerCase()} text-base px-3 py-1`}>{profile.cefr_level}</span>
              <span className="text-sm text-gray-500 dark:text-gray-400">Determined by placement test</span>
            </div>
            <Link
              to="/placement-test"
              className="text-sm font-semibold text-primary-600 dark:text-primary-400 hover:underline whitespace-nowrap"
            >
              Retake Test →
            </Link>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Daily Goal</label>
          <select className="input-field" value={dailyGoal} onChange={(e) => setDailyGoal(Number(e.target.value))}>
            <option value={5}>5 words/day</option>
            <option value={10}>10 words/day</option>
            <option value={20}>20 words/day</option>
            <option value={50}>50 words/day</option>
          </select>
        </div>
        <button onClick={saveProfile} disabled={saving} className="btn-primary w-full">
          {saving ? 'Saving...' : saved ? '✅ Saved!' : 'Save Changes'}
        </button>
      </div>

      {/* Appearance */}
      <div className="card space-y-4">
        <h2 className="font-bold text-gray-900 dark:text-white">Appearance</h2>
        <div className="flex items-center justify-between">
          <span className="text-gray-700 dark:text-gray-300">Dark Mode</span>
          <button
            onClick={toggleDarkMode}
            className={`relative w-12 h-6 rounded-full transition-all ${darkMode ? 'bg-primary-600' : 'bg-gray-300'}`}
          >
            <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${darkMode ? 'translate-x-6' : ''}`} />
          </button>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-gray-700 dark:text-gray-300">Interface Language</span>
          <select className="input-field w-auto" value={language} onChange={(e) => setLanguage(e.target.value as 'en' | 'tr')}>
            <option value="en">English</option>
            <option value="tr">Türkçe</option>
          </select>
        </div>
      </div>

      {/* Subscription */}
      <div className="card space-y-4">
        <h2 className="font-bold text-gray-900 dark:text-white">Subscription</h2>
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium text-gray-800 dark:text-gray-200 capitalize">{profile.subscription_plan} Plan</p>
            <p className="text-sm text-gray-500">
              {profile.subscription_plan === 'free' ? '10 words/day · Basic features' : 'Unlimited access to all features'}
            </p>
          </div>
          <span className={`px-3 py-1 rounded-full text-xs font-bold ${profile.subscription_plan === 'free' ? 'bg-gray-100 text-gray-600' : 'bg-accent-100 text-accent-700'}`}>
            {profile.subscription_plan.toUpperCase()}
          </span>
        </div>
        {profile.subscription_plan === 'free' ? (
          <a href="/pricing" className="btn-primary block text-center">Upgrade to Pro →</a>
        ) : (
          <button onClick={manageSubscription} className="btn-outline w-full">Manage Subscription</button>
        )}
      </div>

      {/* Danger zone */}
      <div className="card border-red-200 dark:border-red-900 space-y-4">
        <h2 className="font-bold text-red-600 dark:text-red-400">Danger Zone</h2>
        {!showDeleteConfirm ? (
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="w-full py-3 rounded-xl border-2 border-red-200 dark:border-red-800 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all font-medium text-sm"
          >
            Delete Account
          </button>
        ) : (
          <div className="space-y-3 p-4 bg-red-50 dark:bg-red-900/20 rounded-xl">
            <p className="text-sm font-semibold text-red-700 dark:text-red-400">This will permanently delete your account and all data.</p>
            <p className="text-sm text-red-600 dark:text-red-400">Type <strong>DELETE</strong> to confirm:</p>
            <input
              className="input-field border-red-300 dark:border-red-700"
              placeholder="DELETE"
              value={deleteInput}
              onChange={(e) => setDeleteInput(e.target.value)}
            />
            <div className="flex gap-3">
              <button
                onClick={() => { setShowDeleteConfirm(false); setDeleteInput('') }}
                className="flex-1 py-2.5 rounded-xl border-2 border-gray-200 dark:border-slate-600 text-gray-600 dark:text-gray-300 font-medium text-sm hover:bg-gray-50 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={deleteInput !== 'DELETE' || deleting}
                className="flex-1 py-2.5 rounded-xl bg-red-600 text-white font-medium text-sm disabled:opacity-40 hover:bg-red-700 transition-all"
              >
                {deleting ? 'Deleting...' : 'Delete Forever'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

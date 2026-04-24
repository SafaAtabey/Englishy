import { motion, AnimatePresence } from 'framer-motion'
import { Link } from 'react-router-dom'

interface Props {
  open: boolean
  onClose: () => void
  feature?: string
}

export default function UpgradeModal({ open, onClose, feature }: Props) {
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
          >
            <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl p-8 max-w-sm w-full pointer-events-auto text-center space-y-5">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center text-3xl shadow-lg">
                ⭐
              </div>
              <div>
                <h2 className="text-2xl font-extrabold text-gray-900 dark:text-white">Pro Feature</h2>
                <p className="text-gray-500 dark:text-gray-400 mt-2 text-sm">
                  {feature || 'This feature'} is available on the Pro plan. Upgrade to unlock unlimited AI-powered learning.
                </p>
              </div>
              <div className="space-y-3">
                {[
                  '🎙 AI Speaking Practice',
                  '✍️ Writing Feedback',
                  '🎧 Listening Exercises',
                  '📚 PDF Book Reader',
                  '🔁 Unlimited Vocabulary',
                ].map(f => (
                  <div key={f} className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                    <span className="text-emerald-500">✓</span>{f}
                  </div>
                ))}
              </div>
              <div className="flex gap-3">
                <button onClick={onClose} className="flex-1 btn-outline py-3">Maybe Later</button>
                <Link to="/pricing" className="flex-1 btn-primary py-3 text-center" onClick={onClose}>
                  Upgrade →
                </Link>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

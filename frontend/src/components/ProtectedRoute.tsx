import { Navigate } from 'react-router-dom'
import { useStore } from '../store/useStore'

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, initializing } = useStore()
  if (initializing) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-900">
      <div className="w-10 h-10 border-4 border-primary-600 border-t-transparent rounded-full animate-spin" />
    </div>
  )
  if (!user) return <Navigate to="/login" replace />
  return <>{children}</>
}

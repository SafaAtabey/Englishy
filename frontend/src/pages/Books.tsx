import { useState, useRef } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useStore } from '../store/useStore'
import { api, ProRequiredError } from '../lib/api'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import UpgradeModal from '../components/UpgradeModal'
import type { Book } from '../types'

export default function Books() {
  const { profile } = useStore()
  const queryClient = useQueryClient()
  const fileRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState('')
  const [showUpgrade, setShowUpgrade] = useState(false)

  const { data, isLoading } = useQuery({
    queryKey: ['books', profile?.id],
    queryFn: () => api.getBooks(profile!.id),
    enabled: !!profile?.id,
    throwOnError: (e) => { if (e instanceof ProRequiredError) { setShowUpgrade(true); return false } return true },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.deleteBook(id, profile!.id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['books'] }),
  })

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !profile) return
    setUploadError('')
    setUploading(true)

    try {
      const form = new FormData()
      form.append('pdf', file)
      form.append('user_id', profile.id)
      form.append('title', file.name.replace('.pdf', ''))

      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/books/upload?user_id=${profile.id}`, {
        method: 'POST',
        body: form,
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Upload failed')
      }
      await queryClient.invalidateQueries({ queryKey: ['books'] })
    } catch (err: unknown) {
      setUploadError(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setUploading(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  const books: Book[] = data?.books || []

  return (
    <div className="max-w-4xl mx-auto">
      <UpgradeModal open={showUpgrade} onClose={() => setShowUpgrade(false)} feature="PDF Books" />
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white">📚 My Books</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Upload PDFs and read with interactive word translations</p>
        </div>
        <button
          onClick={() => profile?.subscription_plan === 'free' ? setShowUpgrade(true) : fileRef.current?.click()}
          disabled={uploading}
          className="flex items-center gap-2 px-5 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-semibold shadow-md transition-all active:scale-95 disabled:opacity-60"
        >
          {uploading ? (
            <>
              <span className="animate-spin">⏳</span> Uploading...
            </>
          ) : (
            <>
              <span>📤</span> Upload PDF
            </>
          )}
        </button>
        <input
          ref={fileRef}
          type="file"
          accept=".pdf,application/pdf"
          className="hidden"
          onChange={handleFileChange}
        />
      </div>

      {uploadError && (
        <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-red-700 dark:text-red-400">
          {uploadError}
        </div>
      )}

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-40 bg-gray-100 dark:bg-slate-700 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : books.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-20"
        >
          <div className="text-6xl mb-4">📖</div>
          <h2 className="text-xl font-bold text-gray-700 dark:text-gray-300 mb-2">No books yet</h2>
          <p className="text-gray-500 dark:text-gray-400 mb-6">Upload a PDF to start reading with word-by-word Turkish translations</p>
          <button
            onClick={() => fileRef.current?.click()}
            className="px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-semibold"
          >
            Upload your first book
          </button>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {books.map((book, i) => (
            <motion.div
              key={book.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="relative bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow overflow-hidden"
            >
              {/* Book spine decoration */}
              <div className="absolute left-0 top-0 bottom-0 w-2 bg-gradient-to-b from-primary-500 to-primary-700 rounded-l-2xl" />

              <div className="pl-6 pr-4 py-4">
                <Link to={`/books/${book.id}`} className="block group">
                  <h3 className="font-bold text-gray-900 dark:text-white text-base leading-tight mb-2 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors line-clamp-2">
                    {book.title}
                  </h3>
                </Link>
                <div className="flex flex-wrap gap-2 text-xs text-gray-500 dark:text-gray-400 mb-4">
                  <span className="flex items-center gap-1">
                    <span>📄</span> {book.page_count} pages
                  </span>
                  <span className="flex items-center gap-1">
                    <span>📝</span> {book.total_words.toLocaleString()} words
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <Link
                    to={`/books/${book.id}`}
                    className="text-sm font-semibold text-primary-600 dark:text-primary-400 hover:underline"
                  >
                    Read now →
                  </Link>
                  <button
                    onClick={() => {
                      if (confirm('Delete this book?')) deleteMutation.mutate(book.id)
                    }}
                    className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-300 hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                    title="Delete"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}

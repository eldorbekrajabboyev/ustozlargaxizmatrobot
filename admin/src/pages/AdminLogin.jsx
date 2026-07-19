import { useState } from 'react'
import api from '../api/api'

export default function AdminLogin({ onLogin }) {
  const [key, setKey] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!key.trim()) return
    setLoading(true)
    setError('')
    try {
      localStorage.setItem('admin_api_key', key.trim())
      await api.get('/api/settings')
      onLogin()
    } catch (err) {
      localStorage.removeItem('admin_api_key')
      setError('Noto\'g\'ri admin kalit')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">📚 Metodikish</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-2">Admin Panel ga kirish</p>
        </div>
        <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Admin kalit</label>
            <input
              type="password"
              value={key}
              onChange={(e) => setKey(e.target.value)}
              placeholder="Kalitni kiriting..."
              autoFocus
              className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition"
            />
          </div>
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <button
            type="submit"
            disabled={loading || !key.trim()}
            className="w-full py-3 rounded-xl bg-primary-600 hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium transition"
          >
            {loading ? 'Tekshirilmoqda...' : 'Kirish'}
          </button>
        </form>
      </div>
    </div>
  )
}

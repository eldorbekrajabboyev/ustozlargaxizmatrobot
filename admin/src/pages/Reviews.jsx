import { useState, useEffect } from 'react'
import api from '../api/api'

const STATUS_LABELS = { pending: 'Kutilmoqda', published: 'Nashr etilgan', rejected: 'Rad etilgan' }
const STATUS_COLORS = {
  pending:   'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/50 dark:text-amber-300 dark:border-amber-700/50',
  published: 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/50 dark:text-emerald-300 dark:border-emerald-700/50',
  rejected:  'bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-900/50 dark:text-rose-300 dark:border-rose-700/50',
}

function Stars({ n }) {
  return (
    <span className="flex gap-0.5">
      {[1,2,3,4,5].map(i => (
        <span key={i} style={{ color: i<=n ? '#f59e0b' : '#d1d5db', fontSize: 16 }}>★</span>
      ))}
    </span>
  )
}

export default function Reviews() {
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('pending')
  const [actionLoading, setActionLoading] = useState(null)

  const load = async () => {
    setLoading(true)
    try {
      const res = await api.get('/api/admin/reviews')
      setReviews(res.data)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const setStatus = async (id, status) => {
    setActionLoading(id + status)
    try {
      await api.patch(`/api/admin/reviews/${id}`, { status })
      setReviews(prev => prev.map(r => r.id === id ? { ...r, status } : r))
    } catch (e) {
      alert('Xatolik: ' + (e.response?.data?.error || e.message))
    } finally {
      setActionLoading(null)
    }
  }

  const filtered = reviews.filter(r => r.status === filter)

  const counts = {
    pending:   reviews.filter(r => r.status === 'pending').length,
    published: reviews.filter(r => r.status === 'published').length,
    rejected:  reviews.filter(r => r.status === 'rejected').length,
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Sharhlar</h1>
          <p className="text-sm text-gray-500 mt-1 dark:text-gray-400">Foydalanuvchilarning xizmat haqidagi sharhlari</p>
        </div>
        <button onClick={load} className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium transition-colors dark:bg-gray-700/50 dark:hover:bg-gray-700 dark:text-gray-200">
          🔄 Yangilash
        </button>
      </div>

      {/* Stat tabs */}
      <div className="flex gap-3 mb-6">
        {[
          { key: 'pending',   label: 'Kutilmoqda', emoji: '⏳' },
          { key: 'published', label: 'Nashr etilgan', emoji: '✅' },
          { key: 'rejected',  label: 'Rad etilgan',  emoji: '❌' },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-semibold transition-all ${
              filter === tab.key
                ? 'bg-indigo-600 text-white border-indigo-600 shadow-md'
                : 'bg-white text-gray-600 border-gray-200 hover:border-indigo-300 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700 dark:hover:border-indigo-500'
            }`}
          >
            {tab.emoji} {tab.label}
            <span className={`text-xs px-1.5 py-0.5 rounded-full font-bold ${filter===tab.key?'bg-white/20 text-white':'bg-gray-100 text-gray-500 dark:bg-gray-700/50 dark:text-gray-400'}`}>
              {counts[tab.key]}
            </span>
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-indigo-500 border-t-transparent" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 text-gray-400 dark:text-gray-500">
          <p className="text-4xl mb-3">💬</p>
          <p className="font-medium">Bu bo'limda sharhlar yo'q</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map(r => (
            <div key={r.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 dark:bg-gray-800 dark:border-gray-700/50">
              {/* Header */}
              <div className="flex items-start justify-between gap-4 mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-lg dark:bg-indigo-900/50">
                    👩‍🏫
                  </div>
                  <div>
                    <p className="font-bold text-gray-900 dark:text-white">{r.author_name || r.first_name || 'Foydalanuvchi'}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      {r.region && <span className="text-xs text-gray-400 dark:text-gray-500">📍 {r.region}</span>}
                      <span className="text-xs text-gray-400 dark:text-gray-500">
                        #{r.order_code} · {r.username ? `@${r.username}` : `ID: ${r.user_id}`}
                      </span>
                    </div>
                  </div>
                </div>
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${STATUS_COLORS[r.status]}`}>
                  {STATUS_LABELS[r.status]}
                </span>
              </div>

              {/* Stars */}
              <div className="flex items-center gap-2 mb-3">
                <Stars n={r.stars} />
                <span className="text-sm font-semibold text-gray-600 dark:text-gray-300">{r.stars}/5</span>
              </div>

              {/* Text */}
              <blockquote className="text-sm text-gray-700 leading-relaxed bg-gray-50 rounded-xl p-3 border-l-4 border-indigo-200 dark:text-gray-200 dark:bg-gray-900/50 dark:border-indigo-700/50">
                "{r.text}"
              </blockquote>

              <p className="text-xs text-gray-400 mt-2 dark:text-gray-500">
                {new Date(r.created_at).toLocaleString('uz-UZ', { timeZone: 'Asia/Tashkent' })}
              </p>

              {/* Actions */}
              {r.status === 'pending' && (
                <div className="flex gap-2 mt-4">
                  <button
                    onClick={() => setStatus(r.id, 'published')}
                    disabled={actionLoading === r.id + 'published'}
                    className="flex-1 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-bold transition-colors disabled:opacity-60"
                  >
                    {actionLoading === r.id + 'published' ? '...' : '✅ Nashr etish'}
                  </button>
                  <button
                    onClick={() => setStatus(r.id, 'rejected')}
                    disabled={actionLoading === r.id + 'rejected'}
                    className="flex-1 py-2.5 rounded-xl bg-rose-100 hover:bg-rose-200 text-rose-700 text-sm font-bold transition-colors disabled:opacity-60 dark:bg-rose-900/50 dark:hover:bg-rose-900/70 dark:text-rose-300"
                  >
                    {actionLoading === r.id + 'rejected' ? '...' : '❌ Rad etish'}
                  </button>
                </div>
              )}
              {r.status === 'published' && (
                <button
                  onClick={() => setStatus(r.id, 'rejected')}
                  disabled={!!actionLoading}
                  className="mt-3 px-4 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 text-xs font-semibold transition-colors dark:bg-rose-900/30 dark:hover:bg-rose-900/50 dark:text-rose-400"
                >
                  Nashrdan olib tashlash
                </button>
              )}
              {r.status === 'rejected' && (
                <button
                  onClick={() => setStatus(r.id, 'published')}
                  disabled={!!actionLoading}
                  className="mt-3 px-4 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-600 text-xs font-semibold transition-colors dark:bg-emerald-900/30 dark:hover:bg-emerald-900/50 dark:text-emerald-400"
                >
                  Nashr etish
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

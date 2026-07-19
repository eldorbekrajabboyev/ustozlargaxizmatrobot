import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import api from '../api/api'

function getOrderDate(order) {
  if (order.status === 'pending_payment') return order.created_at
  if (order.status === 'pending_confirmation' || order.status === 'in_progress') return order.receipt_uploaded_at || order.created_at
  if (order.status === 'ready' || order.status === 'sent') return order.ready_at || order.receipt_uploaded_at || order.created_at
  return order.created_at
}

const statusColors = {
  pending_payment: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300',
  pending_confirmation: 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300',
  in_progress: 'bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-300',
  ready: 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300',
  sent: 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300',
  rejected: 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300',
}

const statusLabels = {
  pending_payment: "To'lov kutilmoqda",
  pending_confirmation: "Tekshirilmoqda",
  in_progress: 'Tayyorlanmoqda',
  ready: 'Tayyor',
  sent: 'Yuborildi',
  rejected: 'Rad etildi',
}

const statusFilters = [
  { value: '', label: 'Barchasi' },
  { value: 'pending_payment', label: "To'lov kutilmoqda" },
  { value: 'pending_confirmation', label: "Tekshirilmoqda" },
  { value: 'in_progress', label: 'Tayyorlanmoqda' },
  { value: 'ready', label: 'Tayyor' },
  { value: 'sent', label: 'Yuborilgan' },
]

function Orders() {
  const [orders, setOrders] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState('')
  const [search, setSearch] = useState('')
  const [regionFilter, setRegionFilter] = useState('')
  const [subjectFilter, setSubjectFilter] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [filterOptions, setFilterOptions] = useState({ regions: [], subjects: [] })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/api/filters').then(res => setFilterOptions(res.data)).catch(() => {})
  }, [])

  const fetchOrders = useCallback(() => {
    setLoading(true)
    const params = new URLSearchParams({ page, limit: 20 })
    if (statusFilter) params.append('status', statusFilter)
    if (search) params.append('search', search)
    if (regionFilter) params.append('region', regionFilter)
    if (subjectFilter) params.append('subject', subjectFilter)
    if (dateFrom) params.append('date_from', dateFrom)
    if (dateTo) params.append('date_to', dateTo)
    api.get(`/api/orders?${params}`)
      .then(res => {
        setOrders(res.data.orders)
        setTotal(res.data.total)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [page, statusFilter, search, regionFilter, subjectFilter, dateFrom, dateTo])

  useEffect(() => { fetchOrders() }, [fetchOrders])

  const resetFilters = () => {
    setSearch(''); setStatusFilter(''); setRegionFilter('')
    setSubjectFilter(''); setDateFrom(''); setDateTo(''); setPage(1)
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Buyurtmalar ({total})</h1>
      </div>

      {/* Search */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-4 dark:bg-gray-800 dark:border-gray-700/50">
        <div className="flex gap-3 items-end flex-wrap">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-xs font-medium text-gray-500 mb-1 dark:text-gray-400">Qidirish</label>
            <input
              type="text"
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1) }}
              placeholder="Ism, buyurtma raqami, username..."
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-200"
            />
          </div>
          <div className="min-w-[150px]">
            <label className="block text-xs font-medium text-gray-500 mb-1 dark:text-gray-400">Viloyat</label>
            <select value={regionFilter} onChange={e => { setRegionFilter(e.target.value); setPage(1) }}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-200">
              <option value="">Barchasi</option>
              {filterOptions.regions.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
          <div className="min-w-[150px]">
            <label className="block text-xs font-medium text-gray-500 mb-1 dark:text-gray-400">Fan</label>
            <select value={subjectFilter} onChange={e => { setSubjectFilter(e.target.value); setPage(1) }}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-200">
              <option value="">Barchasi</option>
              {filterOptions.subjects.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div className="min-w-[140px]">
            <label className="block text-xs font-medium text-gray-500 mb-1 dark:text-gray-400">Dan</label>
            <input type="date" value={dateFrom} onChange={e => { setDateFrom(e.target.value); setPage(1) }}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-200" />
          </div>
          <div className="min-w-[140px]">
            <label className="block text-xs font-medium text-gray-500 mb-1 dark:text-gray-400">Gacha</label>
            <input type="date" value={dateTo} onChange={e => { setDateTo(e.target.value); setPage(1) }}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-200" />
          </div>
          <button onClick={resetFilters}
            className="px-3 py-2 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-gray-700/50">
            Tozalash
          </button>
        </div>
      </div>

      {/* Status Filters */}
      <div className="flex gap-2 mb-4">
        {statusFilters.map(f => (
          <button
            key={f.value}
            onClick={() => { setStatusFilter(f.value); setPage(1) }}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              statusFilter === f.value
                ? 'bg-primary-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700/50 dark:text-gray-300 dark:hover:bg-gray-600'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden dark:bg-gray-800 dark:border-gray-700/50">
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500 mx-auto"></div>
          </div>
        ) : orders.length === 0 ? (
          <div className="p-8 text-center text-gray-500 dark:text-gray-400">Buyurtmalar topilmadi</div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100 dark:bg-gray-900 dark:border-gray-700/50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600 dark:text-gray-300">Raqam</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600 dark:text-gray-300">F.I.Sh</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600 dark:text-gray-300">Xizmat</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600 dark:text-gray-300">Fan</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600 dark:text-gray-300">Sinf</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600 dark:text-gray-300">Narx</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600 dark:text-gray-300">Holat</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600 dark:text-gray-300">Sana</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700/50">
              {orders.map(order => (
                <tr key={order.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                  <td className="px-4 py-3">
                    <Link to={`/orders/${order.id}`} className="font-mono text-sm text-primary-500 hover:underline">
                      {order.order_code}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-medium">{order.full_name}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">@{order.username || 'N/A'}</p>
                  </td>
                  <td className="px-4 py-3 text-sm">{order.service_name}</td>
                  <td className="px-4 py-3 text-sm">{order.subject}</td>
                  <td className="px-4 py-3 text-sm">{order.grade}</td>
                  <td className="px-4 py-3 text-sm font-semibold">{order.total_price.toLocaleString()} so'm</td>
                  <td className="px-4 py-3">
                    <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${statusColors[order.status]}`}>
                      {statusLabels[order.status]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                    {new Date(getOrderDate(order)).toLocaleString('uz-UZ', { timeZone: 'Asia/Tashkent' })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {total > 20 && (
        <div className="flex items-center justify-center gap-2 mt-4">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-4 py-2 bg-gray-100 rounded-lg text-sm disabled:opacity-50 dark:bg-gray-700/50 dark:text-gray-300"
          >
            ← Oldingi
          </button>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            Sahifa {page} / {Math.ceil(total / 20)}
          </span>
          <button
            onClick={() => setPage(p => p + 1)}
            disabled={page >= Math.ceil(total / 20)}
            className="px-4 py-2 bg-gray-100 rounded-lg text-sm disabled:opacity-50 dark:bg-gray-700/50 dark:text-gray-300"
          >
            Keyingi →
          </button>
        </div>
      )}
    </div>
  )
}

export default Orders

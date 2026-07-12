import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import axios from 'axios'

const statusColors = {
  pending_payment: 'bg-yellow-100 text-yellow-800',
  pending_confirmation: 'bg-blue-100 text-blue-800',
  in_progress: 'bg-purple-100 text-purple-800',
  ready: 'bg-green-100 text-green-800',
  sent: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
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
  const [loading, setLoading] = useState(true)

  const fetchOrders = () => {
    setLoading(true)
    const params = new URLSearchParams({ page, limit: 20 })
    if (statusFilter) params.append('status', statusFilter)
    axios.get(`/api/orders?${params}`)
      .then(res => {
        setOrders(res.data.orders)
        setTotal(res.data.total)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    fetchOrders()
  }, [page, statusFilter])

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Buyurtmalar ({total})</h1>
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-4">
        {statusFilters.map(f => (
          <button
            key={f.value}
            onClick={() => { setStatusFilter(f.value); setPage(1) }}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              statusFilter === f.value
                ? 'bg-primary-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500 mx-auto"></div>
          </div>
        ) : orders.length === 0 ? (
          <div className="p-8 text-center text-gray-500">Buyurtmalar topilmadi</div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Raqam</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">F.I.Sh</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Xizmat</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Fan</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Sinf</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Narx</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Holat</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Sana</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {orders.map(order => (
                <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <Link to={`/orders/${order.id}`} className="font-mono text-sm text-primary-500 hover:underline">
                      {order.order_code}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-medium">{order.full_name}</p>
                    <p className="text-sm text-gray-500">@{order.username || 'N/A'}</p>
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
                  <td className="px-4 py-3 text-sm text-gray-500">
                    {new Date(order.created_at).toLocaleDateString('uz-UZ')}
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
            className="px-4 py-2 bg-gray-100 rounded-lg text-sm disabled:opacity-50"
          >
            ← Oldingi
          </button>
          <span className="text-sm text-gray-500">
            Sahifa {page} / {Math.ceil(total / 20)}
          </span>
          <button
            onClick={() => setPage(p => p + 1)}
            disabled={page >= Math.ceil(total / 20)}
            className="px-4 py-2 bg-gray-100 rounded-lg text-sm disabled:opacity-50"
          >
            Keyingi →
          </button>
        </div>
      )}
    </div>
  )
}

export default Orders

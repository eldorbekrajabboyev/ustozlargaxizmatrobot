import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import Header from '../components/Header'

const statusMap = {
  pending_payment: { label: "To'lov kutilmoqda", bg: 'bg-amber-100 text-amber-700', icon: '💳' },
  pending_confirmation: { label: "Tekshirilmoqda", bg: 'bg-sky-100 text-sky-700', icon: '🔍' },
  in_progress: { label: 'Tayyorlanmoqda', bg: 'bg-violet-100 text-violet-700', icon: '📝' },
  ready: { label: 'Tayyor', bg: 'bg-emerald-100 text-emerald-700', icon: '✅' },
  sent: { label: 'Yuborildi', bg: 'bg-emerald-100 text-emerald-700', icon: '📤' },
  rejected: { label: 'Rad etildi', bg: 'bg-rose-100 text-rose-700', icon: '❌' },
}

function MyOrders({ user }) {
  const navigate = useNavigate()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) {
      setLoading(false)
      return
    }
    axios.get(`/api/user/orders/${user.id}`)
      .then(res => setOrders(res.data))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [user])

  if (loading) {
    return (
      <div className="animate-fade-in">
        <Header title="Buyurtmalarim" />
        <div className="p-4 flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary-500 border-t-transparent"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="animate-fade-in min-h-screen">
      <Header title="Buyurtmalarim" subtitle={orders.length ? `${orders.length} ta buyurtma` : ''} />

      <div className="p-4 space-y-3">
        {orders.map(order => {
          const status = statusMap[order.status] || { label: order.status, bg: 'bg-tg-hint/10 text-tg-hint', icon: '❓' }
          return (
            <button
              key={order.id}
              onClick={() => navigate(`/order-detail/${order.id}`)}
              className="w-full text-left bg-tg-secondary rounded-2xl p-4 shadow-card border border-tg-text/5 active:scale-[0.99] transition-transform"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-mono text-xs text-tg-hint">{order.order_code}</p>
                  <p className="font-semibold text-tg-text mt-0.5 truncate">{order.service_name}</p>
                  <p className="text-sm text-tg-hint mt-0.5">{order.subject} • {order.grade}-sinf</p>
                </div>
                <span className={`shrink-0 inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${status.bg}`}>
                  <span>{status.icon}</span> {status.label}
                </span>
              </div>
              <div className="flex items-center justify-between mt-3 pt-3 border-t border-tg-text/5">
                <p className="font-bold text-primary-600">{order.total_price.toLocaleString()} so'm</p>
                <p className="text-xs text-tg-hint">
                  {new Date(order.created_at).toLocaleDateString('uz-UZ', { timeZone: 'Asia/Tashkent' })}
                </p>
              </div>
            </button>
          )
        })}

        {orders.length === 0 && (
          <div className="text-center py-16 text-tg-hint">
            <p className="text-5xl mb-3">📦</p>
            <p className="mb-1">Sizda hali buyurtmalar mavjud emas</p>
            <button
              onClick={() => navigate('/services')}
              className="mt-4 bg-primary-600 text-white px-6 py-2.5 rounded-xl font-medium active:scale-95 transition-transform"
            >
              Buyurtma berish
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default MyOrders

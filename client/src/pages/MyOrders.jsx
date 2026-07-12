import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'

const statusMap = {
  pending_payment: { label: "To'lov kutilmoqda", color: 'text-yellow-600 bg-yellow-50', icon: '💳' },
  pending_confirmation: { label: "Tekshirilmoqda", color: 'text-blue-600 bg-blue-50', icon: '🔍' },
  in_progress: { label: 'Tayyorlanmoqda', color: 'text-purple-600 bg-purple-50', icon: '📝' },
  ready: { label: 'Tayyor', color: 'text-green-600 bg-green-50', icon: '✅' },
  sent: { label: 'Yuborildi', color: 'text-green-600 bg-green-50', icon: '📤' },
  rejected: { label: 'Rad etildi', color: 'text-red-600 bg-red-50', icon: '❌' },
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
      <div className="p-4 flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
      </div>
    )
  }

  return (
    <div className="p-4">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => navigate('/')}
          className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center"
        >
          ←
        </button>
        <h1 className="text-xl font-bold">Buyurtmalarim</h1>
      </div>

      {/* Orders List */}
      <div className="space-y-3">
        {orders.map(order => {
          const status = statusMap[order.status] || { label: order.status, color: 'text-gray-600 bg-gray-50', icon: '❓' }
          return (
            <div
              key={order.id}
              onClick={() => navigate(`/order-detail/${order.id}`)}
              className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 active:bg-gray-50 transition-colors cursor-pointer"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-mono text-sm text-gray-500">{order.order_code}</p>
                  <p className="font-semibold mt-1">{order.service_name}</p>
                  <p className="text-sm text-gray-500 mt-1">
                    {order.subject} • {order.grade}
                  </p>
                </div>
                <div className={`px-2 py-1 rounded-full text-xs font-medium ${status.color}`}>
                  {status.icon} {status.label}
                </div>
              </div>
              <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
                <p className="font-bold text-primary-600">{order.total_price.toLocaleString()} so'm</p>
                <p className="text-xs text-gray-400">
                  {new Date(order.created_at).toLocaleDateString('uz-UZ')}
                </p>
              </div>
            </div>
          )
        })}
      </div>

      {orders.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <p className="text-4xl mb-2">📦</p>
          <p>Sizda hali buyurtmalar mavjud emas</p>
          <button
            onClick={() => navigate('/services')}
            className="mt-4 bg-primary-500 text-white px-6 py-2 rounded-lg"
          >
            Buyurtma berish
          </button>
        </div>
      )}
    </div>
  )
}

export default MyOrders

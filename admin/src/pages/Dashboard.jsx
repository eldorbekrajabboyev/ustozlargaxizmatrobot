import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import api from '../api/api'

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

function BarChart({ data, labelKey, valueKey, color = 'bg-primary-500' }) {
  if (!data || data.length === 0) return <p className="text-gray-500 text-center py-4 dark:text-gray-400">Ma'lumotlar yo'q</p>
  const maxVal = Math.max(...data.map(d => d[valueKey]), 1)
  return (
    <div className="flex items-end gap-1 h-40">
      {data.map((d, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-1">
          <span className="text-[10px] text-gray-500 dark:text-gray-400">{d[valueKey]}</span>
          <div className={`w-full ${color} rounded-t transition-all`} style={{ height: `${(d[valueKey] / maxVal) * 100}%`, minHeight: d[valueKey] > 0 ? '4px' : '0' }}></div>
          <span className="text-[9px] text-gray-400 dark:text-gray-500 truncate w-full text-center" title={d[labelKey]}>{d[labelKey]?.slice(-5)}</span>
        </div>
      ))}
    </div>
  )
}

function Dashboard() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [chartMode, setChartMode] = useState('daily')

  useEffect(() => {
    api.get('/api/stats')
      .then(res => setStats(res.data))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
      </div>
    )
  }

  if (!stats) return null

  const statCards = [
    { label: 'Jami buyurtmalar', value: stats.totalOrders, icon: '📦', color: 'bg-blue-500' },
    { label: "To'lov kutilmoqda", value: stats.pendingPayment, icon: '💳', color: 'bg-yellow-500' },
    { label: 'Tekshirilmoqda', value: stats.pendingConfirmation, icon: '🔍', color: 'bg-orange-500' },
    { label: 'Tayyorlanmoqda', value: stats.inProgress, icon: '📝', color: 'bg-purple-500' },
    { label: 'Tayyor', value: stats.ready, icon: '✅', color: 'bg-green-500' },
    { label: 'Yuborilgan', value: stats.sent, icon: '📤', color: 'bg-teal-500' },
    { label: 'Jami foydalanuvchilar', value: stats.totalUsers, icon: '👥', color: 'bg-indigo-500' },
    { label: 'Jami daromad', value: `${stats.totalRevenue.toLocaleString()} so'm`, icon: '💰', color: 'bg-emerald-500' },
  ]

  const chartData = chartMode === 'daily' ? (stats.dailyChart || []) : (stats.weeklyChart || [])
  const chartLabel = chartMode === 'daily' ? 'Kunlik' : 'Haftalik'

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>

      {/* Stats Grid */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        {statCards.map((card, idx) => (
          <div key={idx} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 dark:bg-gray-800 dark:border-gray-700/50">
            <div className="flex items-center gap-3">
              <div className={`w-12 h-12 ${card.color} rounded-lg flex items-center justify-center text-white text-xl`}>
                {card.icon}
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">{card.label}</p>
                <p className="text-xl font-bold">{card.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Orders Chart */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 mb-6 dark:bg-gray-800 dark:border-gray-700/50">
        <div className="p-4 border-b border-gray-100 flex items-center justify-between dark:border-gray-700/50">
          <h2 className="font-semibold">{chartLabel} buyurtmalar</h2>
          <div className="flex gap-1 bg-gray-100 rounded-lg p-0.5 dark:bg-gray-700/50">
            <button onClick={() => setChartMode('daily')}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${chartMode === 'daily' ? 'bg-white text-primary-600 shadow-sm dark:bg-gray-800' : 'text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200'}`}>
              Kunlik
            </button>
            <button onClick={() => setChartMode('weekly')}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${chartMode === 'weekly' ? 'bg-white text-primary-600 shadow-sm dark:bg-gray-800' : 'text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200'}`}>
              Haftalik
            </button>
          </div>
        </div>
        <div className="p-4">
          <BarChart data={chartData} labelKey={chartMode === 'daily' ? 'date' : 'week'} valueKey="count" color="bg-primary-500" />
        </div>
      </div>

      {/* Recent Orders & Subject Stats */}
      <div className="grid grid-cols-2 gap-6">
        {/* Recent Orders */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 dark:bg-gray-800 dark:border-gray-700/50">
          <div className="p-4 border-b border-gray-100 flex items-center justify-between dark:border-gray-700/50">
            <h2 className="font-semibold">So'nggi buyurtmalar</h2>
            <Link to="/orders" className="text-primary-500 text-sm hover:underline">Barchasini ko'rish →</Link>
          </div>
          <div className="divide-y divide-gray-100 dark:divide-gray-700/50">
            {stats.recentOrders.map(order => (
              <Link
                key={order.id}
                to={`/orders/${order.id}`}
                className="flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
              >
                <div>
                  <p className="font-mono text-sm text-gray-500 dark:text-gray-400">{order.order_code}</p>
                  <p className="font-medium">{order.full_name}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{order.service_name}</p>
                </div>
                <div className="text-right">
                  <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${statusColors[order.status]}`}>
                    {statusLabels[order.status]}
                  </span>
                  <p className="text-sm font-semibold mt-1">{order.total_price.toLocaleString()} so'm</p>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Subject Stats */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 dark:bg-gray-800 dark:border-gray-700/50">
          <div className="p-4 border-b border-gray-100 dark:border-gray-700/50">
            <h2 className="font-semibold">Fan bo'yicha statistika</h2>
          </div>
          <div className="p-4">
            {stats.subjectStats.length > 0 ? (
              <div className="space-y-3">
                {stats.subjectStats.map((stat, idx) => (
                  <div key={idx} className="flex items-center justify-between">
                    <span className="text-gray-700 dark:text-gray-200">{stat.subject}</span>
                    <div className="flex items-center gap-2">
                      <div className="w-32 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div
                          className="bg-primary-500 h-2 rounded-full"
                          style={{ width: `${(stat.count / stats.totalOrders) * 100}%` }}
                        ></div>
                      </div>
                      <span className="text-sm font-medium text-gray-500 dark:text-gray-400 w-8 text-right">{stat.count}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4 dark:text-gray-400">Ma'lumotlar yo'q</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard

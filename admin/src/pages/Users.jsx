import { useState, useEffect } from 'react'
import axios from 'axios'

function Users() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    axios.get('/api/users')
      .then(res => setUsers(res.data))
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

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Foydalanuvchilar ({users.length})</h1>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">ID</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Telegram ID</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Username</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Ism</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Referral</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Balans</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Sana</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {users.map(user => (
              <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3 text-sm">{user.id}</td>
                <td className="px-4 py-3 text-sm font-mono">{user.telegram_id}</td>
                <td className="px-4 py-3 text-sm">@{user.username || 'N/A'}</td>
                <td className="px-4 py-3">
                  <p className="font-medium">{user.first_name} {user.last_name || ''}</p>
                </td>
                <td className="px-4 py-3 text-sm">{user.referred_count || 0}</td>
                <td className="px-4 py-3 text-sm">{(user.referral_balance || 0).toLocaleString()} so'm</td>
                <td className="px-4 py-3 text-sm text-gray-500">
                  {new Date(user.created_at).toLocaleDateString('uz-UZ')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default Users

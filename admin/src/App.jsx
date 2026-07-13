import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom'
import Dashboard from './pages/Dashboard'
import Orders from './pages/Orders'
import OrderDetail from './pages/OrderDetail'
import Users from './pages/Users'
import Services from './pages/Services'
import Cards from './pages/Cards'
import Settings from './pages/Settings'
import Broadcast from './pages/Broadcast'

const navItems = [
  { path: '/', label: 'Dashboard', icon: '📊' },
  { path: '/orders', label: 'Buyurtmalar', icon: '📦' },
  { path: '/users', label: 'Foydalanuvchilar', icon: '👥' },
  { path: '/services', label: 'Xizmatlar', icon: '📚' },
  { path: '/cards', label: 'Kartalar', icon: '💳' },
  { path: '/broadcast', label: 'Xabar yuborish', icon: '📨' },
  { path: '/settings', label: 'Sozlamalar', icon: '⚙️' },
]

function Sidebar() {
  const location = useLocation()

  return (
    <div className="w-64 bg-gray-900 text-white min-h-screen fixed left-0 top-0">
      <div className="p-4 border-b border-gray-700">
        <h1 className="text-xl font-bold">📚 Metodikish</h1>
        <p className="text-xs text-gray-400 mt-1">Admin Panel</p>
      </div>
      <nav className="p-2">
        {navItems.map(item => (
          <Link
            key={item.path}
            to={item.path}
            className={`flex items-center gap-3 px-3 py-2 rounded-lg mb-1 transition-colors ${
              location.pathname === item.path
                ? 'bg-primary-600 text-white'
                : 'text-gray-300 hover:bg-gray-800'
            }`}
          >
            <span>{item.icon}</span>
            <span>{item.label}</span>
          </Link>
        ))}
      </nav>
    </div>
  )
}

function App() {
  return (
    <Router basename="/admin">
      <div className="flex">
        <Sidebar />
        <div className="flex-1 ml-64">
          <div className="p-6">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/orders" element={<Orders />} />
              <Route path="/orders/:id" element={<OrderDetail />} />
              <Route path="/users" element={<Users />} />
              <Route path="/services" element={<Services />} />
              <Route path="/cards" element={<Cards />} />
              <Route path="/broadcast" element={<Broadcast />} />
              <Route path="/settings" element={<Settings />} />
            </Routes>
          </div>
        </div>
      </div>
    </Router>
  )
}

export default App

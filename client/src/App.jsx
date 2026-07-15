import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom'
import { useEffect, useState } from 'react'
import axios from 'axios'
import Home from './pages/Home'
import Services from './pages/Services'
import OrderForm from './pages/OrderForm'
import MyOrders from './pages/MyOrders'
import OrderDetail from './pages/OrderDetail'
import BottomNav from './components/BottomNav'
import { applyTelegramTheme } from './theme'

const api = axios.create({
  baseURL: '/api',
})

const MAIN_ROUTES = ['/', '/services', '/my-orders']

function AppContent() {
  const [user, setUser] = useState(null)
  const location = useLocation()
  const showNav = MAIN_ROUTES.includes(location.pathname)

  useEffect(() => {
    const tg = window.Telegram?.WebApp
    if (tg) {
      tg.ready()
      tg.expand()
      applyTelegramTheme()
      tg.onEvent?.('themeChanged', applyTelegramTheme)
    }

    if (tg?.initDataUnsafe?.user) {
      const u = tg.initDataUnsafe.user
      setUser(u)
      api.post('/users', {
        telegram_id: u.id,
        username: u.username,
        first_name: u.first_name,
        last_name: u.last_name,
      }).catch(console.error)
    }
  }, [])

  return (
    <div className="min-h-screen bg-tg-bg text-tg-text">
      <Routes>
        <Route path="/" element={<Home user={user} />} />
        <Route path="/services" element={<Services user={user} />} />
        <Route path="/order/:serviceId" element={<OrderForm user={user} />} />
        <Route path="/my-orders" element={<MyOrders user={user} />} />
        <Route path="/order-detail/:orderId" element={<OrderDetail user={user} />} />
      </Routes>
      {showNav && <BottomNav />}
    </div>
  )
}

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  )
}

export default App

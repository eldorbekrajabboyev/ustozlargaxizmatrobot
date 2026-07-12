import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { useEffect, useState } from 'react'
import axios from 'axios'
import Home from './pages/Home'
import Services from './pages/Services'
import OrderForm from './pages/OrderForm'
import MyOrders from './pages/MyOrders'
import OrderDetail from './pages/OrderDetail'

const api = axios.create({
  baseURL: '/api',
})

function App() {
  const [user, setUser] = useState(null)

  useEffect(() => {
    // Initialize Telegram WebApp
    if (window.Telegram && window.Telegram.WebApp) {
      const tg = window.Telegram.WebApp
      tg.ready()
      tg.expand()

      // Get user data from Telegram
      if (tg.initDataUnsafe && tg.initDataUnsafe.user) {
        const tgUser = tg.initDataUnsafe.user
        setUser(tgUser)

        // Register/login user
        api.post('/users', {
          telegram_id: tgUser.id,
          username: tgUser.username,
          first_name: tgUser.first_name,
          last_name: tgUser.last_name,
        }).catch(console.error)
      }
    }
  }, [])

  return (
    <Router>
      <div className="min-h-screen bg-gray-50 safe-bottom">
        <Routes>
          <Route path="/" element={<Home user={user} />} />
          <Route path="/services" element={<Services user={user} />} />
          <Route path="/order/:serviceId" element={<OrderForm user={user} />} />
          <Route path="/my-orders" element={<MyOrders user={user} />} />
          <Route path="/order-detail/:orderId" element={<OrderDetail user={user} />} />
        </Routes>
      </div>
    </Router>
  )
}

export default App

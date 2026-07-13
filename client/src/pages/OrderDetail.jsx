import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import axios from 'axios'

const PAYMENT_TIMEOUT_MS = 4 * 60 * 1000

function useCountdown(createdAt) {
  const [remaining, setRemaining] = useState(0)
  const [expired, setExpired] = useState(false)

  useEffect(() => {
    if (!createdAt) return
    const createdTime = new Date(createdAt).getTime()
    const endTime = createdTime + PAYMENT_TIMEOUT_MS
    const tick = () => {
      const diff = endTime - Date.now()
      if (diff <= 0) { setRemaining(0); setExpired(true); return }
      setRemaining(diff)
    }
    tick()
    const interval = setInterval(tick, 1000)
    return () => clearInterval(interval)
  }, [createdAt])

  const mins = Math.floor(remaining / 60000)
  const secs = Math.floor((remaining % 60000) / 1000)
  return { mins, secs, expired }
}

const statusMap = {
  pending_payment: { label: "To'lov kutilmoqda", color: 'text-yellow-600 bg-yellow-50', icon: '💳', desc: "Iltimos, to'lovni amalga oshiring" },
  pending_confirmation: { label: "Tekshirilmoqda", color: 'text-blue-600 bg-blue-50', icon: '🔍', desc: "To'lovingiz tekshirilmoqda" },
  in_progress: { label: 'Tayyorlanmoqda', color: 'text-purple-600 bg-purple-50', icon: '📝', desc: "Hujjat tayyorlanmoqda" },
  ready: { label: 'Tayyor', color: 'text-green-600 bg-green-50', icon: '✅', desc: "Hujjat tayyor! Tez orada yuboriladi" },
  sent: { label: 'Yuborildi', color: 'text-green-600 bg-green-50', icon: '📤', desc: "Hujjat sizga yuborildi" },
  rejected: { label: 'Rad etildi', color: 'text-red-600 bg-red-50', icon: '❌', desc: "To'lov rad etildi" },
}

function OrderDetail({ user }) {
  const navigate = useNavigate()
  const { orderId } = useParams()
  const [order, setOrder] = useState(null)
  const [cards, setCards] = useState([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)

  // ALL hooks must be before any conditional returns
  const countdown = useCountdown(order?.status === 'pending_payment' ? order?.created_at : null)

  useEffect(() => {
    Promise.all([
      axios.get(`/api/orders/${orderId}`),
      axios.get('/api/user/active-cards'),
    ]).then(([orderRes, cardsRes]) => {
      setOrder(orderRes.data)
      setCards(cardsRes.data)
    }).catch(err => {
      console.error(err)
    }).finally(() => setLoading(false))
  }, [orderId])

  useEffect(() => {
    if (order?.status !== 'pending_payment') return
    const interval = setInterval(async () => {
      try {
        const res = await axios.get(`/api/orders/${orderId}`)
        setOrder(res.data)
      } catch (e) {}
    }, 5000)
    return () => clearInterval(interval)
  }, [order?.status, orderId])

  const handleReceiptUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('receipt', file)
      await axios.post(`/api/orders/${orderId}/receipt`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      const res = await axios.get(`/api/orders/${orderId}`)
      setOrder(res.data)
    } catch (err) {
      console.error(err)
      alert('Chek yuklashda xatolik')
    } finally {
      setUploading(false)
    }
  }

  if (loading) {
    return (
      <div className="p-4 flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
      </div>
    )
  }

  if (!order) {
    return (
      <div className="p-4 text-center py-12">
        <p className="text-gray-500">Buyurtma topilmadi</p>
      </div>
    )
  }

  const status = statusMap[order.status] || { label: order.status, color: 'text-gray-600 bg-gray-50', icon: '❓', desc: '' }

  return (
    <div className="p-4">
      <div className="flex items-center gap-3 mb-4">
        <button onClick={() => navigate('/my-orders')} className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">←</button>
        <div>
          <h1 className="text-xl font-bold">Buyurtma</h1>
          <p className="text-sm text-gray-500 font-mono">{order.order_code}</p>
        </div>
      </div>

      <div className={`rounded-xl p-4 mb-4 ${status.color}`}>
        <div className="flex items-center gap-2">
          <span className="text-2xl">{status.icon}</span>
          <div>
            <p className="font-semibold">{status.label}</p>
            <p className="text-sm opacity-80">{status.desc}</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl p-4 shadow-sm mb-4">
        <h3 className="font-semibold mb-3">Buyurtma malumotlari</h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between"><span className="text-gray-500">Xizmat:</span><span className="font-medium">{order.service_name}</span></div>
          <div className="flex justify-between"><span className="text-gray-500">Narx:</span><span className="font-bold text-primary-600">{order.total_price?.toLocaleString()} so'm</span></div>
          <div className="flex justify-between"><span className="text-gray-500">F.I.Sh:</span><span className="font-medium">{order.full_name}</span></div>
          <div className="flex justify-between"><span className="text-gray-500">Maktab:</span><span className="font-medium">{order.school}</span></div>
          <div className="flex justify-between"><span className="text-gray-500">Fan:</span><span className="font-medium">{order.subject}</span></div>
          <div className="flex justify-between"><span className="text-gray-500">Sinf:</span><span className="font-medium">{order.grade}</span></div>
          <div className="flex justify-between"><span className="text-gray-500">Mavzu:</span><span className="font-medium">{order.topic}</span></div>
        </div>
      </div>

      {order.images && order.images.length > 0 && (
        <div className="bg-white rounded-xl p-4 shadow-sm mb-4">
          <h3 className="font-semibold mb-3">Rasmlar</h3>
          <div className="flex gap-2 flex-wrap">
            {order.images.map((img, idx) => (
              <img key={idx} src={img.image_path} alt="" className="w-20 h-20 object-cover rounded-lg" />
            ))}
          </div>
        </div>
      )}

      {order.status === 'pending_payment' && (
        <div className="bg-white rounded-xl p-4 shadow-sm mb-4">
          <div className={`rounded-lg p-3 mb-3 text-center ${countdown.expired ? 'bg-red-50 border border-red-200' : 'bg-yellow-50 border border-yellow-200'}`}>
            {countdown.expired ? (
              <>
                <p className="text-red-600 font-bold text-lg">Vaqt tugadi!</p>
                <p className="text-red-500 text-sm">Buyurtma avtomatik bekor qilindi</p>
              </>
            ) : (
              <>
                <p className="text-yellow-700 font-semibold">Chekni yuklash uchun qolgan vaqt:</p>
                <p className="text-3xl font-bold text-yellow-600 font-mono mt-1">
                  {countdown.mins}:{countdown.secs.toString().padStart(2, '0')}
                </p>
              </>
            )}
          </div>

          <h3 className="font-semibold mb-3">To'lov</h3>
          {cards.length > 0 && (
            <div className="bg-gray-50 rounded-lg p-3 mb-3">
              <p className="text-sm text-gray-500">Karta raqami:</p>
              <p className="font-mono font-bold text-lg">{cards[0].card_number}</p>
              <p className="text-sm text-gray-600">{cards[0].card_holder}</p>
              {cards[0].bank_name && <p className="text-xs text-gray-500">{cards[0].bank_name}</p>}
            </div>
          )}
          {!countdown.expired ? (
            <label className="block w-full">
              <div className={`border-2 border-dashed border-gray-300 rounded-lg p-4 text-center cursor-pointer hover:border-primary-500 transition-colors ${uploading ? 'opacity-50' : ''}`}>
                {uploading ? (
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-500 mx-auto"></div>
                ) : (
                  <>
                    <span className="text-2xl">📸</span>
                    <p className="text-gray-500 mt-1">Chek rasmini yuklash</p>
                  </>
                )}
              </div>
              <input type="file" accept="image/*" onChange={handleReceiptUpload} className="hidden" disabled={uploading} />
            </label>
          ) : (
            <div className="bg-red-50 rounded-lg p-4 text-center">
              <p className="text-red-500 text-sm">Chek yuklash muddati tugagan</p>
            </div>
          )}
        </div>
      )}

      {order.document_file && (
        <div className="bg-white rounded-xl p-4 shadow-sm mb-4">
          <h3 className="font-semibold mb-3">Hujjat</h3>
          <a href={order.document_file} target="_blank" rel="noopener noreferrer"
            className="block w-full bg-green-500 text-white rounded-lg py-3 text-center font-medium active:bg-green-600 transition-colors">
            Hujjatni yuklab olish
          </a>
        </div>
      )}

      {order.admin_note && (
        <div className="bg-yellow-50 rounded-xl p-4 mb-4">
          <h3 className="font-semibold text-yellow-800 mb-1">Eslatma</h3>
          <p className="text-sm text-yellow-700">{order.admin_note}</p>
        </div>
      )}
    </div>
  )
}

export default OrderDetail

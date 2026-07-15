import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import axios from 'axios'
import Header from '../components/Header'

const PAYMENT_TIMEOUT_MS = 4 * 60 * 1000

function parseToUTCTimestamp(dateStr) {
  if (!dateStr) return NaN
  if (typeof dateStr === 'number') return dateStr
  const clean = String(dateStr).replace('T', ' ').replace(/\.\d+Z?$/, '').replace(/Z$/i, '').trim()
  const match = clean.match(/(\d{4})-(\d{2})-(\d{2})\s+(\d{2}):(\d{2}):(\d{2})/)
  if (!match) return NaN
  const [, y, m, d, h, min, s] = match.map(Number)
  return Date.UTC(y, m - 1, d, h - 5, min, s)
}

function useCountdown(createdAt) {
  const [remaining, setRemaining] = useState(0)
  const [expired, setExpired] = useState(false)

  useEffect(() => {
    if (!createdAt) return
    const createdTime = parseToUTCTimestamp(createdAt)
    if (isNaN(createdTime)) return
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
  pending_payment: { label: "To'lov kutilmoqda", color: 'bg-amber-100 text-amber-700', icon: '💳', desc: "Iltimos, to'lovni amalga oshiring" },
  pending_confirmation: { label: "Tekshirilmoqda", color: 'bg-sky-100 text-sky-700', icon: '🔍', desc: "To'lovingiz tekshirilmoqda" },
  in_progress: { label: 'Tayyorlanmoqda', color: 'bg-violet-100 text-violet-700', icon: '📝', desc: "Hujjat tayyorlanmoqda" },
  ready: { label: 'Tayyor', color: 'bg-emerald-100 text-emerald-700', icon: '✅', desc: "Hujjat tayyor! Tez orada yuboriladi" },
  sent: { label: 'Yuborildi', color: 'bg-emerald-100 text-emerald-700', icon: '📤', desc: "Hujjat sizga yuborildi" },
  rejected: { label: 'Rad etildi', color: 'bg-rose-100 text-rose-700', icon: '❌', desc: "To'lov rad etildi" },
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
    if (!order) return
    const pollStatuses = ['pending_payment', 'pending_confirmation']
    if (!pollStatuses.includes(order.status)) return
    const interval = setInterval(async () => {
      try {
        const res = await axios.get(`/api/orders/${orderId}`)
        setOrder(res.data)
      } catch (e) {}
    }, 3000)
    return () => clearInterval(interval)
  }, [order?.status, orderId])

  useEffect(() => {
    if (!countdown.expired || !order || order.status !== 'pending_payment') return
    axios.post(`/api/orders/${orderId}/auto-cancel`).then(() => {
      setOrder(prev => prev ? { ...prev, status: 'rejected', admin_note: 'Avtomatik bekor qilindi: 4 daqiqada chek yuklanmadi' } : prev)
    }).catch(() => {})
  }, [countdown.expired, order?.status, orderId])

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
      <div className="animate-fade-in">
        <Header title="Buyurtma" />
        <div className="p-4 flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary-500 border-t-transparent"></div>
        </div>
      </div>
    )
  }

  if (!order) {
    return (
      <div className="animate-fade-in">
        <Header title="Buyurtma" />
        <div className="p-4 text-center py-16 text-tg-hint">
          <p className="text-4xl mb-2">🔍</p>
          <p>Buyurtma topilmadi</p>
        </div>
      </div>
    )
  }

  const status = statusMap[order.status] || { label: order.status, color: 'bg-gray-100 text-gray-600', icon: '❓', desc: '' }

  return (
    <div className="animate-fade-in min-h-screen">
      <Header title="Buyurtma" subtitle={order.order_code} onBack={() => navigate('/my-orders')} />

      <div className="p-4 space-y-3">
        <div className={`rounded-2xl p-4 ${status.color} flex items-center gap-3`}>
          <span className="text-3xl">{status.icon}</span>
          <div>
            <p className="font-semibold">{status.label}</p>
            <p className="text-sm opacity-80 mt-0.5">{status.desc}</p>
          </div>
        </div>

        <div className="bg-tg-secondary rounded-2xl p-4 shadow-card border border-black/5">
          <h3 className="font-semibold text-tg-text mb-3">Buyurtma ma'lumotlari</h3>
          <div className="space-y-2.5 text-sm">
            <Row label="Xizmat" value={order.service_name} />
            <Row label="Narx" value={`${order.total_price?.toLocaleString()} so'm`} accent />
            <Row label="F.I.Sh" value={order.full_name} />
            <Row label="Maktab" value={order.school} />
            <Row label="Fan" value={order.subject} />
            <Row label="Sinf" value={`${order.grade}-sinf`} />
            <Row label="Mavzu" value={order.topic} />
          </div>
        </div>

        {order.images && order.images.length > 0 && (
          <div className="bg-tg-secondary rounded-2xl p-4 shadow-card border border-black/5">
            <h3 className="font-semibold text-tg-text mb-3">Rasmlar</h3>
            <div className="flex gap-2 flex-wrap">
              {order.images.map((img, idx) => (
                <img key={idx} src={img.image_path} alt="" className="w-20 h-20 object-cover rounded-xl" />
              ))}
            </div>
          </div>
        )}

        {order.status === 'pending_payment' && (
          <div className="bg-tg-secondary rounded-2xl p-4 shadow-card border border-black/5">
            <div className={`rounded-xl p-4 mb-4 text-center ${countdown.expired ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-800'}`}>
              {countdown.expired ? (
                <>
                  <p className="font-bold text-lg">Vaqt tugadi!</p>
                  <p className="text-sm mt-0.5">Buyurtma avtomatik bekor qilindi</p>
                </>
              ) : (
                <>
                  <p className="font-medium">Chekni yuklash uchun qolgan vaqt:</p>
                  <p className="text-3xl font-bold font-mono mt-1">
                    {countdown.mins}:{countdown.secs.toString().padStart(2, '0')}
                  </p>
                </>
              )}
            </div>

            <h3 className="font-semibold text-tg-text mb-3">To'lov</h3>
            {cards.length > 0 && (
              <div className="bg-black/5 rounded-xl p-3 mb-4">
                <p className="text-xs text-tg-hint">Karta raqami</p>
                <p className="font-mono font-bold text-lg text-tg-text mt-0.5">{cards[0].card_number}</p>
                <p className="text-sm text-tg-text">{cards[0].card_holder}</p>
                {cards[0].bank_name && <p className="text-xs text-tg-hint">{cards[0].bank_name}</p>}
              </div>
            )}
            {!countdown.expired ? (
              <label className="block w-full">
                <div className={`border-2 border-dashed border-primary-300 rounded-xl p-5 text-center cursor-pointer hover:border-primary-500 transition-colors ${uploading ? 'opacity-50' : ''}`}>
                  {uploading ? (
                    <div className="animate-spin rounded-full h-6 w-6 border-2 border-primary-500 border-t-transparent mx-auto"></div>
                  ) : (
                    <>
                      <span className="text-3xl">📸</span>
                      <p className="text-tg-hint mt-1 text-sm">Chek rasmini yuklash</p>
                    </>
                  )}
                </div>
                <input type="file" accept="image/*" onChange={handleReceiptUpload} className="hidden" disabled={uploading} />
              </label>
            ) : (
              <div className="bg-rose-100 text-rose-700 rounded-xl p-4 text-center text-sm">
                Chek yuklash muddati tugagan
              </div>
            )}
          </div>
        )}

        {order.document_file && (
          <div className="bg-tg-secondary rounded-2xl p-4 shadow-card border border-black/5">
            <h3 className="font-semibold text-tg-text mb-3">Hujjat</h3>
            <a href={order.document_file} target="_blank" rel="noopener noreferrer"
              className="block w-full bg-emerald-500 text-white rounded-xl py-3 text-center font-medium active:scale-95 transition-transform">
              Hujjatni yuklab olish ↓
            </a>
          </div>
        )}

        {order.admin_note && (
          <div className="bg-amber-100 rounded-2xl p-4 border border-amber-200">
            <h3 className="font-semibold text-amber-800 mb-1 flex items-center gap-2">⚠️ Eslatma</h3>
            <p className="text-sm text-amber-700">{order.admin_note}</p>
          </div>
        )}
      </div>
    </div>
  )
}

function Row({ label, value, accent }) {
  return (
    <div className="flex justify-between gap-3">
      <span className="text-tg-hint shrink-0">{label}:</span>
      <span className={`font-medium text-right ${accent ? 'text-primary-600' : 'text-tg-text'}`}>{value}</span>
    </div>
  )
}

export default OrderDetail

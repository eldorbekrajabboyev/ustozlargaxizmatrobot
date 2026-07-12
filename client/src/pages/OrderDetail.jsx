import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import axios from 'axios'

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

  useEffect(() => {
    Promise.all([
      axios.get(`/api/orders/${orderId}`),
      axios.get('/api/user/active-cards'),
    ]).then(([orderRes, cardsRes]) => {
      setOrder(orderRes.data)
      setCards(cardsRes.data)
    }).catch(console.error)
    .finally(() => setLoading(false))
  }, [orderId])

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
      // Reload order
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
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <button
          onClick={() => navigate('/my-orders')}
          className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center"
        >
          ←
        </button>
        <div>
          <h1 className="text-xl font-bold">Buyurtma</h1>
          <p className="text-sm text-gray-500 font-mono">{order.order_code}</p>
        </div>
      </div>

      {/* Status */}
      <div className={`rounded-xl p-4 mb-4 ${status.color}`}>
        <div className="flex items-center gap-2">
          <span className="text-2xl">{status.icon}</span>
          <div>
            <p className="font-semibold">{status.label}</p>
            <p className="text-sm opacity-80">{status.desc}</p>
          </div>
        </div>
      </div>

      {/* Order Info */}
      <div className="bg-white rounded-xl p-4 shadow-sm mb-4">
        <h3 className="font-semibold mb-3">📋 Buyurtma ma'lumotlari</h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-500">Xizmat:</span>
            <span className="font-medium">{order.service_name}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Narx:</span>
            <span className="font-bold text-primary-600">{order.total_price.toLocaleString()} so'm</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">F.I.Sh:</span>
            <span className="font-medium">{order.full_name}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Maktab:</span>
            <span className="font-medium">{order.school}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Fan:</span>
            <span className="font-medium">{order.subject}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Sinf:</span>
            <span className="font-medium">{order.grade}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Mavzu:</span>
            <span className="font-medium">{order.topic}</span>
          </div>
        </div>
      </div>

      {/* Images */}
      {order.images && order.images.length > 0 && (
        <div className="bg-white rounded-xl p-4 shadow-sm mb-4">
          <h3 className="font-semibold mb-3">🖼 Rasmlar</h3>
          <div className="flex gap-2 flex-wrap">
            {order.images.map((img, idx) => (
              <img
                key={idx}
                src={img.image_path}
                alt=""
                className="w-20 h-20 object-cover rounded-lg"
              />
            ))}
          </div>
        </div>
      )}

      {/* Payment Section */}
      {order.status === 'pending_payment' && (
        <div className="bg-white rounded-xl p-4 shadow-sm mb-4">
          <h3 className="font-semibold mb-3">💳 To'lov</h3>
          {cards.length > 0 && (
            <div className="bg-gray-50 rounded-lg p-3 mb-3">
              <p className="text-sm text-gray-500">Karta raqami:</p>
              <p className="font-mono font-bold text-lg">{cards[0].card_number}</p>
              <p className="text-sm text-gray-600">{cards[0].card_holder}</p>
              {cards[0].bank_name && <p className="text-xs text-gray-500">{cards[0].bank_name}</p>}
            </div>
          )}
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
            <input
              type="file"
              accept="image/*"
              onChange={handleReceiptUpload}
              className="hidden"
              disabled={uploading}
            />
          </label>
        </div>
      )}

      {/* Document Download */}
      {order.document_file && (
        <div className="bg-white rounded-xl p-4 shadow-sm mb-4">
          <h3 className="font-semibold mb-3">📄 Hujjat</h3>
          <a
            href={order.document_file}
            target="_blank"
            rel="noopener noreferrer"
            className="block w-full bg-green-500 text-white rounded-lg py-3 text-center font-medium active:bg-green-600 transition-colors"
          >
            📥 Hujjatni yuklab olish
          </a>
        </div>
      )}

      {/* Admin Note */}
      {order.admin_note && (
        <div className="bg-yellow-50 rounded-xl p-4 mb-4">
          <h3 className="font-semibold text-yellow-800 mb-1">💬 Eslatma</h3>
          <p className="text-sm text-yellow-700">{order.admin_note}</p>
        </div>
      )}
    </div>
  )
}

export default OrderDetail

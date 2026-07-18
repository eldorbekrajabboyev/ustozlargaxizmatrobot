import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import axios from 'axios'

const statusColors = {
  pending_payment: 'bg-yellow-100 text-yellow-800',
  pending_confirmation: 'bg-blue-100 text-blue-800',
  in_progress: 'bg-purple-100 text-purple-800',
  ready: 'bg-green-100 text-green-800',
  sent: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
}

const statusLabels = {
  pending_payment: "To'lov kutilmoqda",
  pending_confirmation: "Tekshirilmoqda",
  in_progress: 'Tayyorlanmoqda',
  ready: 'Tayyor',
  sent: 'Yuborildi',
  rejected: 'Rad etildi',
}

function OrderDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [adminNote, setAdminNote] = useState('')

  useEffect(() => {
    axios.get(`/api/orders/${id}`)
      .then(res => {
        setOrder(res.data)
        setAdminNote(res.data.admin_note || '')
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [id])

  const updateStatus = async (newStatus) => {
    try {
      // Use specific endpoints for certain actions
      if (newStatus === 'in_progress') {
        await axios.put(`/api/orders/${id}/confirm-payment`)
      } else if (newStatus === 'sent') {
        await axios.put(`/api/orders/${id}/send`)
      } else {
        await axios.put(`/api/orders/${id}`, { status: newStatus })
      }
      const res = await axios.get(`/api/orders/${id}`)
      setOrder(res.data)
    } catch (err) {
      alert('Xatolik')
    }
  }

  const rejectPayment = async () => {
    const reason = prompt('Rad etish sababini kiriting (ixtiyoriy):')
    if (reason === null) return
    try {
      await axios.put(`/api/orders/${id}/reject-payment`, { reason: reason || null })
      const res = await axios.get(`/api/orders/${id}`)
      setOrder(res.data)
    } catch (err) {
      alert('Xatolik')
    }
  }

  const handleDocumentUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('document', file)
      await axios.post(`/api/orders/${id}/document`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      const res = await axios.get(`/api/orders/${id}`)
      setOrder(res.data)
    } catch (err) {
      alert('Fayl yuklashda xatolik')
    } finally {
      setUploading(false)
    }
  }

  const saveNote = async () => {
    try {
      await axios.put(`/api/orders/${id}`, { admin_note: adminNote })
      alert('Saqlandi')
    } catch (err) {
      alert('Xatolik')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
      </div>
    )
  }

  if (!order) return null

  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => navigate('/orders')}
          className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center hover:bg-gray-200"
        >
          ←
        </button>
        <div>
          <h1 className="text-2xl font-bold">Buyurtma #{order.order_code}</h1>
          <p className="text-gray-500">ID: {order.id}</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Left Column - Order Info */}
        <div className="col-span-2 space-y-6">
          {/* Status */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${statusColors[order.status]}`}>
                  {statusLabels[order.status]}
                </span>
                <span className="text-gray-500">
                  {order.status === 'pending_payment' && (
                    <>Yaratilgan: {new Date(order.created_at).toLocaleString('uz-UZ', { timeZone: 'Asia/Tashkent' })}</>
                  )}
                  {(order.status === 'pending_confirmation' || order.status === 'in_progress') && (
                    <>Chek yuklangan: {new Date(order.receipt_uploaded_at || order.created_at).toLocaleString('uz-UZ', { timeZone: 'Asia/Tashkent' })}</>
                  )}
                  {order.status === 'ready' && (
                    <>
                      Tayyor: {new Date(order.ready_at || order.created_at).toLocaleString('uz-UZ', { timeZone: 'Asia/Tashkent' })}
                      {order.receipt_uploaded_at && order.ready_at && (
                        <span className="ml-2 text-xs text-purple-600 font-medium">
                          ({Math.round((new Date(order.ready_at) - new Date(order.receipt_uploaded_at)) / 3600000)} soatda tayyor bo'ldi)
                        </span>
                      )}
                    </>
                  )}
                  {order.status === 'sent' && (
                    <div className="flex flex-col gap-0.5">
                      <span>1. Chek: {new Date(order.receipt_uploaded_at || order.created_at).toLocaleString('uz-UZ', { timeZone: 'Asia/Tashkent' })}</span>
                      <span>2. Tayyor: {new Date(order.ready_at || order.created_at).toLocaleString('uz-UZ', { timeZone: 'Asia/Tashkent' })}</span>
                    </div>
                  )}
                </span>
              </div>
              <div className="flex gap-2">
                {order.status === 'pending_confirmation' && (
                  <>
                    <button
                      onClick={() => updateStatus('in_progress')}
                      className="px-4 py-2 bg-green-500 text-white rounded-lg text-sm hover:bg-green-600"
                    >
                      ✅ Tasdiqlash
                    </button>
                    <button
                      onClick={rejectPayment}
                      className="px-4 py-2 bg-red-500 text-white rounded-lg text-sm hover:bg-red-600"
                    >
                      ❌ Rad etish
                    </button>
                  </>
                )}
                {order.status === 'in_progress' && (
                  <button
                    onClick={() => updateStatus('ready')}
                    className="px-4 py-2 bg-green-500 text-white rounded-lg text-sm hover:bg-green-600"
                  >
                    ✅ Tayyor
                  </button>
                )}
                {order.status === 'ready' && order.document_file && (
                  <button
                    onClick={() => updateStatus('sent')}
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg text-sm hover:bg-blue-600"
                  >
                    📤 Yuborish
                  </button>
                )}
                {order.status === 'ready' && !order.document_file && (
                  <span className="px-4 py-2 bg-gray-300 text-gray-500 rounded-lg text-sm cursor-not-allowed">
                    📤 Avval hujjat yuklang
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Customer Info */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <h2 className="font-semibold mb-4">👤 Foydalanuvchi ma'lumotlari</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">F.I.Sh</p>
                <p className="font-medium">{order.full_name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Telegram</p>
                <p className="font-medium">@{order.username || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Maktab</p>
                <p className="font-medium">{order.school}</p>
              </div>
              {order.school_type && (
                <div>
                  <p className="text-sm text-gray-500">Maktab turi</p>
                  <p className="font-medium">
                    {order.school_type === 'uzbek' ? "🇺🇿 O'zbek maktab" :
                     order.school_type === 'russian' ? '🇷🇺 Rus maktab' :
                     order.school_type === 'qoraqalpoq' ? "🏛 Qoraqalpoq maktab" : order.school_type}
                  </p>
                </div>
              )}
              {order.language_surcharge > 0 && (
                <div>
                  <p className="text-sm text-gray-500">Til qo'shimcha</p>
                  <p className="font-medium text-amber-600">+{order.language_surcharge.toLocaleString()} so'm</p>
                </div>
              )}
              {order.geographic_surcharge > 0 && (
                <div>
                  <p className="text-sm text-gray-500">Geografik daraja</p>
                  <p className="font-medium text-amber-600">
                    {order.geographic_level === 'viloyat' ? '🏢 Viloyat darajasi' : '🏛 Respublika darajasi'} — +{order.geographic_surcharge.toLocaleString()} so'm
                  </p>
                </div>
              )}
              {order.promo_discount > 0 && (
                <div>
                  <p className="text-sm text-gray-500">Promo-kod chegirmasi</p>
                  <p className="font-medium text-green-600">-{order.promo_discount.toLocaleString()} so'm</p>
                </div>
              )}
              <div>
                <p className="text-sm text-gray-500">Fan</p>
                <p className="font-medium">{order.subject}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Sinf</p>
                <p className="font-medium">{order.grade}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Mavzu</p>
                <p className="font-medium">{order.topic}</p>
              </div>
              <div className="col-span-2">
                <p className="text-sm text-gray-500">Manzil</p>
                <p className="font-medium">{order.address}</p>
              </div>
            </div>
          </div>

          {/* Images */}
          {order.images && order.images.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
              <h2 className="font-semibold mb-4">🖼 Rasmlar</h2>
              <div className="flex gap-3 flex-wrap">
                {order.images.map((img, idx) => (
                  <a key={idx} href={img.image_path} target="_blank" rel="noopener noreferrer">
                    <img
                      src={img.image_path}
                      alt=""
                      className="w-24 h-24 object-cover rounded-lg border border-gray-200 hover:border-primary-500 transition-colors"
                    />
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Payment Receipt */}
          {order.payment_receipt && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold">💳 To'lov cheki</h2>
                {order.receipt_uploaded_at && (
                  <span className="text-sm text-gray-500">
                    Yuklangan: {new Date(order.receipt_uploaded_at).toLocaleString('uz-UZ', { timeZone: 'Asia/Tashkent' })}
                  </span>
                )}
              </div>
              <a href={order.payment_receipt} target="_blank" rel="noopener noreferrer">
                <img
                  src={order.payment_receipt}
                  alt="Chek"
                  className="max-w-md rounded-lg border border-gray-200 hover:border-primary-500 transition-colors"
                />
              </a>
            </div>
          )}
        </div>

        {/* Right Column - Actions */}
        <div className="space-y-6">
          {/* Price */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <h2 className="font-semibold mb-2">💰 Narx</h2>
            <p className="text-3xl font-bold text-primary-600">{order.total_price.toLocaleString()} so'm</p>
            <p className="text-sm text-gray-500 mt-1">{order.service_name}</p>
          </div>

          {/* Upload Document */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <h2 className="font-semibold mb-4">📄 Hujjat</h2>
            {order.document_file ? (
              <div>
                <a
                  href={order.document_file}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full bg-green-50 text-green-700 rounded-lg p-3 text-center hover:bg-green-100 transition-colors"
                >
                  📥 Hujjatni yuklab olish
                </a>
                <label className="block mt-2">
                  <div className={`border-2 border-dashed border-gray-300 rounded-lg p-4 text-center cursor-pointer hover:border-primary-500 transition-colors ${uploading ? 'opacity-50' : ''}`}>
                    {uploading ? (
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-500 mx-auto"></div>
                    ) : (
                      <p className="text-gray-500 text-sm">Yangi hujjat yuklash</p>
                    )}
                  </div>
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx"
                    onChange={handleDocumentUpload}
                    className="hidden"
                    disabled={uploading}
                  />
                </label>
              </div>
            ) : (
              <label className="block">
                <div className={`border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-primary-500 transition-colors ${uploading ? 'opacity-50' : ''}`}>
                  {uploading ? (
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500 mx-auto"></div>
                  ) : (
                    <>
                      <span className="text-3xl">📎</span>
                      <p className="text-gray-500 mt-2">Hujjatni bu yerga yuklang</p>
                      <p className="text-xs text-gray-400 mt-1">PDF, DOC, DOCX</p>
                    </>
                  )}
                </div>
                <input
                  type="file"
                  accept=".pdf,.doc,.docx"
                  onChange={handleDocumentUpload}
                  className="hidden"
                  disabled={uploading}
                />
              </label>
            )}
          </div>

          {/* Admin Note */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <h2 className="font-semibold mb-4">💬 Eslatma</h2>
            <textarea
              value={adminNote}
              onChange={(e) => setAdminNote(e.target.value)}
              placeholder="Eslatma qo'shing..."
              className="w-full border border-gray-300 rounded-lg p-3 text-sm resize-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              rows={4}
            />
            <button
              onClick={saveNote}
              className="w-full mt-2 bg-gray-100 text-gray-700 rounded-lg py-2 text-sm hover:bg-gray-200 transition-colors"
            >
              💾 Saqlash
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default OrderDetail

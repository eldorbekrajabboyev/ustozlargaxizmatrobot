import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import axios from 'axios'

function OrderForm({ user }) {
  const navigate = useNavigate()
  const { serviceId } = useParams()
  const [service, setService] = useState(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [step, setStep] = useState(1)
  const [images, setImages] = useState([])
  const [cards, setCards] = useState([])

  const [form, setForm] = useState({
    full_name: '',
    address: '',
    school: '',
    subject: '',
    grade: '',
    topic: '',
  })

  useEffect(() => {
    Promise.all([
      axios.get(`/api/services`),
      axios.get('/api/user/active-cards'),
    ]).then(([servicesRes, cardsRes]) => {
      const svc = servicesRes.data.find(s => s.id == serviceId)
      setService(svc)
      setCards(cardsRes.data)
    }).catch(console.error)
    .finally(() => setLoading(false))
  }, [serviceId])

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files)
    if (images.length + files.length > 5) {
      alert('Maksimal 5 ta rasm yuklash mumkin')
      return
    }
    setImages([...images, ...files].slice(0, 5))
  }

  const removeImage = (index) => {
    setImages(images.filter((_, i) => i !== index))
  }

  const handleSubmit = async () => {
    if (!user) {
      alert('Foydalanuvchi aniqlanmadi')
      return
    }

    setSubmitting(true)
    try {
      // Get or create user
      const userRes = await axios.post('/api/users', {
        telegram_id: user.id,
        username: user.username,
        first_name: user.first_name,
        last_name: user.last_name,
      })

      // Create order
      const orderRes = await axios.post('/api/orders', {
        user_id: userRes.data.id,
        service_id: serviceId,
        full_name: form.full_name,
        address: form.address,
        school: form.school,
        subject: form.subject,
        grade: form.grade,
        topic: form.topic,
      })

      // Upload images if any
      if (images.length > 0) {
        const formData = new FormData()
        images.forEach(img => formData.append('images', img))
        await axios.post(`/api/orders/${orderRes.data.id}/images`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        })
      }

      // Navigate to payment
      navigate(`/order-detail/${orderRes.data.id}`)
    } catch (err) {
      console.error(err)
      alert('Xatolik yuz berdi. Qaytadan urinib ko\'ring.')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="p-4 flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
      </div>
    )
  }

  if (!service) {
    return (
      <div className="p-4 text-center py-12">
        <p className="text-gray-500">Xizmat topilmadi</p>
      </div>
    )
  }

  const steps = [
    { num: 1, title: 'Shaxsiy ma\'lumotlar' },
    { num: 2, title: 'Maktab va fan' },
    { num: 3, title: 'Mavzu va rasmlar' },
  ]

  return (
    <div className="p-4">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <button
          onClick={() => step > 1 ? setStep(step - 1) : navigate(-1)}
          className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center"
        >
          ←
        </button>
        <div>
          <h1 className="text-xl font-bold">{service.name}</h1>
          <p className="text-primary-600 font-semibold">{service.price.toLocaleString()} so'm</p>
        </div>
      </div>

      {/* Progress */}
      <div className="flex gap-2 mb-6">
        {steps.map(s => (
          <div key={s.num} className="flex-1">
            <div className={`h-1 rounded-full ${step >= s.num ? 'bg-primary-500' : 'bg-gray-200'}`}></div>
            <p className="text-xs text-gray-500 mt-1">{s.title}</p>
          </div>
        ))}
      </div>

      {/* Step 1: Personal Info */}
      {step === 1 && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">To'liq F.I.Sh *</label>
            <input
              type="text"
              name="full_name"
              value={form.full_name}
              onChange={handleChange}
              placeholder="Masalan: Karimov Valijon Botirович"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Yashash manzili *</label>
            <input
              type="text"
              name="address"
              value={form.address}
              onChange={handleChange}
              placeholder="Masalan: Toshkent sh., Chilonzor t., 8-kvartal, 45-uy"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
          <button
            onClick={() => form.full_name && form.address && setStep(2)}
            disabled={!form.full_name || !form.address}
            className="w-full bg-primary-500 text-white rounded-lg py-3 font-medium disabled:bg-gray-300 active:bg-primary-600 transition-colors"
          >
            Keyingisi →
          </button>
        </div>
      )}

      {/* Step 2: School & Subject */}
      {step === 2 && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Maktab nomi/soni *</label>
            <input
              type="text"
              name="school"
              value={form.school}
              onChange={handleChange}
              placeholder="Masalan: 1-maktab"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Fan *</label>
            <input
              type="text"
              name="subject"
              value={form.subject}
              onChange={handleChange}
              placeholder="Masalan: Matematika"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nechinchi sinf *</label>
            <input
              type="text"
              name="grade"
              value={form.grade}
              onChange={handleChange}
              placeholder="Masalan: 5-sinf"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
          <button
            onClick={() => form.school && form.subject && form.grade && setStep(3)}
            disabled={!form.school || !form.subject || !form.grade}
            className="w-full bg-primary-500 text-white rounded-lg py-3 font-medium disabled:bg-gray-300 active:bg-primary-600 transition-colors"
          >
            Keyingisi →
          </button>
        </div>
      )}

      {/* Step 3: Topic & Images */}
      {step === 3 && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Mavzu *</label>
            <input
              type="text"
              name="topic"
              value={form.topic}
              onChange={handleChange}
              placeholder="Masalan: Kasr sonlar"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Rasmlar (ixtiyoriy, 5 tagacha)
            </label>
            <label className="block w-full border-2 border-dashed border-gray-300 rounded-lg p-4 text-center cursor-pointer hover:border-primary-500 transition-colors">
              <span className="text-gray-500">📷 Rasm yuklash</span>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageUpload}
                className="hidden"
              />
            </label>
            {images.length > 0 && (
              <div className="flex gap-2 mt-2 flex-wrap">
                {images.map((img, idx) => (
                  <div key={idx} className="relative">
                    <img
                      src={URL.createObjectURL(img)}
                      alt=""
                      className="w-16 h-16 object-cover rounded-lg"
                    />
                    <button
                      onClick={() => removeImage(idx)}
                      className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Summary */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-semibold mb-2">📋 Buyurtma ma'lumotlari:</h3>
            <div className="text-sm text-gray-600 space-y-1">
              <p><strong>F.I.Sh:</strong> {form.full_name}</p>
              <p><strong>Manzil:</strong> {form.address}</p>
              <p><strong>Maktab:</strong> {form.school}</p>
              <p><strong>Fan:</strong> {form.subject}</p>
              <p><strong>Sinf:</strong> {form.grade}</p>
              <p><strong>Mavzu:</strong> {form.topic}</p>
              {images.length > 0 && <p><strong>Rasmlar:</strong> {images.length} ta</p>}
            </div>
          </div>

          <button
            onClick={handleSubmit}
            disabled={!form.topic || submitting}
            className="w-full bg-primary-500 text-white rounded-lg py-3 font-medium disabled:bg-gray-300 active:bg-primary-600 transition-colors"
          >
            {submitting ? 'Yuborilmoqda...' : '✅ Buyurtma berish'}
          </button>
        </div>
      )}
    </div>
  )
}

export default OrderForm

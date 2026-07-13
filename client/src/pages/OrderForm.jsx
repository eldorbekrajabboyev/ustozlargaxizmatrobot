import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import axios from 'axios'

const REGIONS = [
  'Andijon viloyati', 'Buxoro viloyati', 'Jizzax viloyati',
  'Qashqadaryo viloyati', 'Navoiy viloyati', 'Namangan viloyati',
  'Samarqand viloyati', 'Sirdaryo viloyati', 'Surxondaryo viloyati',
  'Toshkent viloyati', "Farg'ona viloyati", 'Xorazm viloyati',
  'Toshkent shahri', "Qoraqalpog'iston Respublikasi"
]

const GRADES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]

function getSubjects(grade) {
  const g = parseInt(grade)
  if (g >= 1 && g <= 4) {
    return ['Ona tili', "O'qish", 'Matematika', 'Tabiiy fan', 'Tarbiya', 'Texnologiya', "Tasviriy san'at", 'Musiqa', 'Jismoniy tarbiya']
  } else if (g >= 5 && g <= 6) {
    return ['Ona tili', 'Adabiyot', "O'zbek tili", 'Matematika', 'Tabiiy fan', 'Informatika', 'Tarix', 'Tarbiya', 'Texnologiya', "Tasviriy san'at", 'Musiqa', 'Jismoniy tarbiya']
  } else if (g >= 7 && g <= 9) {
    return ['Ona tili', 'Adabiyot', 'Algebra', 'Geometriya', 'Fizika', 'Kimyo', 'Biologiya', 'Geografiya', "O'zbekiston tarixi", 'Jahon tarixi', 'Informatika', 'Tarbiya', "Davlat va huquq asoslari", 'Chizmachilik', 'Jismoniy tarbiya']
  } else if (g >= 10 && g <= 11) {
    return ['Ona tili', 'Adabiyot', 'Algebra', 'Geometriya', 'Fizika', 'Kimyo', 'Biologiya', 'Geografiya', "O'zbekiston tarixi", 'Jahon tarixi', 'Informatika', "Davlat va huquq asoslari", 'Tarbiya', 'Jismoniy tarbiya']
  }
  return []
}

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
    region: '',
    district: '',
    school: '',
    grade: '',
    subject: '',
    topic: '',
  })

  useEffect(() => {
    Promise.all([
      axios.get('/api/services'),
      axios.get('/api/user/active-cards'),
    ]).then(([servicesRes, cardsRes]) => {
      const svc = servicesRes.data.find(s => s.id == serviceId)
      setService(svc)
      setCards(cardsRes.data)
    }).catch(console.error)
    .finally(() => setLoading(false))
  }, [serviceId])

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
      const userRes = await axios.post('/api/users', {
        telegram_id: user.id,
        username: user.username,
        first_name: user.first_name,
        last_name: user.last_name,
      })

      const fullAddress = `${form.region}, ${form.district}`

      const orderRes = await axios.post('/api/orders', {
        user_id: userRes.data.id,
        service_id: serviceId,
        full_name: form.full_name,
        address: fullAddress,
        school: form.school,
        subject: form.subject,
        grade: form.grade,
        topic: form.topic,
      })

      if (images.length > 0) {
        const formData = new FormData()
        images.forEach(img => formData.append('images', img))
        await axios.post(`/api/orders/${orderRes.data.id}/images`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        })
      }

      navigate(`/order-detail/${orderRes.data.id}`)
    } catch (err) {
      console.error(err)
      alert("Xatolik yuz berdi. Qaytadan urinib ko'ring.")
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
    { num: 1, title: 'F.I.Sh' },
    { num: 2, title: 'Viloyat' },
    { num: 3, title: 'Tuman' },
    { num: 4, title: 'Maktab' },
    { num: 5, title: 'Sinf' },
    { num: 6, title: 'Fan' },
    { num: 7, title: 'Mavzu' },
  ]

  const canNext = () => {
    switch (step) {
      case 1: return form.full_name.trim()
      case 2: return form.region
      case 3: return form.district.trim()
      case 4: return form.school.trim()
      case 5: return form.grade
      case 6: return form.subject
      case 7: return form.topic.trim()
      default: return false
    }
  }

  const goNext = () => { if (canNext()) setStep(step + 1) }

  return (
    <div className="p-4">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <button
          onClick={() => step > 1 ? setStep(step - 1) : navigate(-1)}
          className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center text-lg"
        >
          ←
        </button>
        <div>
          <h1 className="text-xl font-bold">{service.name}</h1>
          <p className="text-primary-600 font-semibold">{service.price.toLocaleString()} so'm</p>
        </div>
      </div>

      {/* Progress */}
      <div className="flex gap-1 mb-6">
        {steps.map(s => (
          <div key={s.num} className="flex-1">
            <div className={`h-1 rounded-full ${step >= s.num ? 'bg-primary-500' : 'bg-gray-200'}`}></div>
          </div>
        ))}
      </div>

      {/* Step 1: Full Name */}
      {step === 1 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">To'liq F.I.Sh</h2>
          <input
            type="text"
            value={form.full_name}
            onChange={(e) => setForm({ ...form, full_name: e.target.value })}
            placeholder="Masalan: Karimov Valijon"
            className="w-full border border-gray-300 rounded-lg px-4 py-3 text-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            autoFocus
          />
          <button onClick={goNext} disabled={!canNext()}
            className="w-full bg-primary-500 text-white rounded-lg py-3 font-medium disabled:bg-gray-300 active:bg-primary-600 transition-colors">
            Keyingisi →
          </button>
        </div>
      )}

      {/* Step 2: Region */}
      {step === 2 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">📍 Viloyatni tanlang</h2>
          <div className="grid grid-cols-2 gap-2">
            {REGIONS.map(region => (
              <button
                key={region}
                onClick={() => setForm({ ...form, region })}
                className={`p-3 rounded-lg text-sm font-medium border-2 transition-all text-left ${
                  form.region === region
                    ? 'border-primary-500 bg-primary-50 text-primary-700'
                    : 'border-gray-200 bg-white text-gray-700 active:bg-gray-50'
                }`}
              >
                {region}
              </button>
            ))}
          </div>
          <button onClick={goNext} disabled={!canNext()}
            className="w-full bg-primary-500 text-white rounded-lg py-3 font-medium disabled:bg-gray-300 active:bg-primary-600 transition-colors">
            Keyingisi →
          </button>
        </div>
      )}

      {/* Step 3: District */}
      {step === 3 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">📍 Tuman / Shahar</h2>
          <p className="text-gray-500 text-sm">{form.region}</p>
          <input
            type="text"
            value={form.district}
            onChange={(e) => setForm({ ...form, district: e.target.value })}
            placeholder="Masalan: Chilonzor tumani"
            className="w-full border border-gray-300 rounded-lg px-4 py-3 text-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            autoFocus
          />
          <button onClick={goNext} disabled={!canNext()}
            className="w-full bg-primary-500 text-white rounded-lg py-3 font-medium disabled:bg-gray-300 active:bg-primary-600 transition-colors">
            Keyingisi →
          </button>
        </div>
      )}

      {/* Step 4: School */}
      {step === 4 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">🏫 Maktab nomi</h2>
          <p className="text-gray-500 text-sm">{form.region}, {form.district}</p>
          <input
            type="text"
            value={form.school}
            onChange={(e) => setForm({ ...form, school: e.target.value })}
            placeholder="Masalan: 1-maktab"
            className="w-full border border-gray-300 rounded-lg px-4 py-3 text-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            autoFocus
          />
          <button onClick={goNext} disabled={!canNext()}
            className="w-full bg-primary-500 text-white rounded-lg py-3 font-medium disabled:bg-gray-300 active:bg-primary-600 transition-colors">
            Keyingisi →
          </button>
        </div>
      )}

      {/* Step 5: Grade */}
      {step === 5 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">🎓 Nechinchi sinf?</h2>
          <div className="grid grid-cols-4 gap-2">
            {GRADES.map(g => (
              <button
                key={g}
                onClick={() => setForm({ ...form, grade: String(g), subject: '' })}
                className={`py-3 rounded-lg text-lg font-semibold border-2 transition-all ${
                  form.grade === String(g)
                    ? 'border-primary-500 bg-primary-50 text-primary-700'
                    : 'border-gray-200 bg-white text-gray-700 active:bg-gray-50'
                }`}
              >
                {g}
              </button>
            ))}
          </div>
          <button onClick={goNext} disabled={!canNext()}
            className="w-full bg-primary-500 text-white rounded-lg py-3 font-medium disabled:bg-gray-300 active:bg-primary-600 transition-colors">
            Keyingisi →
          </button>
        </div>
      )}

      {/* Step 6: Subject */}
      {step === 6 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">📚 Fan nomini tanlang</h2>
          <p className="text-gray-500 text-sm">{form.grade}-sinf</p>
          <div className="grid grid-cols-2 gap-2">
            {getSubjects(form.grade).map(subject => (
              <button
                key={subject}
                onClick={() => setForm({ ...form, subject })}
                className={`p-3 rounded-lg text-sm font-medium border-2 transition-all text-left ${
                  form.subject === subject
                    ? 'border-primary-500 bg-primary-50 text-primary-700'
                    : 'border-gray-200 bg-white text-gray-700 active:bg-gray-50'
                }`}
              >
                {subject}
              </button>
            ))}
          </div>
          <button onClick={goNext} disabled={!canNext()}
            className="w-full bg-primary-500 text-white rounded-lg py-3 font-medium disabled:bg-gray-300 active:bg-primary-600 transition-colors">
            Keyingisi →
          </button>
        </div>
      )}

      {/* Step 7: Topic & Images & Submit */}
      {step === 7 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">📖 Mavzu</h2>
          <input
            type="text"
            value={form.topic}
            onChange={(e) => setForm({ ...form, topic: e.target.value })}
            placeholder="Masalan: Kasr sonlar"
            className="w-full border border-gray-300 rounded-lg px-4 py-3 text-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            autoFocus
          />

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
              <p><strong>Manzil:</strong> {form.region}, {form.district}</p>
              <p><strong>Maktab:</strong> {form.school}</p>
              <p><strong>Sinf:</strong> {form.grade}-sinf</p>
              <p><strong>Fan:</strong> {form.subject}</p>
              <p><strong>Mavzu:</strong> {form.topic}</p>
              {images.length > 0 && <p><strong>Rasmlar:</strong> {images.length} ta</p>}
            </div>
          </div>

          <button
            onClick={handleSubmit}
            disabled={!form.topic.trim() || submitting}
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

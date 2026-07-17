import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import axios from 'axios'
import Header from '../components/Header'

const REGIONS = [
  'Andijon viloyati', 'Buxoro viloyati', 'Jizzax viloyati',
  'Qashqadaryo viloyati', 'Navoiy viloyati', 'Namangan viloyati',
  'Samarqand viloyati', 'Sirdaryo viloyati', 'Surxondaryo viloyati',
  'Toshkent viloyati', "Farg'ona viloyati", 'Xorazm viloyati',
  'Toshkent shahri', "Qoraqalpog'iston Respublikasi"
]

const GRADES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]

const SCHOOL_TYPES = [
  { id: 'uzbek', label: "O'zbek maktab", icon: '🇺🇿' },
  { id: 'russian', label: 'Rus maktab', icon: '🇷🇺' },
  { id: 'qoraqalpoq', label: "Qoraqalpoq maktab", icon: '🏛' },
]

function getLanguageSurcharge(schoolType, subject) {
  if (!schoolType || !subject) return 0
  const st = schoolType
  const sub = subject.toLowerCase()
  const isUzbek = sub === "o'zbek tili" || sub === 'ona tili' || sub === "o'qish"
  const isRussian = sub === 'rus tili'
  const isEnglish = sub === 'ingliz tili'
  if (st === 'uzbek') {
    if (isRussian || isEnglish) return 50000
    return 0
  }
  if (st === 'russian') {
    if (isUzbek) return 0
    if (isEnglish) return 60000
    return 50000
  }
  if (st === 'qoraqalpoq') {
    if (isUzbek) return 0
    if (isRussian || isEnglish) return 60000
    return 50000
  }
  return 0
}

function getSubjects(grade) {
  const g = parseInt(grade)
  if (g >= 1 && g <= 4) {
    return ['Ona tili', "O'qish", 'Matematika', 'Tabiiy fan', 'Tarbiya', 'Texnologiya', "Tasviriy san'at", 'Musiqa', 'Jismoniy tarbiya', 'Ingliz tili']
  } else if (g >= 5 && g <= 6) {
    return ['Ona tili', 'Adabiyot', "O'zbek tili", 'Matematika', 'Tabiiy fan', 'Informatika', 'Tarix', 'Tarbiya', 'Texnologiya', "Tasviriy san'at", 'Musiqa', 'Jismoniy tarbiya', 'Rus tili', 'Ingliz tili']
  } else if (g >= 7 && g <= 9) {
    return ['Ona tili', 'Adabiyot', 'Algebra', 'Geometriya', 'Fizika', 'Kimyo', 'Biologiya', 'Geografiya', "O'zbekiston tarixi", 'Jahon tarixi', 'Informatika', 'Tarbiya', "Davlat va huquq asoslari", 'Chizmachilik', 'Jismoniy tarbiya', 'Rus tili', 'Ingliz tili']
  } else if (g >= 10 && g <= 11) {
    return ['Ona tili', 'Adabiyot', 'Algebra', 'Geometriya', 'Fizika', 'Kimyo', 'Biologiya', 'Geografiya', "O'zbekiston tarixi", 'Jahon tarixi', 'Informatika', "Davlat va huquq asoslari", 'Tarbiya', 'Jismoniy tarbiya', 'Rus tili', 'Ingliz tili']
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
    school_type: '',
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
        school_type: form.school_type,
        subject: form.subject,
        grade: form.grade,
        topic: form.topic,
        language_surcharge: getLanguageSurcharge(form.school_type, form.subject),
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
      <div className="animate-fade-in">
        <Header title="Buyurtma" />
        <div className="p-4 flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary-500 border-t-transparent"></div>
        </div>
      </div>
    )
  }

  if (!service) {
    return (
      <div className="animate-fade-in">
        <Header title="Buyurtma" />
        <div className="p-4 text-center py-16 text-tg-hint">
          <p className="text-4xl mb-2">🔍</p>
          <p>Xizmat topilmadi</p>
        </div>
      </div>
    )
  }

  const langSurcharge = getLanguageSurcharge(form.school_type, form.subject)
  const totalPrice = (service ? service.price : 0) + langSurcharge

  const steps = [
    { num: 1, title: 'F.I.Sh' },
    { num: 2, title: 'Viloyat' },
    { num: 3, title: 'Tuman' },
    { num: 4, title: 'Maktab' },
    { num: 5, title: 'Maktab turi' },
    { num: 6, title: 'Sinf' },
    { num: 7, title: 'Fan' },
    { num: 8, title: 'Mavzu' },
  ]

  const canNext = () => {
    switch (step) {
      case 1: return form.full_name.trim()
      case 2: return form.region
      case 3: return form.district.trim()
      case 4: return form.school.trim()
      case 5: return form.school_type
      case 6: return form.grade
      case 7: return form.subject
      case 8: return form.topic.trim()
      default: return false
    }
  }

  const goNext = () => { if (canNext()) setStep(step + 1) }

  return (
    <div className="animate-fade-in min-h-screen">
      <Header
        title={service.name}
        subtitle={langSurcharge > 0
          ? `${totalPrice.toLocaleString()} so'm (+${langSurcharge.toLocaleString()} til uchun)`
          : `${totalPrice.toLocaleString()} so'm`}
        onBack={() => step > 1 ? setStep(step - 1) : navigate(-1)}
      />

      <div className="p-4 space-y-3">
        {/* Progress */}
        <div className="flex gap-1.5 mb-2">
          {steps.map(s => (
            <div key={s.num} className="flex-1">
              <div className={`h-1.5 rounded-full transition-colors ${step >= s.num ? 'bg-primary-500' : 'bg-black/5'}`}></div>
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
            className="w-full border border-black/10 rounded-2xl px-4 py-3.5 text-lg bg-tg-secondary focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
            autoFocus
          />
          <button onClick={goNext} disabled={!canNext()}
            className="w-full bg-primary-600 text-white rounded-2xl py-3.5 font-medium disabled:bg-black/10 disabled:text-tg-hint active:bg-primary-700 transition-colors">
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
                    : '                  border-gray-200 bg-tg-secondary text-tg-text active:bg-black/5'
                }`}
              >
                {region}
              </button>
            ))}
          </div>
          <button onClick={goNext} disabled={!canNext()}
            className="w-full bg-primary-600 text-white rounded-2xl py-3.5 font-medium disabled:bg-black/10 disabled:text-tg-hint active:bg-primary-700 transition-colors">
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
            className="w-full border border-black/10 rounded-2xl px-4 py-3.5 text-lg bg-tg-secondary focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
            autoFocus
          />
          <button onClick={goNext} disabled={!canNext()}
            className="w-full bg-primary-600 text-white rounded-2xl py-3.5 font-medium disabled:bg-black/10 disabled:text-tg-hint active:bg-primary-700 transition-colors">
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
            className="w-full border border-black/10 rounded-2xl px-4 py-3.5 text-lg bg-tg-secondary focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
            autoFocus
          />
          <button onClick={goNext} disabled={!canNext()}
            className="w-full bg-primary-600 text-white rounded-2xl py-3.5 font-medium disabled:bg-black/10 disabled:text-tg-hint active:bg-primary-700 transition-colors">
            Keyingisi →
          </button>
        </div>
      )}

      {/* Step 5: School Type */}
      {step === 5 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">🏫 Qaysi turdagi maktab?</h2>
          <div className="space-y-2">
            {SCHOOL_TYPES.map(st => (
              <button
                key={st.id}
                onClick={() => setForm({ ...form, school_type: st.id })}
                className={`w-full p-4 rounded-2xl text-left font-medium border-2 transition-all flex items-center gap-3 ${
                  form.school_type === st.id
                    ? 'border-primary-500 bg-primary-50 text-primary-700'
                    : 'border-gray-200 bg-tg-secondary text-tg-text active:bg-black/5'
                }`}
              >
                <span className="text-2xl">{st.icon}</span>
                <span className="text-base">{st.label}</span>
              </button>
            ))}
          </div>
          <button onClick={goNext} disabled={!canNext()}
            className="w-full bg-primary-600 text-white rounded-2xl py-3.5 font-medium disabled:bg-black/10 disabled:text-tg-hint active:bg-primary-700 transition-colors">
            Keyingisi →
          </button>
        </div>
      )}

      {/* Step 6: Grade */}
      {step === 6 && (
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
                    : '                  border-gray-200 bg-tg-secondary text-tg-text active:bg-black/5'
                }`}
              >
                {g}
              </button>
            ))}
          </div>
          <button onClick={goNext} disabled={!canNext()}
            className="w-full bg-primary-600 text-white rounded-2xl py-3.5 font-medium disabled:bg-black/10 disabled:text-tg-hint active:bg-primary-700 transition-colors">
            Keyingisi →
          </button>
        </div>
      )}

      {/* Step 7: Subject */}
      {step === 7 && (
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
                    : '                  border-gray-200 bg-tg-secondary text-tg-text active:bg-black/5'
                }`}
              >
                {subject}
              </button>
            ))}
          </div>
          <button onClick={goNext} disabled={!canNext()}
            className="w-full bg-primary-600 text-white rounded-2xl py-3.5 font-medium disabled:bg-black/10 disabled:text-tg-hint active:bg-primary-700 transition-colors">
            Keyingisi →
          </button>
        </div>
      )}

      {/* Step 8: Topic & Images & Submit */}
      {step === 8 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">📖 Mavzu</h2>
          <input
            type="text"
            value={form.topic}
            onChange={(e) => setForm({ ...form, topic: e.target.value })}
            placeholder="Masalan: Kasr sonlar"
            className="w-full border border-black/10 rounded-2xl px-4 py-3.5 text-lg bg-tg-secondary focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
            autoFocus
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Rasmlar (ixtiyoriy, 5 tagacha)
            </label>
              <label className="block w-full border-2 border-dashed border-primary-300 rounded-2xl p-4 text-center cursor-pointer hover:border-primary-500 transition-colors">
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
            <div className="bg-tg-secondary rounded-2xl p-4 border border-black/5">
            <h3 className="font-semibold mb-2">📋 Buyurtma ma'lumotlari:</h3>
            <div className="text-sm text-gray-600 space-y-1">
              <p className="break-words"><strong>F.I.Sh:</strong> {form.full_name}</p>
              <p className="break-words"><strong>Manzil:</strong> {form.region}, {form.district}</p>
              <p className="break-words"><strong>Maktab:</strong> {form.school}</p>
              <p className="break-words"><strong>Maktab turi:</strong> {SCHOOL_TYPES.find(s => s.id === form.school_type)?.label || '—'}</p>
              <p><strong>Sinf:</strong> {form.grade}-sinf</p>
              <p><strong>Fan:</strong> {form.subject}</p>
              <p className="break-all"><strong>Mavzu:</strong> {form.topic}</p>
              {images.length > 0 && <p><strong>Rasmlar:</strong> {images.length} ta</p>}
              <div className="pt-2 mt-2 border-t border-black/10 space-y-1">
                <div className="flex justify-between text-sm text-gray-500">
                  <span>Xizmat narxi:</span>
                  <span>{service.price.toLocaleString()} so'm</span>
                </div>
                {langSurcharge > 0 && (
                  <div className="flex justify-between text-sm text-amber-600">
                    <span>Boshqa tilda yozish uchun:</span>
                    <span>+{langSurcharge.toLocaleString()} so'm</span>
                  </div>
                )}
                <div className="flex justify-between items-center pt-1 border-t border-black/10">
                  <span className="font-bold text-tg-text">Jami to'lov:</span>
                  <span className="font-bold text-primary-600 text-lg">{totalPrice.toLocaleString()} so'm</span>
                </div>
              </div>
            </div>
          </div>

          <button
            onClick={handleSubmit}
            disabled={!form.topic.trim() || submitting}
            className="w-full bg-primary-600 text-white rounded-2xl py-3.5 font-medium disabled:bg-black/10 disabled:text-tg-hint active:bg-primary-700 transition-colors"
          >
            {submitting ? 'Yuborilmoqda...' : '✅ Buyurtma berish'}
          </button>
        </div>
      )}
      </div>
    </div>
  )
}

export default OrderForm

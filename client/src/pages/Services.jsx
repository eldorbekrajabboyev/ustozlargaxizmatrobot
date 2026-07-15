import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import Header from '../components/Header'

function Services({ user }) {
  const navigate = useNavigate()
  const [services, setServices] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    axios.get('/api/services')
      .then(res => setServices(res.data.filter(s => s.is_active)))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="animate-fade-in">
        <Header title="Xizmatlar" />
        <div className="p-4 flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary-500 border-t-transparent"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="animate-fade-in min-h-screen">
      <Header title="Xizmatlar" subtitle="Metodik hujjat turlari" />

      <div className="p-4 space-y-3">
        {services.map(service => (
          <button
            key={service.id}
            onClick={() => navigate(`/order/${service.id}`)}
            className="w-full text-left bg-tg-secondary rounded-2xl p-4 shadow-card border border-black/5 active:scale-[0.99] transition-transform"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h3 className="font-semibold text-lg text-tg-text">{service.name}</h3>
                {service.description && (
                  <p className="text-tg-hint text-sm mt-1 leading-snug">{service.description}</p>
                )}
              </div>
              <div className="shrink-0 w-11 h-11 rounded-xl bg-primary-50 text-primary-600 flex items-center justify-center text-xl">
                📄
              </div>
            </div>
            <div className="flex items-center justify-between mt-4 pt-3 border-t border-black/5">
              <p className="text-primary-600 font-bold text-xl">
                {service.price.toLocaleString()} <span className="text-sm font-medium">so'm</span>
              </p>
              <span className="text-sm font-medium text-primary-600 bg-primary-50 px-3 py-1.5 rounded-lg">
                Tanlash →
              </span>
            </div>
          </button>
        ))}

        {services.length === 0 && (
          <div className="text-center py-16 text-tg-hint">
            <p className="text-5xl mb-3">📭</p>
            <p>Hozircha xizmatlar mavjud emas</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default Services

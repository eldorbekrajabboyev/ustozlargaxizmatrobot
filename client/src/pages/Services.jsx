import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'

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
      <div className="p-4 flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
      </div>
    )
  }

  return (
    <div className="p-4">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => navigate('/')}
          className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center"
        >
          ←
        </button>
        <h1 className="text-xl font-bold">Xizmatlar</h1>
      </div>

      {/* Services List */}
      <div className="space-y-3">
        {services.map(service => (
          <div
            key={service.id}
            className="bg-white rounded-xl p-4 shadow-sm border border-gray-100"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="font-semibold text-lg text-gray-800">{service.name}</h3>
                {service.description && (
                  <p className="text-gray-500 text-sm mt-1">{service.description}</p>
                )}
                <p className="text-primary-600 font-bold text-xl mt-2">
                  {service.price.toLocaleString()} so'm
                </p>
              </div>
            </div>
            <button
              onClick={() => navigate(`/order/${service.id}`)}
              className="w-full mt-3 bg-primary-500 text-white rounded-lg py-2 font-medium active:bg-primary-600 transition-colors"
            >
              Buyurtma berish
            </button>
          </div>
        ))}
      </div>

      {services.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <p className="text-4xl mb-2">📭</p>
          <p>Hozircha xizmatlar mavjud emas</p>
        </div>
      )}
    </div>
  )
}

export default Services

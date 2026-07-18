import { useState, useEffect } from 'react'
import api from '../api/api'

function Services() {
  const [services, setServices] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState({ name: '', description: '', price: '' })

  useEffect(() => {
    fetchServices()
  }, [])

  const fetchServices = () => {
    setLoading(true)
    api.get('/api/services')
      .then(res => setServices(res.data))
      .catch(console.error)
      .finally(() => setLoading(false))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      if (editing) {
        await api.put(`/api/services/${editing.id}`, { ...form, is_active: editing.is_active })
      } else {
        await api.post('/api/services', form)
      }
      setShowForm(false)
      setEditing(null)
      setForm({ name: '', description: '', price: '' })
      fetchServices()
    } catch (err) {
      alert('Xatolik')
    }
  }

  const handleEdit = (service) => {
    setEditing(service)
    setForm({ name: service.name, description: service.description || '', price: service.price })
    setShowForm(true)
  }

  const handleDelete = async (id) => {
    if (!confirm('O\'chirishni xohlaysizmi?')) return
    try {
      await api.delete(`/api/services/${id}`)
      fetchServices()
    } catch (err) {
      alert('Xatolik')
    }
  }

  const toggleActive = async (service) => {
    try {
      await api.put(`/api/services/${service.id}`, {
        ...service,
        is_active: service.is_active ? 0 : 1,
      })
      fetchServices()
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

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Xizmatlar</h1>
        <button
          onClick={() => { setShowForm(true); setEditing(null); setForm({ name: '', description: '', price: '' }) }}
          className="bg-primary-500 text-white px-4 py-2 rounded-lg hover:bg-primary-600 transition-colors"
        >
          + Yangi xizmat
        </button>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">{editing ? 'Tahrirlash' : 'Yangi xizmat'}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nomi</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tavsif</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  rows={3}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Narx (so'm)</label>
                <input
                  type="number"
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  required
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="submit"
                  className="flex-1 bg-primary-500 text-white rounded-lg py-2 hover:bg-primary-600 transition-colors"
                >
                  {editing ? 'Saqlash' : "Qo'shish"}
                </button>
                <button
                  type="button"
                  onClick={() => { setShowForm(false); setEditing(null) }}
                  className="flex-1 bg-gray-100 text-gray-700 rounded-lg py-2 hover:bg-gray-200 transition-colors"
                >
                  Bekor qilish
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Services List */}
      <div className="grid grid-cols-2 gap-4">
        {services.map(service => (
          <div key={service.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-semibold text-lg">{service.name}</h3>
                {service.description && (
                  <p className="text-gray-500 text-sm mt-1">{service.description}</p>
                )}
                <p className="text-2xl font-bold text-primary-600 mt-2">
                  {service.price.toLocaleString()} so'm
                </p>
              </div>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                service.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
              }`}>
                {service.is_active ? 'Faol' : 'Nofaol'}
              </span>
            </div>
            <div className="flex gap-2 mt-4">
              <button
                onClick={() => toggleActive(service)}
                className="flex-1 bg-gray-100 text-gray-700 rounded-lg py-2 text-sm hover:bg-gray-200 transition-colors"
              >
                {service.is_active ? "O'chirish" : 'Yoqish'}
              </button>
              <button
                onClick={() => handleEdit(service)}
                className="flex-1 bg-blue-100 text-blue-700 rounded-lg py-2 text-sm hover:bg-blue-200 transition-colors"
              >
                Tahrirlash
              </button>
              <button
                onClick={() => handleDelete(service.id)}
                className="bg-red-100 text-red-700 rounded-lg py-2 px-3 text-sm hover:bg-red-200 transition-colors"
              >
                🗑
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default Services

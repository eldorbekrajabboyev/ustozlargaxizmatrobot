import { useState, useEffect } from 'react'
import api from '../api/api'

export default function PromoCodes() {
  const [codes, setCodes] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ code: '', discount_percent: 10, source_name: '', max_uses: 0 })
  const [saving, setSaving] = useState(false)

  useEffect(() => { load() }, [])

  const load = async () => {
    try {
      const res = await api.get('/api/promo-codes')
      setCodes(res.data)
    } catch (e) { console.error(e) }
    setLoading(false)
  }

  const create = async () => {
    if (!form.code.trim() || !form.discount_percent) return
    setSaving(true)
    try {
      await api.post('/api/promo-codes', form)
      setForm({ code: '', discount_percent: 10, source_name: '', max_uses: 0 })
      setShowForm(false)
      load()
    } catch (e) { alert(e.response?.data?.error || 'Xatolik') }
    setSaving(false)
  }

  const toggle = async (id, isActive) => {
    try {
      await api.put(`/api/promo-codes/${id}`, { is_active: isActive ? 0 : 1 })
      load()
    } catch (e) { alert(e.response?.data?.error || 'Xatolik') }
  }

  const remove = async (id) => {
    if (!confirm('O\'chirishni xohlaysizmi?')) return
    try {
      await api.delete(`/api/promo-codes/${id}`)
      load()
    } catch (e) { alert(e.response?.data?.error || 'Xatolik') }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold dark:text-white">Promo-kodlar</h1>
        <button onClick={() => setShowForm(!showForm)} className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700">
          + Yangi promo-kod
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-xl p-6 shadow mb-6 space-y-4 dark:bg-gray-800">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Kod</label>
              <input type="text" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                placeholder="MASalan: OQITUVCHI" className="w-full border rounded-lg px-3 py-2 uppercase dark:border-gray-600 dark:bg-gray-900 dark:text-gray-200" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Chegirma %</label>
              <input type="number" min="1" max="100" value={form.discount_percent} onChange={(e) => setForm({ ...form, discount_percent: parseInt(e.target.value) || 0 })}
                className="w-full border rounded-lg px-3 py-2 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-200" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Manba nomi (kanal/grupp)</label>
              <input type="text" value={form.source_name} onChange={(e) => setForm({ ...form, source_name: e.target.value })}
                placeholder="Masalan: O'qituvchilar TV" className="w-full border rounded-lg px-3 py-2 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-200" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Maksimal ishlatish (0 = cheksiz)</label>
              <input type="number" min="0" value={form.max_uses} onChange={(e) => setForm({ ...form, max_uses: parseInt(e.target.value) || 0 })}
                className="w-full border rounded-lg px-3 py-2 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-200" />
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={create} disabled={saving} className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50">
              {saving ? 'Saqlanmoqda...' : 'Yaratish'}
            </button>
            <button onClick={() => setShowForm(false)} className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600">Bekor qilish</button>
          </div>
        </div>
      )}

      {loading ? <p>Yuklanmoqda...</p> : codes.length === 0 ? (
        <p className="text-gray-500 dark:text-gray-400">Promo-kodlar yo'q</p>
      ) : (
        <div className="bg-white rounded-xl shadow overflow-hidden dark:bg-gray-800">
          <table className="w-full">
            <thead className="bg-gray-50 border-b dark:bg-gray-900">
              <tr>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-500 dark:text-gray-300">Kod</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-500 dark:text-gray-300">Chegirma</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-500 dark:text-gray-300">Manba</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-500 dark:text-gray-300">Ishlatilgan</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-500 dark:text-gray-300">Holat</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-500 dark:text-gray-300">Amallar</th>
              </tr>
            </thead>
            <tbody className="divide-y dark:divide-gray-700/50">
              {codes.map(c => (
                <tr key={c.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <td className="px-4 py-3 font-mono font-bold dark:text-white">{c.code}</td>
                  <td className="px-4 py-3">{c.discount_percent}%</td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{c.source_name || '—'}</td>
                  <td className="px-4 py-3">
                    {c.used_count} {c.max_uses > 0 ? `/ ${c.max_uses}` : ''}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${c.is_active ? 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300' : 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300'}`}>
                      {c.is_active ? 'Faol' : 'Faol emas'}
                    </span>
                  </td>
                  <td className="px-4 py-3 space-x-2">
                    <button onClick={() => toggle(c.id, c.is_active)} className={`text-sm px-3 py-1 rounded ${c.is_active ? 'bg-red-100 text-red-600 hover:bg-red-200 dark:bg-red-900/50 dark:text-red-300 dark:hover:bg-red-800/50' : 'bg-green-100 text-green-600 hover:bg-green-200 dark:bg-green-900/50 dark:text-green-300 dark:hover:bg-green-800/50'}`}>
                      {c.is_active ? 'O\'chirish' : 'Yoqish'}
                    </button>
                    <button onClick={() => remove(c.id)} className="text-sm px-3 py-1 rounded bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700/50 dark:text-gray-300 dark:hover:bg-gray-600/50">
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

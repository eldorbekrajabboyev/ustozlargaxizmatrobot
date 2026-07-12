import { useState, useEffect } from 'react'
import axios from 'axios'

function Settings() {
  const [settings, setSettings] = useState({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    axios.get('/api/settings')
      .then(res => setSettings(res.data))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const handleChange = (key, value) => {
    setSettings({ ...settings, [key]: value })
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      await axios.put('/api/settings', settings)
      alert('Saqlandi!')
    } catch (err) {
      alert('Xatolik')
    } finally {
      setSaving(false)
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
      <h1 className="text-2xl font-bold mb-6">Sozlamalar</h1>

      <div className="max-w-2xl">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-6">
          {/* Bot Token */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              🤖 Bot Token
            </label>
            <input
              type="password"
              value={settings.bot_token || ''}
              onChange={(e) => handleChange('bot_token', e.target.value)}
              placeholder="123456789:ABCdefGHIjklMNOpqrsTUVwxyz"
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
            <p className="text-xs text-gray-500 mt-1">
              BotFather dan olingan token
            </p>
          </div>

          {/* Admin Chat ID */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              👑 Admin Telegram ID
            </label>
            <input
              type="text"
              value={settings.admin_chat_id || ''}
              onChange={(e) => handleChange('admin_chat_id', e.target.value)}
              placeholder="123456789"
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
            <p className="text-xs text-gray-500 mt-1">
              Botdan foydalanuvchi sifatida /start yuboring va ID ni kiriting
            </p>
          </div>

          {/* Min Prep Time */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              ⏰ Minimal tayyorlash vaqti (soat)
            </label>
            <input
              type="number"
              value={settings.min_prep_time_hours || '6'}
              onChange={(e) => handleChange('min_prep_time_hours', e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>

          {/* Payment Instructions */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              💳 To'lov ko'rsatmalari
            </label>
            <textarea
              value={settings.payment_instructions || ''}
              onChange={(e) => handleChange('payment_instructions', e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              rows={4}
              placeholder="To'lov haqida ko'rsatmalar..."
            />
            <p className="text-xs text-gray-500 mt-1">
              Foydalanuvchilarga ko'rsatiladigan to'lov yo'riqnomasi
            </p>
          </div>

          {/* Save Button */}
          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full bg-primary-500 text-white rounded-lg py-3 font-medium hover:bg-primary-600 transition-colors disabled:opacity-50"
          >
            {saving ? 'Saqlanmoqda...' : '💾 Saqlash'}
          </button>
        </div>

        {/* Help */}
        <div className="bg-yellow-50 rounded-xl p-4 mt-6">
          <h3 className="font-semibold text-yellow-800 mb-2">ℹ️ Yordam</h3>
          <div className="text-sm text-yellow-700 space-y-2">
            <p><strong>Bot Token:</strong> @BotFather dan /newproduct buyrug'i orqali olingan token.</p>
            <p><strong>Admin Chat ID:</strong> Botga /start yuborganingizdan so'ng, @userinfobot dan ID ni olishingiz mumkin.</p>
            <p><strong>HTTPS:</strong> MiniApp ishlashi uchun HTTPS kerak. Render.com, Railway.app kabi xizmatlardan foydalaning.</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Settings

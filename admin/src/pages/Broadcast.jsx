import { useState } from 'react'
import axios from 'axios'

function Broadcast() {
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [result, setResult] = useState(null)

  const handleSend = async () => {
    if (!message.trim()) return alert('Xabar bo\'sh bo\'lmasligi kerak')
    if (!confirm('Xabar barcha foydalanuvchilarga yuborilishini xohlaysizmi?')) return
    setSending(true)
    setResult(null)
    try {
      const res = await axios.post('/api/broadcast', { message })
      setResult(res.data)
      if (res.data.failed === 0) setMessage('')
    } catch (err) {
      alert('Xatolik: ' + (err.response?.data?.error || err.message))
    } finally {
      setSending(false)
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Xabar yuborish</h1>

      <div className="max-w-2xl">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Xabar matni</label>
            <textarea
              value={message}
              onChange={e => setMessage(e.target.value)}
              rows={6}
              placeholder="Xabaringizni yozing... Markdown formatlash mumkin (*qalin*, _egri_, `kod`)"
              className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>

          <button
            onClick={handleSend}
            disabled={sending || !message.trim()}
            className="w-full bg-primary-500 text-white rounded-lg py-3 font-medium hover:bg-primary-600 transition-colors disabled:opacity-50"
          >
            {sending ? 'Yuborilmoqda...' : '📤 Barchaga yuborish'}
          </button>

          {result && (
            <div className={`rounded-lg p-4 ${result.failed > 0 ? 'bg-yellow-50 border border-yellow-200' : 'bg-green-50 border border-green-200'}`}>
              <p className="font-medium">{result.sent}/{result.total} ga yuborildi</p>
              {result.failed > 0 && <p className="text-sm text-yellow-700 mt-1">{result.failed} ta foydalanuvchiga yuborilmadi</p>}
            </div>
          )}
        </div>

        <div className="bg-blue-50 rounded-xl p-4 mt-6">
          <h3 className="font-semibold text-blue-800 mb-2">ℹ️ Yordam</h3>
          <div className="text-sm text-blue-700 space-y-1">
            <p>Xabar barcha ro'yxatdan o'tgan foydalanuvchilarga Telegram orqali yuboriladi.</p>
            <p>Markdown formatlashdan foydalanish mumkin: *qalin*, _egri_, `kod`.</p>
            <p>Eslatma: Telegram bot foydalanuvchi bilan birinchi marta suhbat boshlagan bo'lishi kerak.</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Broadcast

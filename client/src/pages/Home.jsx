import { useNavigate } from 'react-router-dom'

function Home({ user }) {
  const navigate = useNavigate()

  return (
    <div className="p-4">
      {/* Header */}
      <div className="text-center py-8">
        <div className="w-20 h-20 bg-primary-500 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-3xl">📚</span>
        </div>
        <h1 className="text-2xl font-bold text-gray-800">Metodikish</h1>
        <p className="text-gray-500 mt-2">Metodik hujjatlar tayyorlash xizmati</p>
      </div>

      {/* Welcome */}
      {user && (
        <div className="bg-white rounded-xl p-4 shadow-sm mb-4">
          <p className="text-gray-600">Assalomu alaykum,</p>
          <p className="font-semibold text-lg">{user.first_name || 'Foydalanuvchi'}</p>
        </div>
      )}

      {/* Services Preview */}
      <div className="space-y-3">
        <button
          onClick={() => navigate('/services')}
          className="w-full bg-primary-500 text-white rounded-xl p-4 shadow-sm flex items-center gap-3 active:bg-primary-600 transition-colors"
        >
          <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
            <span className="text-2xl">📝</span>
          </div>
          <div className="text-left">
            <p className="font-semibold text-lg">Buyurtma berish</p>
            <p className="text-white/80 text-sm">Metodik hujjat buyurtma qilish</p>
          </div>
        </button>

        <button
          onClick={() => navigate('/my-orders')}
          className="w-full bg-white text-gray-800 rounded-xl p-4 shadow-sm flex items-center gap-3 active:bg-gray-50 transition-colors"
        >
          <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
            <span className="text-2xl">📦</span>
          </div>
          <div className="text-left">
            <p className="font-semibold text-lg">Buyurtmalarim</p>
            <p className="text-gray-500 text-sm">Buyurtmalar holatini ko'rish</p>
          </div>
        </button>
      </div>

      {/* Info */}
      <div className="mt-6 bg-blue-50 rounded-xl p-4">
        <h3 className="font-semibold text-blue-800 mb-2">ℹ️ Ma'lumot</h3>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• Tayyorlash muddati: 5-6 soat</li>
          <li>• To'lov: Kartaga o'tkazma orqali</li>
          <li>• Natija: Bot orqali yuboriladi</li>
        </ul>
      </div>
    </div>
  )
}

export default Home

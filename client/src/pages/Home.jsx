import { useNavigate } from 'react-router-dom'

function StatPill({ icon, label, value }) {
  return (
    <div className="flex items-center gap-2 bg-white/15 rounded-xl px-3 py-2 backdrop-blur-sm">
      <span className="text-lg">{icon}</span>
      <div className="leading-tight">
        <p className="text-xs text-white/80">{label}</p>
        <p className="text-sm font-semibold text-white">{value}</p>
      </div>
    </div>
  )
}

function Home({ user }) {
  const navigate = useNavigate()
  const firstName = user?.first_name || 'Foydalanuvchi'

  const actions = [
    {
      key: 'order',
      title: 'Buyurtma berish',
      desc: 'Metodik hujjat buyurtma qilish',
      icon: '📝',
      onClick: () => navigate('/services'),
      accent: 'bg-primary-600',
      iconBg: 'bg-white/20',
    },
    {
      key: 'orders',
      title: 'Buyurtmalarim',
      desc: 'Buyurtmalar holatini kuzatish',
      icon: '📦',
      onClick: () => navigate('/my-orders'),
      accent: 'bg-tg-secondary text-tg-text border border-black/5',
      iconBg: 'bg-primary-50 text-primary-600',
      dark: true,
    },
  ]

  return (
    <div className="animate-fade-in">
      {/* Hero */}
      <div className="relative overflow-hidden bg-gradient-to-br from-primary-500 via-primary-600 to-indigo-700 px-5 pt-10 pb-7 text-white">
        <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-white/10" />
        <div className="absolute bottom-[-20px] left-[-20px] w-28 h-28 rounded-full bg-white/5" />
        <div className="relative">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center text-3xl backdrop-blur-sm">
              📚
            </div>
            <div>
              <h1 className="text-2xl font-bold leading-tight">Metodikish</h1>
              <p className="text-sm text-white/80">Metodik hujjatlar tayyorlash</p>
            </div>
          </div>
          <p className="text-white/90 mb-4">
            Assalomu alaykum, <span className="font-semibold">{firstName}</span>! 🎓
          </p>
          <div className="flex gap-2 flex-wrap">
            <StatPill icon="⏱" label="Tayyorlash" value="5–6 soat" />
            <StatPill icon="💳" label="To'lov" value="Karta orqali" />
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="px-4 -mt-4 relative space-y-3">
        {actions.map(a => (
          <button
            key={a.key}
            onClick={a.onClick}
            className={`w-full rounded-2xl p-4 shadow-card flex items-center gap-4 text-left active:scale-[0.99] transition-transform ${a.accent}`}
          >
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl shrink-0 ${a.iconBg}`}>
              {a.icon}
            </div>
            <div className="flex-1">
              <p className="font-semibold text-lg">{a.title}</p>
              <p className={`text-sm ${a.dark ? 'text-tg-hint' : 'text-white/80'}`}>{a.desc}</p>
            </div>
            <span className={`text-xl ${a.dark ? 'text-tg-hint' : 'text-white/70'}`}>›</span>
          </button>
        ))}
      </div>

      {/* Info */}
      <div className="px-4 mt-4">
        <div className="bg-tg-secondary rounded-2xl p-4 border border-black/5">
          <h3 className="font-semibold text-tg-text mb-2 flex items-center gap-2">
            <span>💡</span> Qanday ishlaydi?
          </h3>
          <ol className="text-sm text-tg-hint space-y-1.5 list-decimal list-inside">
            <li>Xizmatni tanlang va buyurtma bering</li>
            <li>To'lovni amalga oshiring va chekni yuklang</li>
            <li>Admin tasdiqlagach, hujjat tayyor bo'ladi</li>
            <li>Natija bot orqali sizga yuboriladi</li>
          </ol>
        </div>
      </div>
    </div>
  )
}

export default Home

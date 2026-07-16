import { useNavigate } from 'react-router-dom'

function Home({ user }) {
  const navigate = useNavigate()

  return (
    <div className="animate-fade-in">
      {/* Hero */}
      <div className="relative overflow-hidden bg-gradient-to-br from-primary-600 via-primary-700 to-indigo-900 px-5 pt-10 pb-8 text-white text-center">
        <div className="absolute -top-16 -right-16 w-48 h-48 rounded-full bg-white/5" />
        <div className="absolute bottom-[-30px] left-[-30px] w-36 h-36 rounded-full bg-white/5" />
        <div className="relative">
          <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center text-3xl mx-auto mb-4 backdrop-blur-sm">
            📘
          </div>
          <h1 className="text-2xl font-bold">Metodikish</h1>
          <p className="text-white/80 mt-1 text-sm">Metodik ishlar tayyorlash va ommalashtirish xizmati</p>
          <button
            onClick={() => navigate('/services')}
            className="mt-5 bg-white text-primary-700 font-semibold px-6 py-3 rounded-2xl text-sm active:scale-95 transition-transform shadow-lg"
          >
            Buyurtma berish →
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="px-4 -mt-5 relative">
        <div className="bg-tg-secondary rounded-2xl p-4 shadow-card border border-black/5 grid grid-cols-3 gap-3 text-center">
          <div>
            <p className="text-2xl font-bold text-primary-600">1050+</p>
            <p className="text-[11px] text-tg-hint mt-0.5">Tugatilgan ishlar</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-emerald-600">98%</p>
            <p className="text-[11px] text-tg-hint mt-0.5">Ommalashgan</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-amber-600">4 yil</p>
            <p className="text-[11px] text-tg-hint mt-0.5">Tajriba</p>
          </div>
        </div>
      </div>

      {/* Why section */}
      <div className="px-4 mt-5">
        <h2 className="text-lg font-bold text-tg-text mb-3">Nega ommalashtirish kerak?</h2>
        <div className="space-y-2.5">
          {[
            { icon: '💰', text: 'Malaka toifangiz oshadi — oyligingiz sezilarli ko\'tariladi' },
            { icon: '📜', text: 'Sertifikat va guvohnoma olasiz — attestatsiyada katta ustunlik' },
            { icon: '🏆', text: 'Ilg\'or ustoz sifatida mukofot va rag\'bat pullari olish imkoniyati' },
            { icon: '📈', text: 'Obro\' oshadi — yuqori lavozim va qo\'shimcha daromad eshigi ochiladi' },
          ].map((item, i) => (
            <div key={i} className="flex items-start gap-3 bg-tg-secondary rounded-xl p-3 border border-black/5">
              <span className="text-xl shrink-0">{item.icon}</span>
              <p className="text-sm text-tg-text leading-snug">{item.text}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Pain points */}
      <div className="px-4 mt-5">
        <h2 className="text-lg font-bold text-tg-text mb-3">Tanish muammolar</h2>
        <div className="bg-rose-50 rounded-2xl p-4 border border-rose-100 space-y-2">
          {[
            '⏳ Metodik ish juda ko\'p vaqt oladi',
            '📄 Yoziladi — lekin qaytariladi',
            '🚫 Antiplagiatdan o\'tmay qoladi',
            '😓 Ball va ustama cho\'zilib ketadi',
          ].map((t, i) => (
            <p key={i} className="text-sm text-rose-700">{t}</p>
          ))}
        </div>
        <p className="text-sm text-tg-hint mt-2 text-center">Agar tanish bo'lsa — siz yolg'iz emassiz.</p>
      </div>

      {/* What we do */}
      <div className="px-4 mt-5">
        <h2 className="text-lg font-bold text-tg-text mb-3">Biz nima qilamiz?</h2>
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-tg-secondary rounded-2xl p-4 border border-black/5 text-center">
            <span className="text-3xl">📘</span>
            <p className="text-sm font-semibold text-tg-text mt-2">Metodik qo'llanma</p>
          </div>
          <div className="bg-tg-secondary rounded-2xl p-4 border border-black/5 text-center">
            <span className="text-3xl">📗</span>
            <p className="text-sm font-semibold text-tg-text mt-2">Metodik tavsiya</p>
          </div>
        </div>
        <div className="mt-3 bg-tg-secondary rounded-2xl p-4 border border-black/5">
          <p className="text-xs font-semibold text-tg-hint uppercase mb-2">Ommalashish darajalari:</p>
          <div className="flex flex-wrap gap-2">
            {['🏫 Maktab — 135 ta', '📍 Tuman — 825 ta', '🏢 Viloyat — 76 ta', '🇺🇿 Respublika — 25 ta'].map((s, i) => (
              <span key={i} className="text-xs bg-primary-50 text-primary-700 px-2.5 py-1 rounded-lg">{s}</span>
            ))}
          </div>
        </div>
      </div>

      {/* Quality */}
      <div className="px-4 mt-5">
        <h2 className="text-lg font-bold text-tg-text mb-3">Sifat kafolati</h2>
        <div className="bg-tg-secondary rounded-2xl p-4 border border-black/5 space-y-2">
          {[
            '📑 Hajmi: 25–30+ bet',
            '💡 Yangi interfaol metodlar',
            '📚 5E moduli asosida yondashuv',
            '💻 AKTdan foydalanish yo\'llari',
            '🌏 Singapur ta\'lim tizimi tajribasi',
            '🔬 Tadqiqotchilik ko\'nikmalarini rivojlantirish',
            '📊 Jadval va grafiklardan foydalanish',
            '🛡️ Antiplagiat: 90%+ natija',
          ].map((t, i) => (
            <p key={i} className="text-sm text-tg-text">{t}</p>
          ))}
        </div>
      </div>

      {/* Trust */}
      <div className="px-4 mt-5">
        <h2 className="text-lg font-bold text-tg-text mb-3">Nega bizga ishonishadi?</h2>
        <div className="grid grid-cols-3 gap-2">
          {[
            { val: '4 yil', label: 'Tajriba' },
            { val: '1050+', label: 'Buyurtma' },
            { val: '98%', label: 'Ommalashdi' },
          ].map((s, i) => (
            <div key={i} className="bg-emerald-50 rounded-xl p-3 text-center border border-emerald-100">
              <p className="text-lg font-bold text-emerald-700">{s.val}</p>
              <p className="text-[11px] text-emerald-600 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Who is it for */}
      <div className="px-4 mt-5">
        <h2 className="text-lg font-bold text-tg-text mb-3">Kimlar uchun?</h2>
        <div className="space-y-2">
          {[
            { icon: '⏰', text: 'Vaqti yo\'q, lekin ball kerak bo\'lgan ustozlar' },
            { icon: '🔁', text: 'Oldin yozib, qaytarilgan ish egalari' },
            { icon: '📈', text: 'Attestatsiya yoki ustama uchun tayyorgarlik ko\'rayotganlar' },
          ].map((item, i) => (
            <div key={i} className="flex items-center gap-3 bg-tg-secondary rounded-xl p-3 border border-black/5">
              <span className="text-xl">{item.icon}</span>
              <p className="text-sm text-tg-text">{item.text}</p>
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div className="px-4 mt-6 mb-24">
        <div className="bg-gradient-to-br from-primary-600 to-indigo-700 rounded-2xl p-5 text-center text-white">
          <p className="text-lg font-bold">Tayyor bo'lsangiz — boshlang!</p>
          <p className="text-white/80 text-sm mt-1">Sifatga mos narx. Ishonch. Natija.</p>
          <button
            onClick={() => navigate('/services')}
            className="mt-4 bg-white text-primary-700 font-semibold px-8 py-3 rounded-2xl text-sm active:scale-95 transition-transform shadow-lg"
          >
            Xizmatlarni ko'rish →
          </button>
        </div>
      </div>
    </div>
  )
}

export default Home

import { useNavigate } from 'react-router-dom'
import { useEffect, useRef, useState } from 'react'

/* ── animated counter ── */
function Counter({ to, suffix = '' }) {
  const [val, setVal] = useState(0)
  useEffect(() => {
    let start = 0
    const end = parseInt(to)
    const dur = 1200
    const step = dur / end
    const t = setInterval(() => {
      start += Math.ceil(end / 60)
      if (start >= end) { setVal(end); clearInterval(t) }
      else setVal(start)
    }, step)
    return () => clearInterval(t)
  }, [to])
  return <>{val}{suffix}</>
}

/* ── floating orb ── */
function Orb({ style }) {
  return (
    <div
      className="absolute rounded-full pointer-events-none"
      style={{
        background: 'radial-gradient(circle, rgba(255,255,255,0.18) 0%, transparent 70%)',
        animation: 'floatOrb 6s ease-in-out infinite',
        ...style,
      }}
    />
  )
}

/* ── section wrapper with slide-up ── */
function Section({ children, delay = 0, className = '' }) {
  const ref = useRef()
  const [vis, setVis] = useState(false)
  useEffect(() => {
    const t = setTimeout(() => setVis(true), delay)
    return () => clearTimeout(t)
  }, [delay])
  return (
    <div
      ref={ref}
      className={`px-4 transition-all duration-700 ${vis ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'} ${className}`}
    >
      {children}
    </div>
  )
}

export default function Home({ user }) {
  const navigate = useNavigate()

  return (
    <>
      <style>{`
        @keyframes floatOrb {
          0%,100% { transform: translateY(0) scale(1); }
          50% { transform: translateY(-18px) scale(1.08); }
        }
        @keyframes shimmer {
          0% { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        @keyframes pulseRing {
          0%,100% { box-shadow: 0 0 0 0 rgba(99,102,241,0.5); }
          50% { box-shadow: 0 0 0 14px rgba(99,102,241,0); }
        }
        @keyframes spin3d {
          0%   { transform: rotateY(0deg) rotateX(8deg); }
          100% { transform: rotateY(360deg) rotateX(8deg); }
        }
        @keyframes badgePop {
          0%   { transform: scale(0.7); opacity: 0; }
          70%  { transform: scale(1.1); }
          100% { transform: scale(1); opacity: 1; }
        }
        .badge-pop { animation: badgePop 0.5s ease forwards; }
        .shimmer-text {
          background: linear-gradient(90deg,#fff 25%,rgba(255,255,255,0.4) 50%,#fff 75%);
          background-size: 200% auto;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          animation: shimmer 3s linear infinite;
        }
        .card-glow:hover {
          box-shadow: 0 0 0 2px rgba(99,102,241,0.4), 0 8px 24px rgba(99,102,241,0.15);
          transform: translateY(-2px);
        }
        .card-glow { transition: all 0.25s ease; }
      `}</style>

      <div className="animate-fade-in pb-24">

        {/* ── HERO ── */}
        <div
          className="relative overflow-hidden text-white text-center px-5 pt-12 pb-10"
          style={{ background: 'linear-gradient(135deg,#4338ca 0%,#5b21b6 40%,#1e1b4b 100%)' }}
        >
          <Orb style={{ width: 220, height: 220, top: -60, right: -60 }} />
          <Orb style={{ width: 160, height: 160, bottom: -40, left: -40, animationDelay: '2s' }} />
          <Orb style={{ width: 80, height: 80, top: '40%', left: '10%', animationDelay: '1s' }} />

          {/* 3D icon */}
          <div className="relative inline-block mb-5" style={{ perspective: 400 }}>
            <div
              className="w-20 h-20 rounded-3xl flex items-center justify-center text-4xl mx-auto"
              style={{
                background: 'rgba(255,255,255,0.15)',
                backdropFilter: 'blur(12px)',
                border: '1px solid rgba(255,255,255,0.25)',
                animation: 'spin3d 8s linear infinite',
                transformStyle: 'preserve-3d',
                boxShadow: '0 8px 32px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.2)',
              }}
            >
              📘
            </div>
          </div>

          <h1 className="text-3xl font-black tracking-tight shimmer-text">Metodikish</h1>
          <p className="text-white/70 mt-2 text-sm">Metodik ishlar tayyorlash va ommalashtirish</p>

          {/* trust badges */}
          <div className="flex justify-center gap-2 mt-4 flex-wrap">
            {[
              { label: '1850+ ish', delay: '0.1s' },
              { label: '98% ommalashdi', delay: '0.25s' },
              { label: '4 yil tajriba', delay: '0.4s' },
            ].map((b, i) => (
              <span
                key={i}
                className="badge-pop text-xs font-semibold px-3 py-1 rounded-full"
                style={{
                  background: 'rgba(255,255,255,0.15)',
                  border: '1px solid rgba(255,255,255,0.25)',
                  animationDelay: b.delay,
                  opacity: 0,
                }}
              >
                {b.label}
              </span>
            ))}
          </div>

          <button
            onClick={() => navigate('/services')}
            className="mt-6 font-bold px-8 py-3.5 rounded-2xl text-sm text-indigo-700 active:scale-95 transition-transform"
            style={{
              background: 'white',
              animation: 'pulseRing 2.5s ease-in-out infinite',
              boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
            }}
          >
            Buyurtma berish →
          </button>
        </div>

        {/* ── STATS ── */}
        <Section delay={100} className="mt-4">
          <div
            className="rounded-2xl p-4 grid grid-cols-3 gap-3 text-center"
            style={{ background: 'var(--tg-theme-secondary-bg-color)', boxShadow: '0 4px 24px rgba(0,0,0,0.06)' }}
          >
            {[
              { to: '1850', suffix: '+', label: 'Tugatilgan', color: '#6366f1' },
              { to: '98', suffix: '%', label: 'Ommalashgan', color: '#10b981' },
              { to: '4', suffix: ' yil', label: 'Tajriba', color: '#f59e0b' },
            ].map((s, i) => (
              <div key={i}>
                <p className="text-2xl font-black" style={{ color: s.color }}>
                  <Counter to={s.to} suffix={s.suffix} />
                </p>
                <p className="text-[11px] text-tg-hint mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
        </Section>

        {/* ── WHY ── */}
        <Section delay={200} className="mt-6">
          <h2 className="text-lg font-bold text-tg-text mb-3">Nega ommalashtirish kerak?</h2>
          <div className="space-y-2.5">
            {[
              { icon: '💰', text: 'Malaka toifangiz oshadi — oyligingiz sezilarli ko\'tariladi', color: '#fef9c3', border: '#fde68a' },
              { icon: '📜', text: 'Sertifikat va guvohnoma — attestatsiyada katta ustunlik', color: '#ede9fe', border: '#c4b5fd' },
              { icon: '🏆', text: 'Mukofot va rag\'bat pullari olish imkoniyati', color: '#dcfce7', border: '#86efac' },
              { icon: '📈', text: 'Obro\' oshadi — kelajakda yuqori lavozim va daromad', color: '#dbeafe', border: '#93c5fd' },
            ].map((item, i) => (
              <div
                key={i}
                className="card-glow flex items-start gap-3 rounded-xl p-3.5"
                style={{
                  background: item.color,
                  border: `1px solid ${item.border}`,
                  animationDelay: `${i * 0.1}s`,
                }}
              >
                <span className="text-xl shrink-0">{item.icon}</span>
                <p className="text-sm font-medium text-gray-800 leading-snug">{item.text}</p>
              </div>
            ))}
          </div>
        </Section>

        {/* ── PAIN ── */}
        <Section delay={300} className="mt-6">
          <h2 className="text-lg font-bold text-tg-text mb-3">Tanish muammolar?</h2>
          <div
            className="rounded-2xl p-4 border"
            style={{ background: '#fff1f2', borderColor: '#fecdd3' }}
          >
            {[
              '⏳ Metodik ish juda ko\'p vaqt oladi',
              '📄 Yoziladi — lekin qaytariladi',
              '🚫 Antiplagiatdan o\'tmay qoladi',
              '😓 Ball va ustama cho\'zilib ketadi',
            ].map((t, i) => (
              <div key={i} className="flex items-center gap-2 py-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-rose-400 shrink-0" />
                <p className="text-sm text-rose-700">{t}</p>
              </div>
            ))}
            <p className="text-xs text-rose-400 mt-2 text-center font-medium">Siz yolg'iz emassiz — biz yordamga tayyormiz</p>
          </div>
        </Section>

        {/* ── SERVICES ── */}
        <Section delay={350} className="mt-6">
          <h2 className="text-lg font-bold text-tg-text mb-3">Xizmatlarimiz</h2>
          <div className="grid grid-cols-2 gap-3">
            {[
              { icon: '📘', title: 'Metodik qo\'llanma', desc: '25–30+ bet', color: 'from-blue-500 to-indigo-600' },
              { icon: '📗', title: 'Metodik tavsiya', desc: 'Talablarga mos', color: 'from-emerald-500 to-teal-600' },
            ].map((s, i) => (
              <div
                key={i}
                className={`card-glow rounded-2xl p-4 text-white text-center bg-gradient-to-br ${s.color}`}
                style={{ boxShadow: '0 4px 16px rgba(0,0,0,0.15)' }}
              >
                <span className="text-4xl">{s.icon}</span>
                <p className="text-sm font-bold mt-2">{s.title}</p>
                <p className="text-xs opacity-80 mt-0.5">{s.desc}</p>
              </div>
            ))}
          </div>
          <div className="mt-3 rounded-2xl p-4 bg-tg-secondary border border-black/5">
            <p className="text-xs font-semibold text-tg-hint uppercase mb-2">Ommalashish darajalari</p>
            <div className="flex flex-wrap gap-2">
              {[
                { label: '🏫 Maktab', val: '135', color: '#dbeafe', text: '#1d4ed8' },
                { label: '📍 Tuman', val: '825', color: '#dcfce7', text: '#15803d' },
                { label: '🏢 Viloyat', val: '76', color: '#fef9c3', text: '#92400e' },
                { label: '🇺🇿 Respublika', val: '25', color: '#ede9fe', text: '#6d28d9' },
              ].map((s, i) => (
                <span
                  key={i}
                  className="text-xs font-semibold px-2.5 py-1.5 rounded-xl"
                  style={{ background: s.color, color: s.text }}
                >
                  {s.label} — {s.val} ta
                </span>
              ))}
            </div>
          </div>
        </Section>

        {/* ── QUALITY ── */}
        <Section delay={400} className="mt-6">
          <h2 className="text-lg font-bold text-tg-text mb-3">Sifat kafolati</h2>
          <div className="grid grid-cols-2 gap-2">
            {[
              { icon: '📑', text: 'Hajmi 25–30+ bet' },
              { icon: '🛡️', text: 'Antiplagiat 90%+' },
              { icon: '💡', text: 'Interfaol metodlar' },
              { icon: '📚', text: '5E moduli asosi' },
              { icon: '💻', text: 'AKT qo\'llaniladi' },
              { icon: '🌏', text: 'Singapur tajribasi' },
              { icon: '🔬', text: 'Tadqiqotchilik' },
              { icon: '📊', text: 'Jadval/grafiklar' },
            ].map((q, i) => (
              <div
                key={i}
                className="card-glow flex items-center gap-2.5 rounded-xl p-3 bg-tg-secondary border border-black/5"
              >
                <span className="text-lg shrink-0">{q.icon}</span>
                <p className="text-xs font-medium text-tg-text">{q.text}</p>
              </div>
            ))}
          </div>
        </Section>

        {/* ── WHO FOR ── */}
        <Section delay={450} className="mt-6">
          <h2 className="text-lg font-bold text-tg-text mb-3">Kimlar uchun?</h2>
          <div className="space-y-2">
            {[
              { icon: '⏰', text: 'Vaqti yo\'q, lekin ball kerak bo\'lgan ustozlar' },
              { icon: '🔁', text: 'Oldin yozib, qaytarilgan ish egalari' },
              { icon: '📈', text: 'Attestatsiya yoki ustama uchun tayyorgarlik' },
            ].map((item, i) => (
              <div
                key={i}
                className="card-glow flex items-center gap-3 rounded-xl p-3.5 bg-tg-secondary border border-black/5"
              >
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center text-lg shrink-0"
                  style={{ background: 'linear-gradient(135deg,#6366f1,#818cf8)', boxShadow: '0 4px 12px rgba(99,102,241,0.3)' }}
                >
                  {item.icon}
                </div>
                <p className="text-sm text-tg-text">{item.text}</p>
              </div>
            ))}
          </div>
        </Section>

        {/* ── CTA ── */}
        <Section delay={500} className="mt-6">
          <div
            className="rounded-3xl p-6 text-center text-white relative overflow-hidden"
            style={{ background: 'linear-gradient(135deg,#4338ca 0%,#7c3aed 100%)', boxShadow: '0 8px 32px rgba(99,102,241,0.4)' }}
          >
            <Orb style={{ width: 160, height: 160, top: -40, right: -40 }} />
            <div className="relative">
              <p className="text-xl font-black">Tayyor bo'lsangiz —</p>
              <p className="text-xl font-black">boshlang! 🚀</p>
              <p className="text-white/70 text-sm mt-1.5">Sifatga mos narx. Ishonch. Natija.</p>
              <div className="flex gap-2 justify-center mt-4 text-xs text-white/60">
                <span>✅ 3 yillik tajriba</span>
                <span>·</span>
                <span>✅ Kafolat</span>
                <span>·</span>
                <span>✅ Tez yetkazish</span>
              </div>
              <button
                onClick={() => navigate('/services')}
                className="mt-5 bg-white text-indigo-700 font-bold px-8 py-3.5 rounded-2xl text-sm active:scale-95 transition-transform"
                style={{
                  animation: 'pulseRing 2.5s ease-in-out infinite',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
                }}
              >
                Xizmatlarni ko'rish →
              </button>
            </div>
          </div>
        </Section>

      </div>
    </>
  )
}

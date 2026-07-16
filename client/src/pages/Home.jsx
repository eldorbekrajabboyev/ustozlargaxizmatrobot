import { useNavigate } from 'react-router-dom'
import { useEffect, useRef, useState } from 'react'
import axios from 'axios'

/* ─── animated counter on mount ─── */
function Counter({ to, suffix = '' }) {
  const [val, setVal] = useState(0)
  useEffect(() => {
    const end = parseInt(to)
    let cur = 0
    const inc = Math.ceil(end / 55)
    const t = setInterval(() => {
      cur = Math.min(cur + inc, end)
      setVal(cur)
      if (cur >= end) clearInterval(t)
    }, 22)
    return () => clearInterval(t)
  }, [to])
  return <>{val.toLocaleString()}{suffix}</>
}

/* ─── floating glow orb ─── */
function Orb({ style }) {
  return (
    <div className="absolute rounded-full pointer-events-none"
      style={{ background: 'radial-gradient(circle,rgba(255,255,255,0.15) 0%,transparent 70%)', animation: 'floatY 7s ease-in-out infinite', ...style }} />
  )
}

/* ─── slide-up section ─── */
function FadeIn({ children, delay = 0, className = '' }) {
  const [show, setShow] = useState(false)
  useEffect(() => { const t = setTimeout(() => setShow(true), delay); return () => clearTimeout(t) }, [delay])
  return (
    <div className={`transition-all duration-700 ease-out ${show ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'} ${className}`}>
      {children}
    </div>
  )
}

/* ─── iPhone-style sticker ─── */
function Sticker({ e, rotZ = 0, sz = 44, fontSize = 22, animDelay = '0s' }) {
  return (
    <div className="shrink-0 flex items-center justify-center rounded-[14px]" style={{
      width: sz, height: sz, fontSize,
      background: 'linear-gradient(160deg,#fff 0%,#f1f1f3 100%)',
      boxShadow: '0 6px 20px rgba(0,0,0,0.12),0 0 0 1px rgba(0,0,0,0.04),inset 0 1px 0 rgba(255,255,255,0.9)',
      transform: `rotate(${rotZ}deg)`,
      animation: `stickerPop 0.4s ease both, stickerHover 3s ${animDelay} ease-in-out infinite`,
    }}>
      {e}
    </div>
  )
}

/* ─── section label ─── */
function Label({ children, color = '#6366f1' }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <div className="w-1 h-4 rounded-full" style={{ background: color }} />
      <p className="text-[11px] font-bold uppercase tracking-widest" style={{ color }}>{children}</p>
    </div>
  )
}

/* ─── reviews carousel ─── */
const FALLBACK_REVIEWS = [
  { id:1, stars:5, author_name:'Dilnoza M.', region:'Toshkent viloyati', text:"Tuman darajasida buyurtma qildim — 14 soatda tayyor bo'ldi. Antiplagiat 93% chiqdi. Juda mamnunman!" },
  { id:2, stars:5, author_name:'Sherzod K.', region:'Samarqand shahri',  text:"O'zim 2 marta qaytarilgan edim. Metodikishga murojaat qildim — 1 tekshirishdan o'tdi, qabul qilindi." },
  { id:3, stars:5, author_name:'Maftuna R.', region:"Farg'ona viloyati", text:"Viloyat darajasida ommalashtirishni xohlovchi hamkasblarimga tavsiya qilaman. Professional va kafolatlangan." },
]

function ReviewsCarousel() {
  const [reviews, setReviews] = useState(FALLBACK_REVIEWS)
  const [idx, setIdx] = useState(0)
  const [fade, setFade] = useState(true)
  const timerRef = useRef(null)

  useEffect(() => {
    axios.get('/api/reviews/published').then(r => {
      if (r.data && r.data.length > 0) setReviews(r.data)
    }).catch(() => {})
  }, [])

  const goTo = (next) => {
    setFade(false)
    setTimeout(() => {
      setIdx(next)
      setFade(true)
    }, 220)
  }

  useEffect(() => {
    if (reviews.length <= 1) return
    timerRef.current = setInterval(() => {
      goTo((prev) => (prev + 1) % reviews.length)
    }, 4500)
    return () => clearInterval(timerRef.current)
  }, [reviews.length])

  if (!reviews.length) return null
  const r = reviews[idx]
  const emojis = ['👩‍🏫','👨‍🏫','🧑‍🏫','👩‍💼','👨‍💼']

  return (
    <FadeIn delay={440} className="px-4 mt-6">
      <Label color="#f59e0b">Mijozlarimiz fikri</Label>
      <div className="relative">
        {/* Card */}
        <div
          className="rounded-2xl p-4 bg-tg-secondary border border-black/5 transition-opacity duration-200"
          style={{ opacity: fade ? 1 : 0, minHeight: 120 }}
        >
          <div className="flex items-center gap-3 mb-2">
            <Sticker e={emojis[idx % emojis.length]} rotZ={(idx%2===0?-2:2)} sz={40} fontSize={20} animDelay="0s" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-tg-text truncate">{r.author_name || 'Foydalanuvchi'}</p>
              {r.region && <p className="text-[11px] text-tg-hint">{r.region}</p>}
            </div>
            <div className="shrink-0 flex gap-0.5">
              {[1,2,3,4,5].map(n=>(
                <span key={n} style={{ color: n<=r.stars?'#f59e0b':'#d1d5db', fontSize:14 }}>★</span>
              ))}
            </div>
          </div>
          <p className="text-xs text-tg-text leading-relaxed border-t border-black/5 pt-2">"{r.text}"</p>
        </div>

        {/* Dots */}
        {reviews.length > 1 && (
          <div className="flex justify-center gap-1.5 mt-3">
            {reviews.map((_,i) => (
              <button
                key={i}
                onClick={() => { clearInterval(timerRef.current); goTo(i) }}
                className="rounded-full transition-all duration-300"
                style={{
                  width: i===idx ? 18 : 6, height: 6,
                  background: i===idx ? '#6366f1' : '#d1d5db',
                }}
              />
            ))}
          </div>
        )}
      </div>
    </FadeIn>
  )
}

export default function Home({ user }) {
  const nav = useNavigate()

  return (
    <>
      <style>{`
        @keyframes floatY   { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-16px)} }
        @keyframes shimmer  { 0%{background-position:-200% center} 100%{background-position:200% center} }
        @keyframes pulse    { 0%,100%{box-shadow:0 0 0 0 rgba(99,102,241,.45)} 50%{box-shadow:0 0 0 12px rgba(99,102,241,0)} }
        @keyframes spin3d   { from{transform:rotateY(0deg) rotateX(10deg)} to{transform:rotateY(360deg) rotateX(10deg)} }
        @keyframes popIn    { 0%{opacity:0;transform:scale(.6)} 70%{transform:scale(1.1)} 100%{opacity:1;transform:scale(1)} }
        @keyframes stickerPop  { 0%{opacity:0;transform:scale(.5)} 80%{transform:scale(1.08)} 100%{opacity:1;transform:scale(1)} }
        @keyframes stickerHover{ 0%,100%{transform:translateY(0)} 50%{transform:translateY(-5px)} }
        .shimmer { background:linear-gradient(90deg,#fff 20%,rgba(255,255,255,.35) 50%,#fff 80%);background-size:200% auto;-webkit-background-clip:text;-webkit-text-fill-color:transparent;animation:shimmer 3s linear infinite; }
        .hcard   { transition:transform .22s,box-shadow .22s; }
        .hcard:hover { transform:translateY(-2px); }
        .pop-1{animation:popIn .45s .1s ease both}
        .pop-2{animation:popIn .45s .25s ease both}
        .pop-3{animation:popIn .45s .4s ease both}
      `}</style>

      <div className="pb-24">

        {/* ══════════ HERO ══════════ */}
        <div className="relative overflow-hidden text-white px-5 pt-12 pb-8 text-center"
          style={{ background: 'linear-gradient(140deg,#3730a3 0%,#4f46e5 45%,#7c3aed 100%)' }}>
          <Orb style={{ width:200,height:200,top:-70,right:-60 }} />
          <Orb style={{ width:140,height:140,bottom:-50,left:-50,animationDelay:'2.5s' }} />
          <Orb style={{ width:70,height:70,top:'38%',left:'8%',animationDelay:'1.2s' }} />

          {/* Logo icon */}
          <div className="relative inline-flex mb-4" style={{ perspective:500 }}>
            <div className="w-20 h-20 rounded-[22px] flex items-center justify-center text-4xl"
              style={{
                background:'rgba(255,255,255,.13)',backdropFilter:'blur(14px)',
                border:'1px solid rgba(255,255,255,.22)',
                animation:'spin3d 9s linear infinite',transformStyle:'preserve-3d',
                boxShadow:'0 12px 40px rgba(0,0,0,.25),inset 0 1px 0 rgba(255,255,255,.25)',
              }}>📘</div>
          </div>

          <h1 className="text-[28px] font-black tracking-tight leading-tight shimmer">Metodikish</h1>
          <p className="text-white/65 text-sm mt-1.5 max-w-[260px] mx-auto leading-snug">
            O'zbekiston o'qituvchilari uchun metodik ish tayyorlash xizmati
          </p>

          {/* trust pills */}
          <div className="flex justify-center flex-wrap gap-2 mt-4">
            {[
              {t:'✅ 1 850+ tugatilgan ish',d:'0.08s'},
              {t:'⭐ 98% ommalashdi',d:'0.22s'},
              {t:'🏅 2021-yildan buyon',d:'0.38s'},
            ].map((b,i)=>(
              <span key={i} className="text-[11px] font-semibold px-3 py-1 rounded-full"
                style={{ background:'rgba(255,255,255,.13)',border:'1px solid rgba(255,255,255,.22)',animation:`popIn .45s ${b.d} ease both`,opacity:0 }}>
                {b.t}
              </span>
            ))}
          </div>

          <button onClick={()=>nav('/services')}
            className="mt-6 font-bold px-8 py-3.5 rounded-2xl text-indigo-700 text-sm active:scale-95 transition-transform inline-block"
            style={{ background:'#fff',animation:'pulse 2.4s ease-in-out infinite',boxShadow:'0 4px 18px rgba(0,0,0,.2)' }}>
            Buyurtma berish →
          </button>

          {/* bottom wave */}
          <svg viewBox="0 0 400 28" className="absolute bottom-0 left-0 w-full" style={{ display:'block' }}>
            <path d="M0 28 Q100 0 200 14 Q300 28 400 8 L400 28 Z" fill="var(--tg-theme-bg-color,#ffffff)" />
          </svg>
        </div>

        {/* ══════════ STATS BAR ══════════ */}
        <FadeIn delay={80} className="px-4 mt-2">
          <div className="rounded-2xl p-4 grid grid-cols-4 gap-2 text-center hcard"
            style={{ background:'var(--tg-theme-secondary-bg-color)', boxShadow:'0 2px 16px rgba(0,0,0,.06)' }}>
            {[
              {n:'1 850',s:'+',l:"Buyurtma",c:'#6366f1'},
              {n:'98',s:'%',l:'Ommalashdi',c:'#10b981'},
              {n:'4',s:' yil',l:'Tajriba',c:'#f59e0b'},
              {n:'12',s:'h',l:'O\'rtacha mudd.',c:'#ec4899'},
            ].map((s,i)=>(
              <div key={i}>
                <p className="text-xl font-black leading-none" style={{ color:s.c }}>
                  <Counter to={s.n.replace(/\s/g,'')} suffix={s.s} />
                </p>
                <p className="text-[10px] text-tg-hint mt-0.5 leading-tight">{s.l}</p>
              </div>
            ))}
          </div>
        </FadeIn>

        {/* ══════════ MUAMMO → YECHIM ══════════ */}
        <FadeIn delay={160} className="px-4 mt-6">
          <Label color="#ef4444">Ko'pchilik o'qituvchilar duch keladigan muammo</Label>
          <div className="rounded-2xl overflow-hidden border border-rose-100">
            {[
              {e:'⏳',rz:-3,t:'Metodik ish yozish haftalar, ba\'zan oylar vaqt oladi',ad:'0s'},
              {e:'📭',rz:2,t:'Tayyor ish ko\'p marta qaytariladi — talablar o\'zgarib turadi',ad:'0.1s'},
              {e:'⚠️',rz:-2,t:'Antiplagiat tekshiruvidan o\'ta olmay, to\'liq bekor qilinadi',ad:'0.2s'},
              {e:'📉',rz:3,t:'Ball, ustama va malaka toifasi yillab kutiladi',ad:'0.3s'},
            ].map((item,i)=>(
              <div key={i} className={`flex items-center gap-3 px-4 py-3 ${i<3?'border-b border-rose-100':''}`}
                style={{ background:i%2===0?'#fff7f7':'#fff1f2' }}>
                <Sticker e={item.e} rotZ={item.rz} sz={38} fontSize={18} animDelay={item.ad} />
                <p className="text-sm text-rose-800 leading-snug">{item.t}</p>
              </div>
            ))}
          </div>
          {/* arrow */}
          <div className="flex justify-center mt-2">
            <div className="flex flex-col items-center gap-0.5 opacity-40">
              <div className="w-0.5 h-4 bg-indigo-400 rounded" />
              <div className="w-0 h-0 border-l-[5px] border-r-[5px] border-t-[7px] border-l-transparent border-r-transparent border-t-indigo-400" />
            </div>
          </div>
          <div className="mt-2 rounded-2xl px-4 py-3 text-center"
            style={{ background:'linear-gradient(135deg,#ede9fe,#dbeafe)',border:'1px solid #c4b5fd' }}>
            <p className="text-sm font-bold text-indigo-800">Metodikish — bularning hammasi uchun yechim</p>
            <p className="text-xs text-indigo-600 mt-0.5">2021-yildan buyon 1 850+ o'qituvchiga xizmat qilganmiz</p>
          </div>
        </FadeIn>

        {/* ══════════ XIZMATLAR ══════════ */}
        <FadeIn delay={240} className="px-4 mt-6">
          <Label color="#6366f1">Xizmatlarimiz</Label>
          <div className="grid grid-cols-2 gap-3">
            {[
              {
                e:'📘', rz:-4, title:'Metodik qo\'llanma',
                points:['25–30+ bet','5E moduli','AKT integratsiya'],
                grad:'linear-gradient(135deg,#4338ca,#6366f1)',
                ad:'0s',
              },
              {
                e:'📗', rz:4, title:'Metodik tavsiya',
                points:['15–20+ bet','Amaliy yo\'naltirish','Talablarga to\'liq mos'],
                grad:'linear-gradient(135deg,#059669,#10b981)',
                ad:'0.12s',
              },
            ].map((s,i)=>(
              <div key={i} className="hcard rounded-2xl p-4 text-white"
                style={{ background:s.grad,boxShadow:'0 6px 20px rgba(0,0,0,.18)' }}>
                <Sticker e={s.e} rotZ={s.rz} sz={48} fontSize={24} animDelay={s.ad} />
                <p className="text-sm font-black mt-3">{s.title}</p>
                <ul className="mt-2 space-y-1">
                  {s.points.map((p,j)=>(
                    <li key={j} className="text-[11px] opacity-85 flex items-center gap-1.5">
                      <span className="w-1 h-1 rounded-full bg-white/70 shrink-0" />{p}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </FadeIn>

        {/* ══════════ JARAYON ══════════ */}
        <FadeIn delay={300} className="px-4 mt-6">
          <Label color="#8b5cf6">Qanday ishlaydi?</Label>
          <div className="space-y-2">
            {[
              {n:'1',e:'📝',rz:-2,t:'Buyurtma bering',d:'Fan, sinf, ommalashish darajasini tanlang',c:'#ede9fe',bc:'#ddd6fe'},
              {n:'2',e:'💸',rz:3,t:'To\'lovni amalga oshiring',d:'Xavfsiz to\'lov — kvitansiya Telegram orqali',c:'#dcfce7',bc:'#bbf7d0'},
              {n:'3',e:'⚙️',rz:-1,t:'Mutaxassis ish boshlaydi',d:'O\'rtacha 12 soatda tayyor holga keltiriladi',c:'#dbeafe',bc:'#bfdbfe'},
              {n:'4',e:'📦',rz:2,t:'Tayyor hujjatni oling',d:'Word formatida, to\'liq formatlangan holda',c:'#fef9c3',bc:'#fde68a'},
            ].map((step,i)=>(
              <div key={i} className="hcard flex items-start gap-3 rounded-xl p-3.5"
                style={{ background:step.c,border:`1px solid ${step.bc}` }}>
                <div className="flex flex-col items-center gap-1 shrink-0">
                  <div className="w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-black text-white"
                    style={{ background:'#6366f1' }}>{step.n}</div>
                  {i<3 && <div className="w-0.5 h-3 rounded bg-indigo-200" />}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <Sticker e={step.e} rotZ={step.rz} sz={32} fontSize={16} animDelay={`${i*0.1}s`} />
                    <p className="text-sm font-bold text-gray-800">{step.t}</p>
                  </div>
                  <p className="text-xs text-gray-500 mt-1 leading-snug">{step.d}</p>
                </div>
              </div>
            ))}
          </div>
        </FadeIn>

        {/* ══════════ SIFAT KAFOLATI ══════════ */}
        <FadeIn delay={360} className="px-4 mt-6">
          <Label color="#0891b2">Har bir ish tarkibi</Label>
          <div className="rounded-2xl overflow-hidden" style={{ background:'var(--tg-theme-secondary-bg-color)',boxShadow:'0 2px 16px rgba(0,0,0,.06)' }}>
            <div className="grid grid-cols-2">
              {[
                {e:'🛡️',rz:-2,t:'Antiplagiat 90%+',sub:'kafolatlangan'},
                {e:'🌏',rz:2,t:'Singapur modeli',sub:'5E asosida'},
                {e:'📊',rz:-1,t:'Jadval & grafik',sub:'vizual ko\'rsatkichlar'},
                {e:'🔬',rz:3,t:'Tadqiqot elementi',sub:'ilmiy asoslangan'},
                {e:'💻',rz:-3,t:'AKT vositalari',sub:'zamonaviy yondashuv'},
                {e:'📎',rz:1,t:'Word + PDF',sub:'tayyor holda beriladi'},
              ].map((q,i)=>(
                <div key={i} className={`flex items-center gap-2.5 p-3 ${i%2===0?'border-r border-black/5':''} ${i<4?'border-b border-black/5':''}`}>
                  <Sticker e={q.e} rotZ={q.rz} sz={36} fontSize={17} animDelay={`${i*0.08}s`} />
                  <div>
                    <p className="text-xs font-bold text-tg-text">{q.t}</p>
                    <p className="text-[10px] text-tg-hint">{q.sub}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </FadeIn>

        {/* ══════════ OMMALASHISH DARAJALARI ══════════ */}
        <FadeIn delay={400} className="px-4 mt-6">
          <Label color="#0891b2">Ommalashish darajalari va narxlar</Label>
          <div className="space-y-2">
            {[
              {e:'🏫',rz:-2,lvl:'Maktab darajasi',cnt:'135 ta ish',price:'Eng qulayʼ narx',desc:'Maktab ichida ommalashadi, tez va arzon',c:'#dbeafe',bc:'#93c5fd',tc:'#1e40af'},
              {e:'📍',rz:3, lvl:'Tuman darajasi', cnt:'825 ta ish',price:'Optimal narx',   desc:'Tuman metodist kengashida tasdiqlanadi',c:'#dcfce7',bc:'#6ee7b7',tc:'#065f46'},
              {e:'🏢',rz:-1,lvl:'Viloyat darajasi',cnt:'76 ta ish', price:'Premium narx',  desc:'Viloyat ta\'lim bo\'limida ro\'yxatga olinadi',c:'#fef9c3',bc:'#fcd34d',tc:'#78350f'},
              {e:'🇺🇿',rz:2, lvl:'Respublika darajasi',cnt:'25 ta ish',price:'Elite narx',desc:'ZiyoNET yoki respublika nashriga taqdim etiladi',c:'#ede9fe',bc:'#a78bfa',tc:'#4c1d95'},
            ].map((s,i)=>(
              <div key={i} className="hcard flex items-center gap-3 rounded-xl px-3.5 py-3"
                style={{ background:s.c,border:`1px solid ${s.bc}` }}>
                <Sticker e={s.e} rotZ={s.rz} sz={42} fontSize={22} animDelay={`${i*0.1}s`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-black" style={{ color:s.tc }}>{s.lvl}</p>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/60" style={{ color:s.tc }}>{s.price}</span>
                  </div>
                  <p className="text-[11px] mt-0.5 leading-snug text-gray-600">{s.desc}</p>
                  <p className="text-[10px] font-semibold mt-0.5" style={{ color:s.tc }}>✔ {s.cnt} muvaffaqiyatli</p>
                </div>
              </div>
            ))}
          </div>
          <p className="text-[11px] text-tg-hint text-center mt-2">* Aniq narx xizmat tanlash bosqichida ko'rsatiladi</p>
        </FadeIn>

        {/* ══════════ SOCIAL PROOF — CAROUSEL ══════════ */}
        <ReviewsCarousel />

        {/* ══════════ CTA ══════════ */}
        <FadeIn delay={500} className="px-4 mt-6">
          <div className="rounded-3xl p-6 text-center text-white relative overflow-hidden"
            style={{ background:'linear-gradient(140deg,#3730a3 0%,#4f46e5 50%,#7c3aed 100%)',boxShadow:'0 10px 40px rgba(79,70,229,.45)' }}>
            <Orb style={{ width:170,height:170,top:-50,right:-50 }} />
            <Orb style={{ width:100,height:100,bottom:-30,left:-20,animationDelay:'1.8s' }} />
            <div className="relative">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold mb-3"
                style={{ background:'rgba(255,255,255,.15)',border:'1px solid rgba(255,255,255,.25)' }}>
                🟢 Bugun buyurtma qabul qilinmoqda
              </div>
              <p className="text-xl font-black leading-tight">Kasbiy rivojlanish —<br/>bugun boshlang</p>
              <p className="text-white/65 text-xs mt-2 max-w-[240px] mx-auto leading-relaxed">
                Bir buyurtma bilan malaka toifangizni, oyligingizni va maqomingizni ko'taring
              </p>
              <div className="grid grid-cols-3 gap-2 mt-4 text-center">
                {[
                  {e:'⚡',l:'Tez',s:'~12 soat'},
                  {e:'🛡️',l:'Kafolat',s:'90%+ plagiat'},
                  {e:'💬',l:'Aloqa',s:'24/7 Telegram'},
                ].map((f,i)=>(
                  <div key={i} className="rounded-xl p-2" style={{ background:'rgba(255,255,255,.1)' }}>
                    <span className="text-base">{f.e}</span>
                    <p className="text-[11px] font-bold mt-0.5">{f.l}</p>
                    <p className="text-[10px] opacity-60">{f.s}</p>
                  </div>
                ))}
              </div>
              <button onClick={()=>nav('/services')}
                className="mt-5 w-full font-black py-4 rounded-2xl text-indigo-700 text-sm active:scale-[.97] transition-transform"
                style={{ background:'#fff',animation:'pulse 2.4s ease-in-out infinite',boxShadow:'0 4px 20px rgba(0,0,0,.22)' }}>
                Xizmatni tanlash →
              </button>
              <p className="text-[11px] text-white/40 mt-2">To'lov faqat siz roziligu'angizdan keyin</p>
            </div>
          </div>
        </FadeIn>

      </div>
    </>
  )
}

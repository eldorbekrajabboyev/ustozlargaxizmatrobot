import { useLocation, useNavigate } from 'react-router-dom'

const TABS = [
  { path: '/', label: 'Bosh', icon: HomeIcon },
  { path: '/services', label: 'Xizmatlar', icon: ServicesIcon },
  { path: '/my-orders', label: 'Buyurtmalar', icon: OrdersIcon },
  { path: '/profile', label: 'Profil', icon: ProfileIcon },
]

function HomeIcon({ active }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={active ? 'currentColor' : 'currentColor'} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 10.5 12 3l9 7.5" />
      <path d="M5 9.5V21h14V9.5" />
      <path d="M9.5 21v-6h5v6" />
    </svg>
  )
}

function ServicesIcon({ active }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 7h16" />
      <path d="M4 12h16" />
      <path d="M4 17h16" />
      <circle cx="9" cy="7" r="0.6" fill="currentColor" />
      <circle cx="9" cy="12" r="0.6" fill="currentColor" />
      <circle cx="9" cy="17" r="0.6" fill="currentColor" />
    </svg>
  )
}

function OrdersIcon({ active }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3.5 7.5 12 3l8.5 4.5v9L12 21l-8.5-4.5z" />
      <path d="M3.5 7.5 12 12l8.5-4.5" />
      <path d="M12 12v9" />
    </svg>
  )
}

function ProfileIcon({ active }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21v-1a6 6 0 0 1 12 0v1" />
    </svg>
  )
}

export default function BottomNav() {
  const location = useLocation()
  const navigate = useNavigate()

  const isActive = (path) =>
    path === '/' ? location.pathname === '/' : location.pathname.startsWith(path)

  return (
    <nav className="fixed bottom-0 inset-x-0 z-30 bg-tg-secondary border-t border-tg-text/5 pb-[env(safe-area-inset-bottom,0px)]">
      <div className="flex items-stretch justify-around max-w-xl mx-auto">
        {TABS.map(tab => {
          const active = isActive(tab.path)
          const Icon = tab.icon
          return (
            <button
              key={tab.path}
              onClick={() => navigate(tab.path)}
              className={`flex-1 flex flex-col items-center justify-center gap-1 py-2.5 transition-colors ${
                active ? 'text-primary-600' : 'text-tg-hint'
              }`}
            >
              <Icon active={active} />
              <span className="text-[11px] font-medium leading-none">{tab.label}</span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}

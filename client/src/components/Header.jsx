import { useNavigate, useLocation } from 'react-router-dom'

function Header({ title, subtitle, onBack, right }) {
  const navigate = useNavigate()
  const location = useLocation()

  const handleBack = onBack || (() => {
    if (window.history.length > 1) navigate(-1)
    else navigate('/')
  })

  const isHome = location.pathname === '/'

  return (
    <header className="sticky top-0 z-20 bg-tg-bg/90 backdrop-blur-md border-b border-tg-text/5">
      <div className="flex items-center gap-2 px-4 h-14">
        {!isHome && (
          <button
            onClick={handleBack}
            className="shrink-0 w-9 h-9 -ml-1 flex items-center justify-center rounded-full text-lg text-tg-text hover:bg-tg-text/5 active:bg-tg-text/10 transition-colors"
            aria-label="Orqaga"
          >
            ‹
          </button>
        )}
        <div className="min-w-0 flex-1">
          <h1 className="text-lg font-semibold text-tg-text truncate leading-tight">
            {title}
          </h1>
          {subtitle && (
            <p className="text-xs text-tg-hint truncate">{subtitle}</p>
          )}
        </div>
        {right}
      </div>
    </header>
  )
}

export default Header

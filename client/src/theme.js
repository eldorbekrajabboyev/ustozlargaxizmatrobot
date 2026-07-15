export function applyTelegramTheme() {
  if (typeof window === 'undefined') return { colorScheme: 'light' }

  const tg = window.Telegram?.WebApp
  if (!tg) return { colorScheme: 'light' }

  const root = document.documentElement
  const params = tg.themeParams || {}
  const keys = [
    'bg_color', 'secondary_bg_color', 'text_color', 'hint_color',
    'button_color', 'button_text_color', 'section_bg_color', 'section_header_text_color',
  ]
  keys.forEach(k => {
    if (params[k]) {
      root.style.setProperty(`--tg-theme-${k}`, params[k])
    }
  })

  const scheme = tg.colorScheme || 'light'
  root.setAttribute('data-theme', scheme)
  root.style.setProperty('color-scheme', scheme)

  return { colorScheme: scheme }
}

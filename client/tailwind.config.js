/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eef2ff',
          100: '#e0e7ff',
          200: '#c7d2fe',
          300: '#a5b4fc',
          400: '#818cf8',
          500: '#6366f1',
          600: '#4f46e5',
          700: '#4338ca',
          800: '#3730a3',
          900: '#312e81',
        },
        tg: {
          bg: 'var(--tg-theme-bg-color)',
          secondary: 'var(--tg-theme-secondary-bg-color)',
          text: 'var(--tg-theme-text-color)',
          hint: 'var(--tg-theme-hint-color)',
          button: 'var(--tg-theme-button-color)',
          buttonText: 'var(--tg-theme-button-text-color)',
          section: 'var(--tg-theme-section-bg-color)',
          sectionHeader: 'var(--tg-theme-section-header-text-color)',
        },
      },
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica', 'Arial', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 2px rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.04)',
        soft: '0 2px 8px rgba(0,0,0,0.06)',
      },
      borderRadius: {
        xl: '16px',
        '2xl': '20px',
      },
      keyframes: {
        'fade-in': {
          '0%': { opacity: '0', transform: 'translateY(4px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'pulse-soft': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.5' },
        },
      },
      animation: {
        'fade-in': 'fade-in 0.25s ease-out',
        'pulse-soft': 'pulse-soft 2s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}

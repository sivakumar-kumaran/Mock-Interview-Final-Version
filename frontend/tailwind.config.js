/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          purple: '#7C3AED',
          purpleHover: '#6D28D9',
          purpleLight: '#F3E8FF',
          blue: '#6366F1',
          cyan: '#00D2FF',
          glowBlue: '#E0F2FE',
          charcoal: '#0F172A',
          slate: '#475569',
          border: '#E2E8F0',
          surface: '#F8FAFC',
        },
        dark: {
          bg: '#0B1120',
          surface: '#111827',
          card: '#1E293B',
          cardHover: '#263548',
          border: '#334155',
          text: '#F1F5F9',
          muted: '#94A3B8',
          purple: '#A78BFA',
          purpleHover: '#8B5CF6',
          purpleGlow: '#7C3AED',
          blue: '#818CF8',
          cyan: '#22D3EE',
          neonPurple: '#C084FC',
          neonBlue: '#60A5FA',
          accent: '#E879F9',
        }
      },
      fontFamily: {
        outfit: ['Outfit', 'Inter', 'sans-serif'],
        sans: ['Inter', 'Outfit', 'sans-serif'],
      },
      boxShadow: {
        'sm': '0 2px 6px rgba(0, 0, 0, 0.18), 0 1px 3px rgba(0, 0, 0, 0.14)',
        'DEFAULT': '0 6px 14px rgba(0, 0, 0, 0.22), 0 2px 6px rgba(0, 0, 0, 0.16)',
        'md': '0 10px 24px -2px rgba(0, 0, 0, 0.28), 0 4px 12px -3px rgba(0, 0, 0, 0.2)',
        'lg': '0 18px 36px -4px rgba(0, 0, 0, 0.34), 0 8px 18px -5px rgba(0, 0, 0, 0.25)',
        'xl': '0 25px 48px -6px rgba(0, 0, 0, 0.4), 0 12px 24px -6px rgba(0, 0, 0, 0.3)',
        '2xl': '0 35px 75px -12px rgba(0, 0, 0, 0.5)',
        'premium': '0 12px 36px -10px rgba(0, 0, 0, 0.26), 0 4px 12px rgba(124, 58, 237, 0.18)',
        'premium-hover': '0 24px 48px -15px rgba(0, 0, 0, 0.38), 0 6px 18px rgba(124, 58, 237, 0.28)',
        'cyan-glow': '0 0 20px rgba(0, 210, 255, 0.55)',
        'purple-glow': '0 0 25px rgba(124, 58, 237, 0.5)',
        'dark-premium': '0 10px 30px -10px rgba(167, 139, 250, 0.25), 0 1px 1px rgba(0, 0, 0, 0.2)',
        'dark-glow': '0 0 40px rgba(124, 58, 237, 0.4)',
        'dark-card': '0 4px 20px rgba(0, 0, 0, 0.4)',
        'neon-purple': '0 0 30px rgba(167, 139, 250, 0.5), 0 0 60px rgba(124, 58, 237, 0.3)',
      },
      animation: {
        'float': 'float 6s ease-in-out infinite',
        'glow-pulse': 'glowPulse 3s ease-in-out infinite',
        'slide-up': 'slideUp 0.4s ease-out',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        glowPulse: {
          '0%, 100%': { opacity: '0.4' },
          '50%': { opacity: '0.8' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
}

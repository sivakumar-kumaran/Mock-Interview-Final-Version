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
          purple: '#059669', // Emerald 600 for light mode primary
          purpleHover: '#047857', // Emerald 700 hover
          purpleLight: '#ECFDF5', // Emerald 50
          green: '#10B981',
          emerald: '#059669',
          blue: '#0D9488', // Teal 600
          cyan: '#14B8A6', // Teal 500
          glowBlue: '#CCFBF1',
          charcoal: '#0F172A',
          slate: '#475569',
          border: '#E2E8F0',
          surface: '#F8FAFC',
        },
        dark: {
          bg: '#061014', // Deep cyber dark
          surface: '#0B171D',
          card: '#102229',
          cardHover: '#162C34',
          border: '#1E3842',
          text: '#F1F5F9',
          muted: '#94A3B8',
          purple: '#10B981', // Emerald 500 for dark mode primary
          purpleHover: '#34D399', // Emerald 400
          purpleGlow: '#059669',
          green: '#10B981',
          blue: '#14B8A6', // Teal 500
          cyan: '#2DD4BF', // Teal / Mint
          neonPurple: '#00F5A0', // Electric Green
          neonGreen: '#00F5A0',
          neonBlue: '#38BDF8',
          accent: '#00F5A0',
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
        'premium': '0 12px 36px -10px rgba(0, 0, 0, 0.26), 0 4px 12px rgba(16, 185, 129, 0.22)',
        'premium-hover': '0 24px 48px -15px rgba(0, 0, 0, 0.38), 0 6px 18px rgba(16, 185, 129, 0.35)',
        'cyan-glow': '0 0 20px rgba(45, 212, 191, 0.55)',
        'purple-glow': '0 0 25px rgba(16, 185, 129, 0.5)',
        'green-glow': '0 0 25px rgba(0, 245, 160, 0.5)',
        'dark-premium': '0 10px 30px -10px rgba(0, 245, 160, 0.25), 0 1px 1px rgba(0, 0, 0, 0.2)',
        'dark-glow': '0 0 40px rgba(16, 185, 129, 0.4)',
        'dark-card': '0 4px 20px rgba(0, 0, 0, 0.4)',
        'neon-purple': '0 0 30px rgba(0, 245, 160, 0.5), 0 0 60px rgba(16, 185, 129, 0.3)',
        'neon-green': '0 0 30px rgba(0, 245, 160, 0.5), 0 0 60px rgba(16, 185, 129, 0.3)',
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

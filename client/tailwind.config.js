/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        'advercase': ['Advercase', 'system-ui', 'sans-serif'],
      },
      animation: {
        'grid': 'grid 20s linear infinite',
        'pulse-slow': 'pulse-slow 8s ease-in-out infinite',
        'border-flow': 'border-flow 3s linear infinite',
        'pulse-border': 'pulse-border 2s ease-in-out infinite',
        'gradient-x': 'gradient-x 15s ease infinite',
      },
      keyframes: {
        grid: {
          '0%': { transform: 'translateY(0)' },
          '100%': { transform: 'translateY(60px)' },
        },
        'pulse-slow': {
          '0%, 100%': { opacity: '0.1', transform: 'scale(1)' },
          '50%': { opacity: '0.2', transform: 'scale(1.05)' },
        },
        'border-flow': {
          '0%': { left: '-30%' },
          '100%': { left: '100%' },
        },
        'pulse-border': {
          '0%, 100%': { borderColor: 'rgba(0, 239, 166, 0)', transform: 'scale(1)' },
          '50%': { borderColor: 'rgba(0, 239, 166, 0.3)', transform: 'scale(1.02)' },
        },
        'gradient-x': {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
      },
    },
  },
  plugins: [],
}

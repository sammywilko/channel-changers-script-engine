/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./**/*.{js,ts,jsx,tsx}",
    "!./node_modules/**/*"
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        mono: ['Courier Prime', 'Courier New', 'monospace'],
      },
      colors: {
        cinematic: {
          900: '#0a0a0a',
          800: '#121212',
          700: '#1e1e1e',
          600: '#2d2d2d',
          500: '#404040',
          accent: '#E50914',
          gold: '#D4AF37',
        }
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      }
    }
  },
  plugins: [],
}

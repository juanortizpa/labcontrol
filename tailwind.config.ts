import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: 'class',
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-geist-sans)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-geist-mono)', 'monospace'],
      },
      colors: {
        brand: {
          50:  '#E8F4F0',
          100: '#C3E3D6',
          200: '#9DD1BB',
          300: '#6BB89A',
          400: '#3E9F7A',
          500: '#1D7A5A',
          600: '#155E46',
          700: '#0E4332',
          800: '#07281E',
          900: '#030F0A',
        }
      }
    },
  },
  plugins: [],
}
export default config

// dark mode
